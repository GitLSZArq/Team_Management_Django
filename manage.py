#!/usr/bin/env python
import os
import sys

def ignore_dirs():
    """Remove unnecessary directories from Django's file watching system"""
    import django
    from django.conf import settings

    django.setup()  # ✅ Ensure Django apps are loaded before modifying settings

    python_dir = os.path.dirname(sys.executable)
    excluded_dirs = [
        os.path.join(python_dir, "Lib", "site-packages"),
        os.path.join(python_dir, "DLLs"),
    ]

    # Dynamically adjust watched directories
    if hasattr(settings, "STATICFILES_DIRS"):
        settings.STATICFILES_DIRS = [
            dir_path for dir_path in settings.STATICFILES_DIRS if dir_path not in excluded_dirs
        ]

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "team_management.settings")

    # ✅ Initialize Django before calling the function
    import django
    django.setup()  # Ensures all apps are loaded before making changes

    # ✅ Now we can safely run the function
    ignore_dirs()

    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
