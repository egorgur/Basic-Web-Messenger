from django.urls import path, include

from . import views

urlpatterns = [
    path("", views.entry, name="entry"),
    path("login/", views.login_view, name="detail"),
    path("registration/", views.register, name="register"),
    path("management/", views.management, name="management"),
    path("account/", views.account, name="accounts"),
    path("account/save", views.save_name, name="accounts"),
    path("account/password/", views.change_password, name="change_password"),
    path("account/password/save", views.save_password, name="save_password"),
    path("files/", views.files, name="files"),
]