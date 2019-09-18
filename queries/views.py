from django.shortcuts import get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.urls import reverse, reverse_lazy
from django.views import generic
from django.db import transaction
from django.conf import settings
from .forms import QueryForm
from .models import Query, QueryFilter
from params.models import MbtaFilter
import json
from bokeh.plotting import figure, output_file, show, gmap
from bokeh.models import ColumnDataSource, GMapOptions
from bokeh.embed import components, json_item


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


def results_create_graph(request, pk, div, plot_type, x_col=''):
    query = get_object_or_404(Query, pk=pk)
    results = query.get_results(request)
    if plot_type == 'bar':
        value_counts = results.df[x_col].value_counts()
        values = value_counts.index.values.tolist()
        counts = value_counts.values.tolist()
        plot = figure(x_range=values, plot_height=400, title=f'{x_col} counts')
        plot.vbar(x=values, top=counts, width=0.9)
        plot.y_range.start = 0
        data = json_item(plot, div)
        return JsonResponse(data)


def results_create_graph_geo(request, pk, div):
    query = get_object_or_404(Query, pk=pk)
    results = query.get_results(request)
    map_options = GMapOptions(
        lat=results.df['latitude'].median(),
        lng=results.df['longitude'].median(),
        map_type='roadmap',
        zoom=11,
    )
    plot = gmap(settings.GOOGLE_MAPS_API_KEY, map_options, title="Phil's title")
    source = ColumnDataSource(
        data=dict(lat=results.df['latitude'].values.tolist(),
                    lon=results.df['longitude'].values.tolist())
    )
    plot.circle(x='lon', y='lat', size=8, fill_color='blue', fill_alpha=0.8, source=source)
    data = json_item(plot, div)
    return JsonResponse(data)



# def build_graph_from_params(request, pk, plot_type, x, y):
#     # x = [1, 2, 3, 4, 5]
#     # y = [1, 2, 3]
#     # plot = figure(title='blah', x_axis_label='x-ey', y_axis_label='whoknows', plot_width=400, plot_height=400)
#     # plot.line(x, y, line_width=2)
#     # data = json_item(plot, 'my_graph')
#     # new 
#     results = request.session[f'query_{pk}_results']
#     df = results.df
#     if plot_type == 'bar' and x == '---':
#         df = df.groupby(y)

#     data = pandas_highcharts.core.serialize(
#         df,
#         render_to='my_graph',
#         output_type='json',
#         kind=plot_type,
#     )
#     # import pdb; pdb.set_trace()
#     # dataNEW = JsonResponse(data)
#     # import pdb; pdb.set_trace()
#     return HttpResponse(data)