from django import forms
from django.forms.widgets import CheckboxSelectMultiple
from .models import Query
from params.models import MbtaObject, MbtaInclude, MbtaAttribute


class QueryForm(forms.ModelForm):
    filters = forms.CharField(widget=forms.HiddenInput())

    class Meta:
        model = Query
        fields = ['primary_object', 'includes', 'attributes']
        widgets = {
            'includes': CheckboxSelectMultiple(),
            'attributes': CheckboxSelectMultiple(),
        }

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('label_suffix', '')
        super(QueryForm, self).__init__(*args, **kwargs)
        self.fields['primary_object'].queryset = MbtaObject.objects.filter(active=True)
        self.fields['includes'].queryset = MbtaInclude.objects.filter(active=True)
        self.fields['attributes'].queryset = MbtaAttribute.objects.filter(active=True)
