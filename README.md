Web-Messenger
---

![Static Badge ](https://img.shields.io/badge/python-3.12.1-blue)
![Static Badge](https://img.shields.io/badge/django-4.2-blue)
![Static Badge](https://img.shields.io/badge/daphne-4.0-blue)
![Static Badge](https://img.shields.io/badge/channels-4.0-blue)
![Static Badge](https://img.shields.io/badge/Redis-red)
![Static Badge](https://img.shields.io/badge/PostgreSQL-green)

---
# Showcase

Try it for yourself http://77.222.37.206:8000/messenger/

![Снимок экрана 2024-05-13 155939](https://github.com/egorgur/Basic-Web-Messenger/assets/122800013/219d9fb4-9939-4f0a-a44e-695f77eae900)
![Снимок экрана 2024-05-13 154136](https://github.com/egorgur/Basic-Web-Messenger/assets/122800013/1b60edd7-8284-4312-9425-17df06469d12)
Room modals

![image](https://github.com/egorgur/Basic-Web-Messenger/assets/122800013/7b4ae86c-ed10-450c-b66b-9ee9b4302b16)
![image](https://github.com/egorgur/Basic-Web-Messenger/assets/122800013/4bf8da6d-63de-459e-93fb-24a5a1c19b78)
![image](https://github.com/egorgur/Basic-Web-Messenger/assets/122800013/322c64e7-e67e-4c3a-b091-b371d881e7de)
![image](https://github.com/egorgur/Basic-Web-Messenger/assets/122800013/22da85f3-54ec-44d5-92cd-8d345c16dd76)

![image](https://github.com/egorgur/Basic-Web-Messenger/assets/122800013/4dc1161d-88f2-48d7-97cb-8908ee4baf45)
![Снимок экрана 2024-05-13 155912](https://github.com/egorgur/Basic-Web-Messenger/assets/122800013/55dd7562-a163-4151-b2af-becb7cb7cdbd)
![Снимок экрана 2024-05-13 165040](https://github.com/egorgur/Basic-Web-Messenger/assets/122800013/43dad40b-483c-4d0a-bd3e-839694f2cdc5)





# Setup

```diff
- Attention! Setup is essential and must be done in order to have the Messenger functioning at all.
```

## Docker

Compose the cluster

```console
root@foobar:~# docker-compose build
root@foobar:~# docker-compose up
```

Then you should see the services logs. It indicates that the cluster is functioning

```console
Example:
web-1    | 2024-05-13 08:07:35,615 INFO     Starting server at tcp:port=8000:interface=0.0.0.0
web-1    | 2024-05-13 08:07:35,617 INFO     HTTP/2 support not enabled (install the http2 and tls Twisted extras)
web-1    | 2024-05-13 08:07:35,617 INFO     Configuring endpoint tcp:port=8000:interface=0.0.0.0
web-1    | 2024-05-13 08:07:35,619 INFO     Listening on TCP address 0.0.0.0:8000
```

After that, you must enter the web container terminal.

I do it like this:
```console
root@foobar:~# docker ps
CONTAINER ID   IMAGE                     COMMAND                  CREATED          STATUS          PORTS                                          NAMES
038b2e0a08f2   basic-web-messenger-web   "daphne -b 0.0.0.0 -…"   3 minutes ago    Up 3 minutes    0.0.0.0:8000->8000/tcp, :::8000->8000/tcp      basic-web-messenger-web-1
543608ac413a   postgres:latest           "docker-entrypoint.s…"   9 minutes ago    Up 3 minutes    0.0.0.0:5432->5432/tcp, :::5432->5432/tcp      basic-web-messenger-db-1
a8761cb3900a   redis:latest              "docker-entrypoint.s…"   9 minutes ago    Up 3 minutes    0.0.0.0:6379->6379/tcp, :::6379->6379/tcp      basic-web-messenger-redis-1
697cdb9e5903   portainer/portainer-ce    "/portainer --admin-…"   21 minutes ago   Up 20 minutes   8000/tcp, 9443/tcp, 127.0.0.1:9000->9000/tcp   portainer
root@foobar:~# docker exec -it 038b2e0a08f2 bash # ID of the ...-web servie
```
In the container's terminal do this:
---
Run the migrations and collect static:
```console
root@foobar:/app# python manage.py createmigrations
root@foobar:/app# python manage.py migrate
root@foobar:/app# python manage.py collectstatic
```

And create Django-superuser:
```console
root@foobar:/app# python manage.py createsuperuser
Username (leave blank to use 'root'): admin
Email address:
Password: *****
Password (again): *****
Superuser created successfully.
```
Open the http://youthost/admin/

Log in and create UserSettings object for the admin user:

![img.png](img.png)

This is necessary because every user must have UserSettings. 
They are created automatically in the user registration process, 
but the superuser-creation does not trigger the user-creation views
and that's why we must create it for the Superuser manually.

The final step is to create the main room for every new user to join in.
Name it like you want.

![img_1.png](img_1.png)

You are good to go!


# Project structure

It utilizes PostgeSQL and Redis databases:

Django **settings.py**

```python
DATABASES = {  # Postges setup
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'postgres',
        'PASSWORD': "",
        "HOST": "db",
        "PORT": "5432",
    }
}

CHANNEL_LAYERS = { # Channels' Redis channel layers setup 
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [f"redis://redis:6379"],
        },
    },
}
```

Postgres tables:

![img_3.png](img_3.png)

## File structure

![img_2.png](img_2.png)



# Known issues
## Bugs
1. First messages in the newly created room do not show themselves. On encounter just reload the page
2. Strange behavior of the file uploading. It looks like even the smallest
internet connection drops cause the file uploading to cancel and 
a send message will lose its media content. On encounter try send another message with the media.
## Missing or undeveloped features
1. Message deletion and editing. For now it is not developed
2. User's contacts list of other users. For now every user can add every other user to the room and do not have the contacts settings nor the ability to send personal messages.
