from django.shortcuts import render
from .models import Person, Project, Task

def project_list(request):
    projects = Project.objects.all()
    return render(request, 'core/project_list.html', {'projects': projects})

def task_list(request):
    tasks = Task.objects.all()
    return render(request, 'core/task_list.html', {'tasks': tasks})

def person_list(request):
    people = Person.objects.all()
    return render(request, 'core/person_list.html', {'people': people})