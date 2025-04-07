release: python manage.py migrate
web: python manage.py collectstatic --noinput && waitress-serve --port=$PORT puddle.wsgi:application