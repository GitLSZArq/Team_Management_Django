from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView
from django.urls import re_path


urlpatterns = [
    path('admin/', admin.site.urls),
    path('core/', include('core.urls')),  # Make sure this is correct
    path('core/api/', include('core.api.urls')),  # Adjust the path as necessary
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]
