from django.shortcuts import render
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login

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


def files(request):
    if request.method == "POST":
        # uploaded_file = request.FILES.get(0)
        # print("File_name",uploaded_file.name)
        # print("File_size",uploaded_file.size)
        print(request.FILES['file'])
        answer = {
            "files_system": "test",
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
