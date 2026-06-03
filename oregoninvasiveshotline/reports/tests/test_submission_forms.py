import posixpath
import binascii
import codecs
import json
import csv
import io
import os
from datetime import timedelta
from unittest.mock import Mock, patch

from django.utils import timezone
from django.conf import settings
from django.core import mail
from django.core.exceptions import NON_FIELD_ERRORS
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.contrib.gis.geos import Point
from django.db.models.signals import post_save
from django.db import transaction
from django.urls import reverse
from django.test import TestCase, TransactionTestCase

from model_bakery.baker import make, prepare

from oregoninvasiveshotline.utils.test.user import UserMixin
from oregoninvasiveshotline.comments.forms import CommentForm
from oregoninvasiveshotline.comments.models import Comment
from oregoninvasiveshotline.images.models import Image
from oregoninvasiveshotline.species.models import Category, Severity, Species
from oregoninvasiveshotline.notifications.models import UserNotificationQuery
from oregoninvasiveshotline.users.models import User

from ..forms import InviteForm, ManagementForm, NewReportForm, ReportForm, ReportSearchForm
from ..models import Invite, Report, receiver__generate_icon
from ..views import _export


from .shared import ORIGIN, SuppressPostSaveMixin, TEST_IMAGE_PATH


class ReportFormTest(TransactionTestCase, UserMixin):

    def test_reported_species_is_not_required(self):
        form = ReportForm({})
        self.assertFalse(form.is_valid())
        self.assertFalse(form.has_error("reported_species"))

    def test_save_creates_user_if_it_doesnt_exist(self):
        # the user doesn't exist, so it should be created when the form is saved
        form = ReportForm({
            "email": "foo@example.com",
            "first_name": "Foo",
            "last_name": "Bar",
            "prefix": "Mr.",
            "suffix": "PHD",
        })
        self.assertFalse(form.is_valid())
        report = make(Report, pk=1, point=ORIGIN)
        pre_count = User.objects.count()

        with patch("oregoninvasiveshotline.reports.forms.submission.forms.ModelForm.save") as save:
            form.instance = report
            form.save()
            self.assertTrue(save.called)

        self.assertEqual(User.objects.count(), pre_count+1)
        self.assertEqual(report.created_by.email, "foo@example.com")
        self.assertEqual(report.created_by.is_active, False)
        self.assertEqual(report.created_by.last_name, "Bar")

        # the user already exists, so no record should be created
        pre_count = User.objects.count()
        form = ReportForm({
            "email": "FOO@eXaMplE.com",  # using odd casing here to ensure `icontains` is used
        })
        self.assertFalse(form.is_valid())
        pre_count = User.objects.count()
        with patch("oregoninvasiveshotline.reports.forms.submission.forms.ModelForm.save") as save:
            form.instance = report
            form.save()
            self.assertTrue(save.called)

        self.assertEqual(User.objects.count(), pre_count)

    def test_comment_is_added(self):
        form = ReportForm({
            "email": "foo@example.com",
            "first_name": "Foo",
            "last_name": "Bar",
            "questions": "hello world",
        })
        self.assertFalse(form.is_valid())
        report = make(Report, point=ORIGIN)
        with patch("oregoninvasiveshotline.reports.forms.submission.forms.ModelForm.save"):
            form.instance = report
            form.save()

        self.assertEqual(Comment.objects.get(report=report).body, "hello world")

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
        with patch("oregoninvasiveshotline.reports.forms.submission.forms.ModelForm.save"):
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
        with patch("oregoninvasiveshotline.reports.forms.submission.forms.ModelForm.save"):
            # notification task is out-of-band and uses 'on_commit' barrier
            # so the path being tested is wrapped in a transaction
            with transaction.atomic():
                form.instance = report
                form.save()

        # mailbox should contain two report submission emails and a
        # subscription notification
        self.assertEqual(len(mail.outbox), 3)

        # If we notify about the same report, no new email should be sent.
        with patch("oregoninvasiveshotline.reports.forms.submission.forms.ModelForm.save"):
            # notification task is out-of-band and uses 'on_commit' barrier
            # so the path being tested is wrapped in a transaction
            with transaction.atomic():
                form.instance = report
                form.save()

        # mailbox should contain three report submission emails and a
        # subscription notification
        self.assertEqual(len(mail.outbox), 4)


class NewReportFormTest(TransactionTestCase):

    def test_identification_process_not_required(self):
        """Ensure the wizard form validates without an identification process note."""
        category = make(Category)
        form = NewReportForm({
            "find_description": "Found near trail edge",
            "category": category.pk,
            "location_description": "Near mile marker 3",
            "latitude": 44.0481,
            "longitude": -123.0906,
            "email": "foo@example.com",
            "first_name": "Foo",
            "last_name": "Bar",
        })
        self.assertTrue(form.is_valid())

        with (
            patch("oregoninvasiveshotline.reports.forms.submission.notify_report_submission.delay"),
            patch("oregoninvasiveshotline.reports.forms.submission.notify_report_subscribers.delay"),
        ):
            report = form.save()

        self.assertEqual(report.identification_process, "")

    def test_save_maps_wizard_fields(self):
        """Ensure wizard fields are persisted to report and follow-up comment records."""
        category = make(Category)
        form = NewReportForm({
            "find_description": "Leafy plant with white flowers",
            "category": category.pk,
            "identification_process": "Compared leaves and flower clusters with a field guide",
            "location_description": "Along roadside ditch",
            "latitude": 44.0521,
            "longitude": -123.0867,
            "email": "foo@example.com",
            "first_name": "Foo",
            "last_name": "Bar",
            "questions": "Can someone confirm species?",
        })
        self.assertTrue(form.is_valid())

        with (
            patch("oregoninvasiveshotline.reports.forms.submission.notify_report_submission.delay"),
            patch("oregoninvasiveshotline.reports.forms.submission.notify_report_subscribers.delay"),
        ):
            report = form.save()

        self.assertEqual(report.description, "Leafy plant with white flowers")
        self.assertEqual(
            report.identification_process,
            "Compared leaves and flower clusters with a field guide",
        )
        self.assertEqual(
            report.location,
            "Along roadside ditch",
        )
        self.assertEqual(Comment.objects.get(report=report).body, "Can someone confirm species?")
