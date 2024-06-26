from django.db import models
from django.contrib.auth.models import User


class Room(models.Model):
    users = models.ManyToManyField(User)
    name = models.CharField(max_length=200, default="none")
    rules = models.CharField(max_length=300, default="none")

    def __str__(self):
        return "Room: " + self.name


class RoomAdmin(models.Model):
    room_id = models.ForeignKey(Room, on_delete=models.CASCADE)
    owner = models.IntegerField(null=True)
    admins = models.ManyToManyField(User)

    def __str__(self):
        return "Admins of " + str(self.room_id)


class Message(models.Model):
    message = models.TextField(max_length=200)
    timestamp = models.DateTimeField(auto_now_add=True)
    room_id = models.ForeignKey(Room, on_delete=models.CASCADE)
    author_id = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    has_media = models.BooleanField(default=False)

    def __str__(self):
        return "Message: " + self.message


class Media(models.Model):
    is_message_media = models.BooleanField()
    message_id = models.IntegerField(null=True, blank=True)
    file_name = models.CharField(max_length=100)
    file = models.FileField()

    def __str__(self):
        return self.file_name

    def delete(self, *args, **kwargs):
        self.file.delete()
        super().delete(*args, **kwargs)


class UserSettings(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    avatar = models.ForeignKey(Media, on_delete=models.SET_NULL, null=True, blank=True, default=None)
    contacts = models.CharField(default="{}")

    def __str__(self):
        return "settings: " + self.user.username

# Create your models here.
