from django.shortcuts import render
from django.urls import reverse, reverse_lazy
from django.views import generic
from django.db import transaction
from params.models import MbtaObject, MbtaInclude, MbtaFilter
from .forms import QueryForm
from params.views import ObjectList
import json


class QueryCreate(generic.CreateView):
    form_class = QueryForm
    template_name = 'queries/create.html'
    success_url = reverse_lazy('home')

    def get_context_data(self, **kwargs):
        # objects_data = {}
        # for obj in MbtaObject.objects.all():
        #     objects_data[obj.pk] = {
        #         'name': obj.name,
        #         'includes': [inc.pk for inc in obj.includes.all()],
        #         'attributes': [attr.pk for attr in obj.attributes.all()],
        #         'filters': [f.pk for f in obj.filters.all()],
        #     }

        includes_data = {}
        for inc in MbtaInclude.objects.all():
            includes_data[inc.pk] = {
                'associatedObject': None if not inc.associated_object else inc.associated_object.pk,
            }

        filters_data = {}
        for filter_ in MbtaFilter.objects.all():
            filters_data[filter_.pk] = {
                'name': filter_.name,
                'forObject': filter_.for_object.pk,
                'associatedObject': None if not filter_.associated_object else filter_.associated_object.pk,
            }

        context = super(QueryCreate, self).get_context_data(**kwargs)
        # context['objects_data'] = json.dumps(objects_data)
        # objects_data = ObjectList.as_view()(self.request).render().content
        # context['objects_data'] = objects_data
        context['includes_data'] = json.dumps(includes_data)
        context['filters_data'] = json.dumps(filters_data)
        return context

    def form_valid(self, form):
        with transaction.atomic():
            self.object = form.save()
        return super(QueryCreate, self).form_valid(form)

    def get_success_url(self):
        return reverse('query-results', kwargs={'pk': self.object.pk})