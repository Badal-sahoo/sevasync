#!/usr/bin/env bash
# Render "Build Command":  ./build.sh
# Requires env var DJANGO_ENV=production (plus DATABASE_URL, SECRET_KEY, etc.)
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
