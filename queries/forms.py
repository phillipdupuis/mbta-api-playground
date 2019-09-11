from django import forms 
from django.forms.widgets import RadioSelect, CheckboxSelectMultiple
from .models import Query, QueryFilter
from params.models import MbtaInclude


class QueryForm(forms.ModelForm):
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
        self.fields['includes'].widget = CheckboxSelectMultiple()
        print(self.fields['includes'].widget)
        self.fields['includes'].queryset = MbtaInclude.objects.all()
