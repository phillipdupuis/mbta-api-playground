from django.shortcuts import render
from django.views import generic
from queries.models import Query
from .models import Results

class ResultsView(generic.DetailView):

	model = Query





# Create your views here.
def get_query_results(request, query):
    key = f'query_{query.pk}_results'
    if key in request.session:
        results = request.session[key]
    else:
        results = Results(query.get_response())
        request.session[key] = results
    return results
