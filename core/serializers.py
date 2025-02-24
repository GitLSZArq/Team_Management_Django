# serializers.py

from rest_framework import serializers
from .models import Project, Task

class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    subtasks = serializers.SerializerMethodField()  # Ensure subtasks is properly declared

    class Meta:
        model = Task
        fields = [
            'id', 'name', 'start_date', 'deadline', 'project',
            'project_name', 'assigned_to', 'assigned_to_name',
            'priority', 'progress', 'parent',
            'subtasks'
        ]

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.start_date = validated_data.get('start_date', instance.start_date)
        instance.deadline = validated_data.get('deadline', instance.deadline)
        instance.project = validated_data.get('project', instance.project)
        instance.progress = validated_data.get('progress', instance.progress)
        instance.priority = validated_data.get('priority', instance.priority)
        instance.parent = validated_data.get('parent', instance.parent)
        instance.save()
        return instance

    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.name if obj.assigned_to else None

    def get_subtasks(self, obj):
        subtasks = Task.objects.filter(parent=obj)  # Get subtasks of the current task
        return TaskSerializer(subtasks, many=True).data


class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    responsible = serializers.SerializerMethodField()  # New field for display

    class Meta:
        model = Project
        fields = ['id', 'name', 'code', 'start_date', 'end_date', 'tasks', 'responsible']
        read_only_fields = ['code']  # mark code as read-only

    def get_responsible(self, obj):
        first_member = obj.members.first()
        return first_member.name if first_member else "N/A"

class TaskTreeSerializer(serializers.ModelSerializer):
    # Recursive field to include subtasks
    subtasks = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'name', 'subtasks']

    def get_subtasks(self, obj):
        # Get all direct children of this task
        children = obj.subtasks.all()  # using the related_name='subtasks'
        if children.exists():
            serializer = TaskTreeSerializer(children, many=True)
            return serializer.data
        return []
    
class ProjectTaskTreeSerializer(serializers.ModelSerializer):
    tasks = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'tasks']

    def get_tasks(self, obj):
        # Only return tasks that do not have a parent (i.e. the roots)
        root_tasks = obj.tasks.filter(parent__isnull=True)
        serializer = TaskTreeSerializer(root_tasks, many=True)
        return serializer.data
