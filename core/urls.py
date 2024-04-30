from django.urls import path
from . import views

urlpatterns = [
    path('projects/', views.project_list, name='project_list'),
    path('tasks/', views.task_list, name='task_list'),
    path('people/', views.person_list, name='person_list'),  # Ensure this is defined
]
