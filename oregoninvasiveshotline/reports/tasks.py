from typing import cast
from django.template.loader import render_to_string
from django.core.management import call_command
from django.core.mail import send_mail
from django.urls import reverse
from django.http import QueryDict

from oregoninvasiveshotline.utils.settings import get_setting
from oregoninvasiveshotline.utils.urls import build_absolute_url
from oregoninvasiveshotline.notifications.models import UserNotificationQuery, Notification
from oregoninvasiveshotline.reports.models import Report, Invite
from oregoninvasiveshotline.users.models import User
from oregoninvasiveshotline.celery import app


@app.task
def generate_icons():
    call_command('generate_icons', interactive=False)


@app.task
def notify_report_submission(report_id, user_id):
    report = Report.objects.get(pk=report_id)
    user = User.objects.get(pk=user_id)

    subject = cast(str, get_setting('NOTIFICATIONS.new_report__subject'))
    from_email = cast(str, get_setting('NOTIFICATIONS.from_email'))
    path = reverse('reports-detail', args=[report.pk])

    if user.is_active:
        url = build_absolute_url(path)
    else:
        url = user.get_authentication_url(next=path)

    body = render_to_string('reports/_submission.txt', {
        'user': user,
        'url': url,
    })
    send_mail(subject, body, from_email, [user.email])


@app.task
def notify_report_subscribers(report_id):
    """
    Notify users subscribed to a query that matches ``report``.
    """
    from oregoninvasiveshotline.reports.forms import ReportSearchForm  # avoid circular import

    report = Report.objects.get(pk=report_id)

    subject = cast(str, get_setting('NOTIFICATIONS.notify_new_submission__subject'))
    from_email = cast(str, get_setting('NOTIFICATIONS.from_email'))
    excluded_users = Notification.objects.filter(report=report).values_list('user_id', flat=True)
    queryset = UserNotificationQuery.objects.all().select_related('user')
    queryset = queryset.exclude(user__pk__in=excluded_users)

    notified_users = set()
    for user_notification_query in queryset.iterator():
        user = user_notification_query.user
        if user.pk not in notified_users:
            query = user_notification_query.query
            form = ReportSearchForm(QueryDict(query), user=user)

            if form.is_valid() and \
               form.search(Report.objects.all()).filter(pk=report.pk).count():
                next_url = reverse('reports-detail', args=[report.pk])

                if user.is_active:
                    url = build_absolute_url(next_url)
                else:
                    url = user.get_authentication_url(next=next_url)

                body = render_to_string('notifications/email.txt', {
                    'user': user,
                    'name': user_notification_query.name,
                    'url': url,
                    'report': report,
                })
                send_mail(subject, body, from_email, [user.email])

                Notification.objects.create(user=user, report=report)
                notified_users.add(user.pk)


@app.task
def notify_invited_reviewer(invite_id, message):
    invite = Invite.objects.get(pk=invite_id)

    subject = cast(str, get_setting('NOTIFICATIONS.invite_reviewer__subject'))
    from_email = cast(str, get_setting('NOTIFICATIONS.from_email'))
    next_url = reverse('reports-detail', args=[invite.report.pk])

    if invite.user.is_active:
        url = build_absolute_url(next_url)
    else:
        url = invite.user.get_authentication_url(next=next_url)

    body = render_to_string('reports/_invite_expert.txt', {
        'inviter': invite.created_by,
        'message': message,
        'url': url
    })
    send_mail(subject, body, from_email, [invite.user.email])
