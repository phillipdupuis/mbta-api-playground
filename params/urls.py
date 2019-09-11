from django.urls import path
from . import views


app_name = 'params'
urlpatterns = [
    path('objects/', views.ObjectList.as_view(), name='object-list'),
]
