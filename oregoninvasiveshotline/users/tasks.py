from typing import cast
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.urls import reverse

from oregoninvasiveshotline.utils.settings import get_setting
from oregoninvasiveshotline.users.models import User
from oregoninvasiveshotline.celery import app


@app.task
def notify_public_user_for_login_link(user_id):
    user = User.objects.get(pk=user_id)

    subject = cast(str, get_setting('NOTIFICATIONS.login_link__subject'))
    from_email = cast(str, get_setting('NOTIFICATIONS.from_email'))
    path = user.get_authentication_url(next=reverse('users-home'))

    body = render_to_string('users/_login.txt', {
        'user': user,
        'url': path
    })
    send_mail(subject, body, from_email, [user.email])
