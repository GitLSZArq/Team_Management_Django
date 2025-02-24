from django import forms
from django.utils.safestring import mark_safe

class HierarchicalTaskSelect(forms.Widget):
    template_name = 'admin/hierarchical_task_select.html'
    
    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        # Build a nested data structure: for each project, include its root tasks,
        # and for each task, recursively include its subtasks.
        from .models import Project  # import here to avoid circular imports
        projects = Project.objects.all()
        data = []
        for project in projects:
            data.append({
                'id': f'project-{project.id}',
                'name': project.name,
                'tasks': self.get_task_tree(project)
            })
        context['widget'].update({
            'data': data,
            'name': name,
            'value': value or '',
        })
        return context

    def get_task_tree(self, project):
        # Build the task tree for this project starting with root tasks (those with no parent)
        def build_tree(task):
            children = []
            for sub in task.subtasks.all():
                children.append({
                    'id': sub.id,
                    'name': sub.name,
                    'children': build_tree(sub)
                })
            return children

        tree = []
        root_tasks = project.tasks.filter(parent__isnull=True)
        for task in root_tasks:
            tree.append({
                'id': task.id,
                'name': task.name,
                'children': build_tree(task)
            })
        return tree

    def render(self, name, value, attrs=None, renderer=None):
        # If renderer is not provided, get the default renderer
        if renderer is None:
            from django.forms.renderers import get_default_renderer
            renderer = get_default_renderer()
        context = self.get_context(name, value, attrs)
        return mark_safe(renderer.render(self.template_name, context))
