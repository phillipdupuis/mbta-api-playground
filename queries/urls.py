from django.urls import path
from . import views


app_name = 'queries'
urlpatterns = [
    path('create/', views.QueryCreate.as_view(), name='create'),
    path('results/<int:pk>/', views.QueryResults.as_view(), name='results'),
    path('results/<int:pk>/csv/', views.results_as_csv, name='results-csv'),
    path('results/<int:pk>/create_graph/<str:div>/<str:plot_type>/<str:x_col>/',
         views.results_create_graph, name='results-create-graph'),
    path('results/<int:pk>/create_graph/geo/<str:div>/', views.results_create_graph_geo, name='results-create-graph-geo'),
]
