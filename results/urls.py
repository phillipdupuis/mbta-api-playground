from django.urls import path
from . import views


app_name = 'results'
urlpatterns = [
    path('view/<int:pk>/', views.results_view, name='view'),
]
