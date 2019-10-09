from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.urls import reverse, reverse_lazy
from django.views import generic
from django.db import transaction
from .forms import QueryForm
from .models import Query, QueryFilter, Request
from params.models import MbtaFilter
import json
import logging


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
        context['report_correlations'] = ['pearson', 'spearman', 'kendall', 'phi_k', 'cramers', 'recoded']
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


def results_create_report(request, pk, correlations):
    """ Generates a pandas profiling report. Spits back the HTML for the entire doc.
        Unfortunately this includes all the bootstrap stuff, so it's huge.
        Gotta embed it in an iframe """
    query = get_object_or_404(Query, pk=pk)
    results = query.get_results(request, get_from_cache=True)
    correlations = None if correlations == 'NONE' else correlations.split(',')
    try:
        report = results.generate_report_html(correlations=correlations)
        return HttpResponse(report)
    except Exception as e:
        logging.exception(f'Error creating profile report: {e}')
        return HttpResponse(status=500)
