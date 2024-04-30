from django.db import models

class Person(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    position = models.CharField(max_length=100)
    company = models.CharField(max_length=100, blank=True)  # Optional field

    def __str__(self):
        return f"{self.name} ({self.company})"


class Project(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    members = models.ManyToManyField('Person', related_name='projects')

    def __str__(self):
        return self.name

class Task(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    name = models.CharField(max_length=100)
    assigned_to = models.ForeignKey(Person, on_delete=models.SET_NULL, null=True, related_name='tasks')
    start_date = models.DateField()
    deadline = models.DateField()  # Changed from end_date
    actual_end_date = models.DateField(null=True, blank=True)
    progress = models.IntegerField(default=0)  # Progress as a percentage

    def __str__(self):
        return self.name
