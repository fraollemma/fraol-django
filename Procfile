web: daphne puddle.asgi:application --port $PORT --bind 0.0.0.0
worker: python manage.py runworker

release: python manage.py migrate
release: python manage.py collectstatic --noinput