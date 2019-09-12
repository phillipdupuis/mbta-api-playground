from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.urls import reverse, reverse_lazy
from django.views import generic
from django.db import transaction
from .forms import QueryForm
from .models import Query


class QueryCreate(generic.CreateView):
    form_class = QueryForm
    template_name = 'queries/create.html'
    success_url = reverse_lazy('home')

    def form_valid(self, form):
        with transaction.atomic():
            self.object = form.save()
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
