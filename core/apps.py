from django.apps import AppConfig
from django.db import connection

class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        """Enable SQLite WAL mode on startup"""
        if connection.vendor == "sqlite":
            with connection.cursor() as cursor:
                cursor.execute("PRAGMA journal_mode=WAL;")  # ✅ Enables WAL mode
                cursor.execute("PRAGMA synchronous=NORMAL;")  # ✅ Improves write speed
                cursor.execute("PRAGMA cache_size=-64000;")  # ✅ Increase cache size
