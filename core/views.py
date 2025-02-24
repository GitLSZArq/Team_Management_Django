from django.shortcuts import render
from .models import Person, Project, Task
from rest_framework import generics, viewsets , status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import RetrieveUpdateAPIView, ListAPIView
from .serializers import TaskSerializer, ProjectSerializer, ProjectTaskTreeSerializer
from django.http import JsonResponse
import logging
from django.conf import settings
from django.http import HttpResponse
import os

def serve_react_frontend(request):
    frontend_build_path = os.path.join(settings.BASE_DIR, 'frontend', 'build', 'index.html')

    if not os.path.exists(frontend_build_path):
        return HttpResponse("React build not found. Did you run `npm run build`?", status=500)

    with open(frontend_build_path, "r") as file:
        return HttpResponse(file.read(), content_type='text/html')


def project_list(request):
    projects = Project.objects.all()
    serializer = ProjectSerializer(projects, many=True)
    return JsonResponse(serializer.data, safe=False)

def person_list(request):
    people = list(Person.objects.all().values())
    return JsonResponse(people, safe=False)

class TaskList(generics.ListAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

def task_list(request):
    tasks = Task.objects.all()
    return render(request, 'core/task_list.html', {'tasks': tasks})

class ProjectList(generics.ListAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

class ProjectListView(ListAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

logger = logging.getLogger(__name__)

class TaskUpdate(RetrieveUpdateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def update(self, request, *args, **kwargs):
        task_id = kwargs.get('pk')
        logger.debug('Received update request for task ID: %s', task_id)
        logger.debug('Request data: %s', request.data)
        return super().update(request, *args, **kwargs)

class TaskDetailView(APIView):
    def put(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = TaskSerializer(task, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class TaskHierarchyView(APIView):
    """
    API endpoint that returns projects with their tasks nested recursively.
    """
    def get(self, request):
        projects = Project.objects.all()
        serializer = ProjectTaskTreeSerializer(projects, many=True)
        return Response(serializer.data)