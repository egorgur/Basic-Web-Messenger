from django.contrib import admin
from messenger.models import *

admin.site.register(Message)
admin.site.register(Room)
admin.site.register(RoomAdmin)
admin.site.register(UserSettings)
admin.site.register(Media)
# Register your models here.
