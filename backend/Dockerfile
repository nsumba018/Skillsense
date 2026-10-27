FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/backend/
COPY ml/ /app/ml/
COPY data/ /app/data/

WORKDIR /app/backend

# collectstatic needs a SECRET_KEY but not the real one; supply a dummy at build time
RUN SECRET_KEY=build-placeholder DEBUG=False DB_NAME=x DB_USER=x DB_PASSWORD=x \
    python manage.py collectstatic --noinput 2>/dev/null || true

EXPOSE 8000

CMD ["gunicorn", "skillsense_backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
