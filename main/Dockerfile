FROM python:latest

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY requirements.txt /app/

RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "main.asgi:application"]
#CMD ["python", "manage.py", "runserver", "0.0.0.0:80"]
EXPOSE 8000