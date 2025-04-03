web: gunicorn puddle.wsgi --workers 2 --timeout 120
release: python manage.py migrate && python manage.py collectstatic --noinput

web: daphne puddle.asgi:application --port $PORT --bind 0.0.0.0
worker: python manage.py runworker