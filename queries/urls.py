from django.urls import path, include
from . import views


app_name = 'queries'
urlpatterns = [
    path('create/', views.QueryCreate.as_view(), name='create'),
    path('results/<int:pk>/', views.QueryResults.as_view(), name='results'),
    path('results/<int:pk>/csv/', views.results_as_csv, name='results-csv'),
    path('results/<int:pk>/create_graph/<str:div>/<int:max_width>/<int:max_height>/<str:plot_type>/',
         include([
             path('', views.results_create_graph),
             path('<str:x>/', views.results_create_graph),
             path('<str:x>/<str:y>/', views.results_create_graph),
         ])
         ),
]
