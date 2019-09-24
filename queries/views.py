from django.shortcuts import get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.urls import reverse, reverse_lazy
from django.views import generic
from django.db import transaction
from django.db.models import Max as db_models_Max
from .forms import QueryForm
from .models import Query, QueryFilter, Request
from params.models import MbtaFilter
import json
from bokeh.plotting import figure
from bokeh.models import ColumnDataSource
from bokeh.embed import json_item
from bokeh.tile_providers import get_provider, Vendors
from pyproj import Proj, transform
import pandas as pd


class QueryCreate(generic.CreateView):
    form_class = QueryForm
    template_name = 'queries/create.html'
    success_url = reverse_lazy('home')

    def get_context_data(self, **kwargs):
        """ Send out API endpoints for the parameters so javascript can make
            asynchronous requests to refine what options are available """
        context = super().get_context_data(**kwargs)
        context['endpoints'] = {
            'params': {
                'objects': reverse('params:objects'),
            }
        }
        return context

    def form_valid(self, form):
        with transaction.atomic():
            filters = json.loads(form.cleaned_data['filters'])
            self.object = form.save()
            for id_, values in filters.items():
                a = MbtaFilter.objects.get(pk=id_)
                QueryFilter.objects.create(
                    query=self.object, on_attribute=a, values=','.join(values))
        return super(QueryCreate, self).form_valid(form)

    def get_success_url(self):
        return reverse('queries:results', kwargs={'pk': self.object.pk})


class RequestList(generic.ListView):
    """ Simple enough, shows recent requests (i.e. query invocations) in
        descending order by datetime. Groups of 5 per page."""
    model = Request
    ordering = ['-datetime']
    template_name = 'queries/request_list.html'
    paginate_by = 5


class QueryResults(generic.DetailView):
    """ The 'Results' model (which is memory-only) actually drives the majority
        of what is seen in this view. It gets set up as part of get_context_data."""
    model = Query
    template_name = 'queries/results.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['results'] = context['query'].get_results(self.request)
        return context


def results_as_csv(request, pk):
    """
    For a given query, this will convert the pandas dataframe of results into
    a CSV file and download it onto the user's device.
    """
    query = get_object_or_404(Query, pk=pk)
    results = query.get_results(request, get_from_cache=True)
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="mbta_api_query_{query.pk}.csv"'
    results.df.to_csv(path_or_buf=response, index=False)
    return response


def results_create_graph(request, pk, div, max_width, max_height, plot_type, x=None, y=None):
    """
    Given a set of parameters, produces a bokeh plot.
    Sends back JSON for an interactive plot element that will be embedded in the page.
    """
    query = get_object_or_404(Query, pk=pk)
    results = query.get_results(request, get_from_cache=True)
    width = min(max_width, 600)
    height = min(max_height, 600)

    if plot_type == 'BAR':
        value_counts = results.df[x].value_counts()
        values = value_counts.index.values.tolist()
        counts = value_counts.values.tolist()
        plot = figure(x_range=[str(v) for v in values], title=f'{x} counts', plot_width=width, plot_height=height)
        plot.vbar(x=values, top=counts, width=0.9)
        plot.y_range.start = 0

    elif plot_type.endswith('LOCATIONS'):

        latlon_proj = Proj(init='epsg:4326')
        webmercator_proj = Proj(init='epsg:3857')
        col_prefix = plot_type[:-len('LOCATIONS')]
        lat_column = f'{col_prefix}latitude'
        lon_column = f'{col_prefix}longitude'

        def transform_coordinates(data):
            x, y = transform(latlon_proj, webmercator_proj,
                             data[lon_column], data[lat_column])
            return pd.Series({'x': x, 'y': y})

        coords = results.df.apply(transform_coordinates, axis=1)

        title = f'{query.primary_object.name} Locations' if not col_prefix else f'{col_prefix.rstrip("_")} Locations'
        plot = figure(
            x_range=(coords.x.min(), coords.x.max()),
            y_range=(coords.y.min(), coords.y.max()),
            x_axis_type='mercator',
            y_axis_type='mercator',
            title=title,
            plot_width=width,
            plot_height=height,
        )
        plot.add_tile(get_provider(Vendors.CARTODBPOSITRON_RETINA))
        source = ColumnDataSource(
            data=dict(x=coords.x.tolist(), y=coords.y.tolist()))
        plot.circle(x='x', y='y', size=8, fill_color='blue',
                    fill_alpha=0.8, source=source)

    data = json_item(plot, div)
    return JsonResponse(data)
