from django.shortcuts import get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.urls import reverse, reverse_lazy
from django.views import generic
from django.db import transaction
from .forms import QueryForm
from .models import Query, QueryFilter
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

    def form_valid(self, form):
        with transaction.atomic():
            filters = json.loads(form.cleaned_data['filters'])
            self.object = form.save()
            for id_, values in filters.items():
                a = MbtaFilter.objects.get(pk=id_)
                QueryFilter.objects.create(query=self.object, on_attribute=a, values=','.join(values))
        return super(QueryCreate, self).form_valid(form)

    def get_success_url(self):
        return reverse('queries:results', kwargs={'pk': self.object.pk})


class QueryResults(generic.DetailView):
    model = Query
    template_name = 'queries/results.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['results'] = context['query'].get_results(self.request)
        return context


def results_as_csv(request, pk):
    query = get_object_or_404(Query, pk=pk)
    results = query.get_results(request)
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="mbta_api_query_{query.pk}.csv"'
    results.df.to_csv(path_or_buf=response, index=False)
    return response


def results_create_graph(request, pk, div, plot_type, x=None, y=None):
    query = get_object_or_404(Query, pk=pk)
    results = query.get_results(request)

    if plot_type == 'BAR':
        value_counts = results.df[x].value_counts()
        values = value_counts.index.values.tolist()
        counts = value_counts.values.tolist()
        plot = figure(x_range=[str(v) for v in values], plot_height=400, title=f'{x} counts')
        plot.vbar(x=values, top=counts, width=0.9)
        plot.y_range.start = 0

    elif plot_type.endswith('LOCATIONS'):

        latlon_proj = Proj(init='epsg:4326')
        webmercator_proj = Proj(init='epsg:3857')
        col_prefix = plot_type[:-len('LOCATIONS')]
        lat_column = f'{col_prefix}latitude'
        lon_column = f'{col_prefix}longitude'

        def transform_coordinates(data):
            x, y = transform(latlon_proj, webmercator_proj, data[lon_column], data[lat_column])
            return pd.Series({'x': x, 'y': y})

        coords = results.df.apply(transform_coordinates, axis=1)

        title = f'{query.primary_object.name} Locations' if not col_prefix else f'{col_prefix.rstrip("_")} Locations'
        plot = figure(
            x_range=(coords.x.min(), coords.x.max()),
            y_range=(coords.y.min(), coords.y.max()),
            x_axis_type='mercator',
            y_axis_type='mercator',
            title=title,
        )
        plot.add_tile(get_provider(Vendors.CARTODBPOSITRON_RETINA))
        source = ColumnDataSource(data=dict(x=coords.x.tolist(), y=coords.y.tolist()))
        plot.circle(x='x', y='y', size=8, fill_color='blue', fill_alpha=0.8, source=source)

    data = json_item(plot, div)
    return JsonResponse(data)
