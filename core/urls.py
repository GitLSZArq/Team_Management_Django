from django.urls import path, include  # Now include is imported
from .views import project_list, TaskList, person_list, ProjectList, TaskUpdate
from .views import ProjectViewSet, TaskHierarchyView  # Adjust the import if your views file is in a different module
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')

urlpatterns = [
    path('projects/', project_list, name='project_list'),
    path('tasks/', TaskList.as_view(), name='task_list'),
    path('people/', person_list, name='person_list'),
    path('api/projects/', project_list, name='project-list'),
    path('api/tasks/', TaskList.as_view(), name='task-list'),
    path('api/tasks/<int:pk>/', TaskUpdate.as_view(), name='task-update'),
    path('api/people/', person_list, name='person-list'),
    path('api/', include(router.urls)),
    path('api/task-hierarchy/', TaskHierarchyView.as_view(), name='task_hierarchy'),
]
