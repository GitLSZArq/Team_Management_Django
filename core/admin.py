# admin.py

from django.contrib import admin
from django.utils.safestring import mark_safe
from django import forms
from .models import Person, Project, Task
from .forms import HierarchicalTaskSelect

admin.site.register(Person)
admin.site.register(Project)

class TaskAdminForm(forms.ModelForm):
    class Meta:
        model = Task
        fields = '__all__'
        widgets = {
            'parent': HierarchicalTaskSelect(),
        }

class TaskAdmin(admin.ModelAdmin):
    form = TaskAdminForm
    list_display = ['indented_name', 'project', 'parent', 'assigned_to', 'deadline']
    list_filter = ['project', 'assigned_to']
    search_fields = ['name']
    list_per_page = 50

    def indented_name(self, obj):
        level = 0
        current = obj.parent
        while current:
            level += 1
            current = current.parent
        return mark_safe('&nbsp;' * 4 * level + obj.name)
    indented_name.short_description = 'Task'

admin.site.register(Task, TaskAdmin)
