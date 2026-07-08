from unittest.mock import patch

from django.core import mail
from django.db import transaction
from django.test import TransactionTestCase

from model_bakery.baker import make

from oregoninvasiveshotline.utils.test.user import UserMixin
from oregoninvasiveshotline.notifications.models import UserNotificationQuery

from ..forms import ReportForm
from ..models import Report
from .shared import ORIGIN


class ReportFormNotificationTest(TransactionTestCase, UserMixin):

    def test_notify_sends_emails_to_subscribers(self):
        user = self.create_user(username='foo@example.com')

        # Subscribe to the same thing twice to ensure that only one
        # email is sent to the user when a report matches.
        make(UserNotificationQuery, query='q=foobarius', user=user)
        make(UserNotificationQuery, query='q=foobarius', user=user)

        # This report does *not* have the words "foobarius" in it, so no
        # email should be sent.
        form = ReportForm({
            "email": "foo@example.com",
            "first_name": "Foo",
            "last_name": "Bar",
        })
        self.assertFalse(form.is_valid())
        report = make(Report, point=ORIGIN)
        with patch("oregoninvasiveshotline.reports.forms.forms.ModelForm.save"):
            # notification task is out-of-band and uses 'on_commit' barrier
            # so the path being tested is wrapped in a transaction
            with transaction.atomic():
                form.instance = report
                form.save()

        # mailbox should contain one report submission email
        self.assertEqual(len(mail.outbox), 1)

        # This report *does* have the word "foobarius" in it, so it
        # should trigger an email to be sent.
        report = make(Report, reported_category__name='foobarius', point=ORIGIN)
        with patch("oregoninvasiveshotline.reports.forms.forms.ModelForm.save"):
            # notification task is out-of-band and uses 'on_commit' barrier
            # so the path being tested is wrapped in a transaction
            with transaction.atomic():
                form.instance = report
                form.save()

        # mailbox should contain two report submission emails and a
        # subscription notification
        self.assertEqual(len(mail.outbox), 3)

        # If we notify about the same report, no new email should be sent.
        with patch("oregoninvasiveshotline.reports.forms.forms.ModelForm.save"):
            # notification task is out-of-band and uses 'on_commit' barrier
            # so the path being tested is wrapped in a transaction
            with transaction.atomic():
                form.instance = report
                form.save()

        # mailbox should contain three report submission emails and a
        # subscription notification
        self.assertEqual(len(mail.outbox), 4)
