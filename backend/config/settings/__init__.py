# DJANGO_SETTINGS_MODULE=config.settings resolves here.
# Loads base + development by default; override with config.settings.production in prod.
import os

env = os.getenv('DJANGO_ENV', 'development')

if env == 'production':
    from .production import *
else:
    from .development import *
