from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path("", views.entry, name="entry"),
    path("login/", views.login_view, name="detail"),
    path("registration/", views.register, name="register"),
    path("management/", views.management, name="management"),
    path("account/", views.account, name="accounts"),
    path("account/leave", views.logout_user, name="accounts"),
    path("account/save", views.save_account, name="accounts"),
    path("account/password/", views.change_password, name="change_password"),
    path("account/password/save", views.save_password, name="save_password"),
    path("files/", views.files, name="files"),
]
