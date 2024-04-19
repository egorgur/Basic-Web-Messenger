from django.db import models
from django.contrib.auth.models import User


class Room(models.Model):
    users = models.ManyToManyField(User)
    name = models.CharField(max_length=100, default="none")

    def __str__(self):
        return "Room: " + self.name


class RoomAdmin(models.Model):
    room_id = models.ForeignKey(Room, on_delete=models.CASCADE)
    admins = models.ManyToManyField(User)

    def __str__(self):
        return "Admins of " + str(self.room_id)

class Message(models.Model):
    message = models.TextField(max_length=200)
    timestamp = models.DateTimeField(auto_now_add=True)
    room_id = models.ForeignKey(Room, on_delete=models.CASCADE)
    author_id = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)

    def __str__(self):
        return "Message: " + self.message

# Create your models here.
