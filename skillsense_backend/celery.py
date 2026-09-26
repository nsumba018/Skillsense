import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skillsense_backend.settings')

app = Celery('skillsense_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
