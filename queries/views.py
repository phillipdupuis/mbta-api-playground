from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.urls import reverse, reverse_lazy
from django.views import generic
from django.db import transaction
from .forms import QueryForm
from .models import Query, QueryFilter
from params.models import MbtaFilter
import json
from bokeh.plotting import figure, output_file, show
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


def results_create_graph(request, pk, graph_type, column_one):
    query = get_object_or_404(Query, pk=pk)
    results = query.get_results(request)
    
    print('graph type', graph_type)
    print('col one', column_one)
    return HttpResponse('hi')




def build_graph_from_params(request, pk, plot_type, x, y):
    # x = [1, 2, 3, 4, 5]
    # y = [1, 2, 3]
    # plot = figure(title='blah', x_axis_label='x-ey', y_axis_label='whoknows', plot_width=400, plot_height=400)
    # plot.line(x, y, line_width=2)
    # data = json_item(plot, 'my_graph')
    # new 
    results = request.session[f'query_{pk}_results']
    df = results.df
    if plot_type == 'bar' and x == '---':
        df = df.groupby(y)

    data = pandas_highcharts.core.serialize(
        df,
        render_to='my_graph',
        output_type='json',
        kind=plot_type,
    )
    # import pdb; pdb.set_trace()
    # dataNEW = JsonResponse(data)
    # import pdb; pdb.set_trace()
    return HttpResponse(data)