import os.path

from django.shortcuts import render
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.core.files.storage import FileSystemStorage

from channels.layers import get_channel_layer

from asgiref.sync import async_to_sync

from main import settings

from .models import Media, Room, Message, UserSettings

import dataclasses
from dataclasses import dataclass

import json


def entry(request):
    if request.user.is_anonymous or not request.user.is_authenticated:
        return HttpResponseRedirect("/messenger/login/")
    user_settings = UserSettings.objects.get(user=request.user)
    avatar = user_settings.avatar
    has_avatar = True
    if avatar is None:
        has_avatar = False
        avatar_path = ""
    else:
        avatar_path = settings.MEDIA_URL + avatar.file.name
    return render(
        request=request,
        template_name='messenger/main.html',
        context={
            "username": request.user.username,
            "has_avatar": has_avatar,
            "avatar_path": avatar_path
        }
    )


def login_view(request):
    return render(
        request=request,
        template_name="messenger/login.html",
        context={}
    )


def account(request):
    if request.user.is_anonymous or not request.user.is_authenticated:
        return HttpResponseRedirect("/messenger/login/")

    print(request.user.username)
    user_settings = UserSettings.objects.get(user=request.user)
    avatar = user_settings.avatar
    has_avatar = True
    if avatar is None:
        has_avatar = False
        avatar_path = ""
    else:
        avatar_path = settings.MEDIA_URL + avatar.file.name
    return render(
        request=request,
        template_name="messenger/account.html",
        context={
            "username": request.user.username,
            "has_avatar": has_avatar,
            "avatar_path": avatar_path
        }
    )


def logout_user(request):
    if request.user.is_anonymous or not request.user.is_authenticated:
        return HttpResponseRedirect("/messenger/login/")
    else:
        logout(request)
        return HttpResponseRedirect("/messenger/login/")


def change_password(request):
    if request.user.is_anonymous or not request.user.is_authenticated:
        return HttpResponseRedirect("/messenger/login/")
    user_settings = UserSettings.objects.get(user=request.user)
    avatar = user_settings.avatar
    has_avatar = True
    if avatar is None:
        has_avatar = False
        avatar_path = ""
    else:
        avatar_path = settings.MEDIA_URL + avatar.file.name
    return render(
        request=request,
        template_name="messenger/password.html",
        context={
            'username': request.user.username,
            "has_avatar": has_avatar,
            "avatar_path": avatar_path
        }
    )


def save_account(request):
    if request.method == "GET":
        return HttpResponseRedirect("/messenger")
    data = json.loads(request.body)
    if data["name"] == request.user.username:
        answer = {
            "answer_type": "good",
            "comment": None,
        }
        return JsonResponse(answer)
    if data["name"] == "":
        answer = {
            "comment": "Account name cannot be empty",
        }
        return JsonResponse(answer)
    elif len(User.objects.all().filter(username=data["name"])) != 0:
        answer = AnswerData(
            answer_type="bad",
            main_data=data,
            comment="This user name is occupied",
        )
        answer = dataclasses.asdict(answer)
    else:
        request.user.username = data["name"]
        request.user.save()
        answer = AnswerData(
            answer_type="good",
            main_data=data,
            comment="Name is changed",
        )
        answer = dataclasses.asdict(answer)
    return JsonResponse(answer)


def media_view(request, path):
    if request.user.is_anonymous or not request.user.is_authenticated:
        return HttpResponse("restricted access")
    if request.method == "GET":
        media = Media.objects.get(file=path)
        if media.is_message_media:
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
            media_path = os.path.join(settings.MEDIA_ROOT, path)
            with open(media_path, "rb") as file:
                return HttpResponse(file.read(), content_type="application/octet-stream")
    else:
        HttpResponse("restricted access")


def files(request):
    if request.method == "POST":
        try:
            uploaded_file = request.FILES['file']
            fs = FileSystemStorage()
            fs.save(uploaded_file.name, uploaded_file)
            print("accImg", "account_image" in request.POST)
            print(request.POST)
            if 'messageId' in request.POST:
                message_id = request.POST['messageId']
                room_id = request.POST['roomId']
                file = Media.objects.create(
                    is_message_media=True,
                    message_id=message_id,
                    file_name=uploaded_file.name,
                    file=uploaded_file
                )
                file.save()
                answer = {
                    "files_system": "ok",
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
            elif "account_avatar" in request.POST:
                file = Media.objects.create(
                    is_message_media=False,
                    file_name=uploaded_file.name,
                    file=uploaded_file
                )
                file.save()
                user_settings = UserSettings.objects.get(user=request.user)
                user_settings.avatar = file
                user_settings.save()
                print("userImage")
                answer = {
                    "files_system": "ok",
                }
            else:
                file = Media.objects.create(
                    is_message_media=False,
                    file_name=uploaded_file.name,
                    file=uploaded_file
                )
                file.save()
                answer = {
                    "files_system": "ok",
                }
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
        user = authenticate(
            request=request,
            username=request.user.username,
            password=data["firstPass"]
        )
        if user is not None:
            login(request, user)
    else:
        answer = AnswerData(
            answer_type="bad",
            main_data={},
            comment="Old password is incorrect",
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
            comment="Empty fields"
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
                comment="Wrong username or password"
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
            comment="This username is occupied"
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
    print("new user needs rework", data)
    # User.objects.create_user(
    #     username=data["name"],
    #     password=data["password"],
    # )


@dataclass
class AnswerData:
    answer_type: str
    main_data: dict
    comment: str = ""
