from django.urls import path
from . import views


app_name = 'queries'
urlpatterns = [
    path('create/', views.QueryCreate.as_view(), name='create'),
    path('requests/', views.RequestList.as_view(), name='request-list'),
    path('results/<int:pk>/', views.QueryResults.as_view(), name='results'),
    path('results/<int:pk>/csv/', views.results_as_csv, name='results-csv'),
    path('results/<int:pk>/report/<str:correlations>/', views.results_create_report),
    path('results/<int:pk>/dtale/', views.results_dtale, name='results-dtale'),
]
