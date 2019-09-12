from django.urls import path
from . import views


app_name = 'queries'
urlpatterns = [
    path('create/', views.QueryCreate.as_view(), name='create'),
    path('results/<int:pk>/', views.QueryResults.as_view(), name='results'),
    path('results/<int:pk>/csv/', views.results_as_csv, name='results-csv'),
]
