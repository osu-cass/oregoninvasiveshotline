from typing import cast
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.urls import reverse

from oregoninvasiveshotline.utils.settings import get_setting
from oregoninvasiveshotline.utils.urls import build_absolute_url
from oregoninvasiveshotline.notifications.models import UserNotificationQuery
from oregoninvasiveshotline.users.models import User
from oregoninvasiveshotline.celery import app


@app.task
def notify_new_subscription_owner(subscription_id, assigner_id):
    """
    Notify the new owner of a subscription when ownership has changed.
    """
    subscription = UserNotificationQuery.objects.get(pk=subscription_id)
    assigner = User.objects.get(pk=assigner_id)

    subject = cast(str, get_setting('NOTIFICATIONS.notify_new_owner__subject'))
    from_email = cast(str, get_setting('NOTIFICATIONS.from_email'))
    next_url = reverse('reports-list') + '?' + subscription.query

    if subscription.user.is_active:
        url = build_absolute_url(next_url)
    else:
        url = subscription.user.get_authentication_url(next=next_url)

    body = render_to_string('notifications/notify_new_owner.txt', {
        'assigner': assigner,
        'name': subscription.name,
        'url': url,
    })
    send_mail(subject, body, from_email, [subscription.user.email])
