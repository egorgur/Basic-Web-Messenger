import os.path

from django.shortcuts import render
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.core.files.storage import FileSystemStorage

from channels.layers import get_channel_layer

from asgiref.sync import async_to_sync

from main import settings

from .models import Media, Room, Message

import dataclasses
from dataclasses import dataclass

import json


def entry(request):
    if request.user.is_anonymous:
        return HttpResponseRedirect("/messenger/login/")
    return render(
        request=request,
        template_name='messenger/main.html',
        context={}
    )


def login_view(request):
    return render(
        request=request,
        template_name="messenger/login.html",
        context={}
    )


def account(request):
    if request.user.is_anonymous:
        return HttpResponseRedirect("/messenger/login/")
    else:
        print(request.user.username)
        return render(
            request=request,
            template_name="messenger/account.html",
            context={'username': request.user.username}
        )


def change_password(request):
    if request.user.is_anonymous:
        return HttpResponseRedirect("/messenger/login/")
    return render(request=request, template_name="messenger/password.html")


def save_name(request):
    if request.method == "GET":
        return HttpResponseRedirect("/messenger")
    data = json.loads(request.body)
    if len(User.objects.all().filter(username=data["name"])) != 0:
        answer = AnswerData(
            answer_type="bad",
            main_data=data,
            comment="name is already taken",
        )
        answer = dataclasses.asdict(answer)
    else:
        request.user.username = data["name"]
        request.user.save()
        answer = AnswerData(
            answer_type="good",
            main_data=data,
            comment="name is changed",
        )
        answer = dataclasses.asdict(answer)
    return JsonResponse(answer)


def media_view(request, path):
    if request.user.is_anonymous:
        return HttpResponse("restricted access")
    if request.method == "GET":
        media = Media.objects.get(file=path)
        message_id = media.message_id
        message = Message.objects.get(pk=message_id)
        room = message.room_id
        if room.users.filter(id=request.user.id).exists():
            media_path = os.path.join(settings.MEDIA_ROOT, path)
            with open(media_path, "rb") as file:
                return HttpResponse(file.read(), content_type="application/octet-stream")
        else:
            HttpResponse("restricted access")
    else:
        HttpResponse("restricted access")

def files(request):
    if request.method == "POST":
        try:
            uploaded_file = request.FILES['file']
            message_id = request.POST['messageId']
            room_id = request.POST['roomId']
            print("message_id ", message_id)
            print("room_id ", room_id)
            print("File_name", uploaded_file.name)
            print("File_size", uploaded_file.size)
            fs = FileSystemStorage()
            fs.save(uploaded_file.name, uploaded_file)
            file = Media.objects.create(
                message_id=message_id,
                file_name=uploaded_file.name,
                file=uploaded_file
            )
            file.save()
            answer = {
                "files_system": "test",
            }
            room_name = "Room_group_" + str(room_id)
            channel = get_channel_layer()
            update_request = {
                # "request": "update_message",
                "message_id": message_id,
                "room_id": room_id,
            }
            group_request = {
                "type": "update_message_call",
                "text": json.dumps(update_request),
            }
            async_to_sync(channel.group_send)(room_name, group_request)
            print("channel", channel)
        except Exception as e:
            print("error", e)
            answer = {
                "error": True,
                "data": repr(e)
            }
        return JsonResponse(answer)


def save_password(request):
    if request.method == "GET":
        return HttpResponseRedirect("/messenger")
    data = json.loads(request.body)
    if request.user.check_password(data["oldPass"]):
        request.user.set_password(data["firstPass"])
        request.user.save()
        answer = AnswerData(
            answer_type="good",
            main_data={},
            comment="New password was set",
        )
        answer = dataclasses.asdict(answer)
    else:
        answer = AnswerData(
            answer_type="bad",
            main_data={},
            comment="old password is incorrect",
        )
        answer = dataclasses.asdict(answer)
    return JsonResponse(answer)


def register(request):
    return render(
        request=request,
        template_name="messenger/register.html",
        context={}
    )


def management(request):
    if request.method == "POST":
        data = json.loads(request.body)
        if data["request"] == "registration":
            return registration_management(
                data=data,
            )
        if data["request"] == "login":
            return login_management(
                request=request,
                data=data,
            )


def login_management(request, data):
    if data["name"] == "" or data["password"] == "":
        answer = AnswerData(
            answer_type="bad",
            main_data={},
            comment="emptyField"
        )
        answer = dataclasses.asdict(answer)
    else:
        if login_user(request=request,
                      user_data=data):
            answer = AnswerData(
                answer_type="good",
                main_data={
                    "redirect": "messenger/"
                },
                comment="authSuccess"
            )
            answer = dataclasses.asdict(answer)
        else:
            answer = AnswerData(
                answer_type="bad",
                main_data={},
                comment="wrongUsernameOrPassword"
            )
            answer = dataclasses.asdict(answer)
    return JsonResponse(answer)


def login_user(request, user_data):
    username = user_data["name"]
    password = user_data["password"]
    user = authenticate(
        request=request,
        username=username,
        password=password
    )
    if user is not None:
        login(request, user)
        return True
    else:
        return False


def registration_management(data):
    if username_is_occupied(data):
        answer = AnswerData(
            answer_type="bad",
            main_data={},
            comment="nameIsOccupied"
        )
        answer = dataclasses.asdict(answer)
        return JsonResponse(answer)
    else:
        new_user_adding(data)
        answer = AnswerData(
            answer_type="good",
            main_data={
                "redirect": "messenger/login"
            }
        )
        answer = dataclasses.asdict(answer)
        return JsonResponse(answer)


def username_is_occupied(data) -> bool:
    name = data["name"]
    names = list(User.objects.all().values_list("username"))
    [print(names[i][0]) for i in range(len(names))]
    if any(name in names[i][0] for i in range(len(names))):
        print("nameOccupied")
        return True
    else:
        print("nameAccepted")
        return False


def new_user_adding(data):
    User.objects.create_user(
        username=data["name"],
        password=data["password"],
    )


# answer = AnswerData(
#             answer_type="",
#             main_data={},
#             comment="",
#         )
#         answer = dataclasses.asdict(answer)
@dataclass
class AnswerData:
    answer_type: str
    main_data: dict
    comment: str = ""
