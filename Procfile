release: python manage.py check --deploy && python manage.py migrate
web: gunicorn puddle.wsgi --workers=$WEB_CONCURRENCY --timeout 120 --bind 0.0.0.0:$PORT