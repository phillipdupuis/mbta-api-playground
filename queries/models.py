from django.db import models
from django.conf import settings
from django.utils import timezone
from typing import List
from collections import OrderedDict
import json
import requests
import pandas as pd
import pandas_profiling
import matplotlib
matplotlib.use('Agg')
from bokeh.plotting import figure
from bokeh.models import ColumnDataSource, HoverTool
from bokeh.embed import json_item
from bokeh.tile_providers import get_provider, Vendors
from pyproj import Proj, transform
from params.models import MbtaObject, MbtaInclude, MbtaAttribute, MbtaFilter


class Query(models.Model):
    """
    Defines the parameters for a query to the MBTA API.
    Allows the user to define a primary resource, included resources, attributes,
    and filters.
    """
    primary_object = models.ForeignKey(
        MbtaObject,
        on_delete=models.CASCADE,
        verbose_name='Object',
        related_name='queries',
    )
    includes = models.ManyToManyField(
        MbtaInclude,
        verbose_name='Include',
        related_name='included_in_queries',
        blank=True,
    )
    attributes = models.ManyToManyField(
        MbtaAttribute,
        verbose_name='Attributes',
        related_name='included_in_queries',
    )
    url = models.CharField(max_length=500, default='')

    def __str__(self):
        return self.url

    def all_objects(self) -> List[MbtaObject]:
        objects = [self.primary_object]
        for include in self.includes.filter(associated_object__isnull=False):
            objects.append(include.associated_object)
        return objects

    def get_response(self, request) -> requests.Response:
        user = request.user if request.user.is_authenticated else None
        response = Request(query=self, user=user).get()
        self.url = response.url
        self.save()
        return response

    def get_results(self, request, get_from_cache=False):
        """ Get results. Use the session cache to store them for quick access """
        key = f'query_{self.id}_results'
        if get_from_cache and (key in request.session):
            results = request.session[key]
        else:
            results = Results(self.get_response(request))
            request.session[key] = results
        return results


class QueryFilter(models.Model):
    """
    Represents a single filter attached to the query. Links the query with a filter
    from the parameters and defines the filter value.
    """
    query = models.ForeignKey(
        Query,
        on_delete=models.CASCADE,
        related_name='filters',
        related_query_name='filter',
    )
    on_attribute = models.ForeignKey(
        MbtaFilter,
        on_delete=models.CASCADE,
        related_name='query_instances',
        related_query_name='query_instance',
    )
    values = models.CharField(max_length=200)

    def __str__(self):
        return f'{self.on_attribute} = {self.values}'


class Request(models.Model):
    """
    Created any time a user wants to get/view the results of a given query.
    Handles building the request URL, headers, and parameters, as well as
    sending the request to the MBTA API and receiving the response.

    The user, datetime, and response status code are logged. This also handles
    updating the 'url' field on the Query.
    """

    query = models.ForeignKey(
        Query,
        on_delete=models.CASCADE,
        related_name='requests',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        default=None,
    )
    datetime = models.DateTimeField('date/time', default=timezone.now)
    response_status_code = models.PositiveSmallIntegerField(
        'status code', blank=True, null=True)
    response_size_bytes = models.IntegerField('response size', blank=True, null=True)

    class Meta:
        ordering = ['-datetime']

    def __str__(self):
        return f'{self.query} -> {self.response_status_code}'

    def url(self) -> str:
        return requests.compat.urljoin('https://api-v3.mbta.com', self.query.primary_object.path)

    def headers(self) -> dict:
        return {'X-API-Key': settings.MBTA_API_KEY}

    def params(self) -> OrderedDict:
        params = OrderedDict()
        if self.query.includes.all().exists():
            params['include'] = ','.join(
                (x.name for x in self.query.includes.all()))
        for f in self.query.filters.all():
            params[f'filter[{f.on_attribute.name}]'] = f.values
        for o in self.query.all_objects():
            sel_attrs = [
                a.name for a in self.query.attributes.filter(for_object=o)]
            all_attrs = [a.name for a in o.attributes.all()]
            if sorted(sel_attrs) != sorted(all_attrs):
                params[f'fields[{o.name.lower()}]'] = ",".join(sel_attrs)
        return params

    def get(self) -> requests.Response:
        """ Converts a query into a request and then gets the response """
        response = requests.get(
            self.url(), headers=self.headers(), params=self.params())
        self.datetime = timezone.now()
        self.response_status_code = response.status_code
        self.response_size_bytes = len(response.content)
        self.save()
        return response


class Results:
    """
    This model is not stored in any database.
    It handles converting a query response into useful data.
    Any time a query is invoked, it will use the response from the
    MBTA API to construct a Results object instance.

    The properties and methods are used to construct displays or
    screen components in web pages so that users can interact with
    the results of their queries.
    """

    def __init__(self, response: requests.Response):
        self.response = response
        if response.ok:
            try:
                self.df = create_DataFrame(response)
                reduce_DataFrame_memory_usage(self.df)
                self.error = None
                self.error_details = None
                self.response_size_bytes = len(response.content)
            except AssertionError as error:
                self.df = None
                self.error = error
                self.error_detail = ''
        else:
            self.df = None
            self.error = f'{response.status_code} {response.reason}'
            self.error_details = get_error_details(response)

    @property
    def data_frame(self) -> pd.DataFrame:
        return self.df

    @property
    def data_frame_rows(self):
        class data_frame_cell:
            def __init__(self, row, col, df):
                self.row_id = row
                self.col_id = col
                self.value = df.at[row, col]

        class data_frame_row:
            def __init__(self, row, df):
                self.id = row
                self.cells = [data_frame_cell(row, col, df)
                              for col in df.columns]

        return [data_frame_row(row, self.df) for row in self.df.index]

    @property
    def pretty_json(self) -> str:
        return json.dumps(self.response.json(), sort_keys=True, indent=2)

    @property
    def column_dtypes(self) -> dict:
        return {col: self.df[col].dtype.name for col in self.df.columns}

    def generate_report_html(self, correlations=None) -> str:
        """ Produce a report using the pandas-profiling module """
        df = self.df.applymap(lambda v: tuple(v) if type(v) == list else v)
        correlations = [] if correlations is None else correlations
        corr_options = ['pearson', 'spearman', 'kendall', 'phi_k', 'cramers', 'recoded']
        corrs = {k: True if k in correlations else False for k in corr_options}
        return df.profile_report(correlations=corrs).to_html()

    def location_plots(self):
        """ blah blah blah """
        latlon_proj = Proj(init='epsg:4326')
        webmercator_proj = Proj(init='epsg:3857')

        def get_coord_transform_func(lat_column, lon_column):
            """ creates and returns a function for transforming lat & lon columns into x-y"""
            def transform_func(data):
                x, y = transform(latlon_proj, webmercator_proj, data[lon_column], data[lat_column])
                return pd.Series({'x': x, 'y': y})

            return transform_func

        lat_columns = [c for c in self.df.columns if c.endswith('latitude')]
        lon_columns = [c for c in self.df.columns if c.endswith('longitude')]
        plots = []

        for lat_column in lat_columns:
            col_prefix = lat_column[:-len('latitude')]
            lon_column = f'{col_prefix}longitude'
            if lon_column in lon_columns:
                transform_func = get_coord_transform_func(lat_column, lon_column)
                coords = self.df.apply(transform_func, axis=1)
                title = 'Locations' if not col_prefix else f'{col_prefix.rstrip("_").title()} Locations'
                source = ColumnDataSource(data=dict(
                    x=coords.x.tolist(),
                    y=coords.y.tolist(),
                    id=self.df[f'{col_prefix}id'].tolist(),
                    latitude=self.df[lat_column].tolist(),
                    longitude=self.df[lon_column].tolist()
                ))
                hover = HoverTool(tooltips=[
                    ('id', '@id'),
                    ('latitude', '@latitude'),
                    ('longitude', '@longitude')
                ])
                plot = figure(
                    x_range=(coords.x.min(), coords.x.max()),
                    y_range=(coords.y.min(), coords.y.max()),
                    x_axis_type='mercator',
                    y_axis_type='mercator',
                    title=title,
                    plot_width=600,
                    plot_height=600,
                    sizing_mode='scale_both',
                )
                plot.add_tools(hover)
                plot.add_tile(get_provider(Vendors.CARTODBPOSITRON_RETINA))
                plot.circle(x='x', y='y', size=8, fill_color='blue', fill_alpha=0.8, source=source)
                data = json_item(plot, 'id_location_plots')
                plots.append(data)

        return plots


def create_DataFrame(response: requests.Response) -> pd.DataFrame:
    """ Creates a pandas DataFrame from the MBTA API response """
    assert response.json()['data'], 'response contained no data'
    main_df = pd.DataFrame(response.json()['data'])
    assert main_df['type'].nunique() == 1, 'more than one type'
    main_type = main_df['type'].unique()[0]
    main_df = clean_DataFrame(main_df)

    if 'included' in response.json():
        main_df = prefix_DataFrame_columns(main_df, f'{main_type}_')

        for inc_type, inc_df in pd.DataFrame(response.json()['included']).groupby('type'):

            if main_type == 'route_pattern' and inc_type == 'trip':
                inc_type = 'representative_trip'

            inc_df = clean_DataFrame(inc_df)
            inc_df = prefix_DataFrame_columns(inc_df, f'{inc_type}_')

            main_id_column = f'{main_type}_{inc_type}'
            if main_id_column == 'line_route':
                main_id_column = 'line_routes'
            inc_id_column = f'{inc_type}_id'

            main_df = main_df.merge(
                inc_df, how='left', left_on=main_id_column, right_on=inc_id_column)
            main_df.drop(columns=[main_id_column], inplace=True)

    return main_df


def clean_DataFrame(df: pd.DataFrame) -> pd.DataFrame:
    """ Drop useless columns, expand others that contain nested data """

    def expand_columns(df, columns) -> pd.DataFrame:
        """ Expands a column containing nested data into separate columns"""
        columns = [c for c in columns if c in df.columns]
        if any(columns):
            new_dfs = [convert_column_to_dataframe(df, c) for c in columns]
            return df.drop(columns=columns).join(new_dfs)
        else:
            return df

    def convert_column_to_dataframe(df, column) -> pd.DataFrame:
        """ Converts a column of data into its own dataframe,
            which will ultimately be joined to the main dataframe."""
        if column == 'attributes':
            return df['attributes'].apply(pd.Series)

        elif column == 'relationships':
            def get_data_id(x):
                if isinstance(x, pd.Series):
                    return x.apply(get_data_id)
                else:
                    try:
                        return x['data']['id']
                    except (TypeError, KeyError):
                        return None
            return df['relationships'].apply(pd.Series).apply(get_data_id)

        elif column == 'properties':
            def props_list_to_dict(props_list):
                return {prop['name']: prop['value'] for prop in props_list}
            return df['properties'].map(props_list_to_dict).apply(pd.Series)

    def convert_datetime_columns(df):
        """ Convert datetime columns from ISO8601 to pandas datetime format"""
        for column in df.columns:
            if column.endswith(('created_at', 'updated_at')):
                df[column] = pd.to_datetime(df[column])

    df = df.drop(columns=[c for c in ('links', 'type') if c in df.columns])
    df = expand_columns(df, columns=['attributes', 'relationships'])
    df = expand_columns(df, columns=['properties'])
    convert_datetime_columns(df)
    return df

    # # if 'informed_entity' in df.columns:
    # #     informed_entity = df['informed_entity'].apply(pd.Series).stack().reset_index(level=1, drop=True).apply(pd.Series)
    # #     df = df.drop(columns=['informed_entity']).join(informed_entity, how='outer').reset_index(drop=True)


def prefix_DataFrame_columns(df: pd.DataFrame, prefix: str) -> pd.DataFrame:
    """ Renames columns, adding a prefix """
    def rename_function(column_name):
        return f'{prefix}{column_name}'

    return df.rename(rename_function, axis='columns')


def reduce_DataFrame_memory_usage(df: pd.DataFrame) -> None:
    """ Reduce memory usage by converting columns to categorical type """
    for column in df.columns:
        try:
            if df[column].nunique() < (df[column].size // 5):
                df[column] = df[column].astype('category')
        except TypeError:
            pass


def get_error_details(response: requests.Response) -> str:
    """ Returns a string with details describing the request error(s) """
    try:
        details = [error['detail'] for error in response.json()['errors']]
        return '\n'.join(details)
    except KeyError:
        return ''
