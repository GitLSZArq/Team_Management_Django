from django.contrib import admin
from .models import Person, Project, Task

admin.site.register(Person)
admin.site.register(Project)
admin.site.register(Task)
