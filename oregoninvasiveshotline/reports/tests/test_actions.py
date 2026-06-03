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


class ClaimViewTest(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )
        self.client.login(email=self.user.email, password="foo")
        self.other_user = self.create_user(
            username="other@example.com",
            password="other",
            is_active=True
        )

    def test_claim_unclaimed_report_immediately_claims_it(self):
        report = make(Report, claimed_by=None, point=ORIGIN)
        response = self.client.post(reverse("reports-claim", args=[report.pk]))
        self.assertEqual(Report.objects.get(claimed_by=self.user), report)
        self.assertRedirects(response, reverse("reports-detail", args=[report.pk]))

    def test_already_claimed_report_renders_confirmation_page(self):
        report = make(Report, claimed_by=self.other_user, point=ORIGIN)
        response = self.client.post(reverse("reports-claim", args=[report.pk]))
        self.assertIn("Are you sure you want to steal", response.content.decode())

    def test_stealing_already_claimed_report(self):
        report = make(Report, claimed_by=self.other_user, point=ORIGIN)
        response = self.client.post(reverse("reports-claim", args=[report.pk]), {"steal": 1})
        self.assertEqual(Report.objects.get(claimed_by=self.user), report)
        self.assertRedirects(response, reverse("reports-detail", args=[report.pk]))


class UnclaimViewTest(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )

    def test_only_person_who_claimed_report_can_unclaim_it(self):
        report = make(Report, point=ORIGIN)
        # to set it back to False
        self.client.login(email=self.user.email, password="foo")

        response = self.client.get(reverse("reports-unclaim", args=[report.pk]))
        self.assertEqual(response.status_code, 403)

        # Self and report is not typed properly, so self.user/report.claimed_by is not typed properly
        report.claimed_by = self.user  # pyright: ignore
        report.save()
        response = self.client.get(reverse("reports-unclaim", args=[report.pk]))
        self.assertEqual(response.status_code, 200)

        response = self.client.post(reverse("reports-unclaim", args=[report.pk]))
        report.refresh_from_db()
        self.assertEqual(None, report.claimed_by)


class DeleteViewTest(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )

    def test_permissions(self):
        report = make(Report, point=ORIGIN)
        response = self.client.get(reverse("reports-delete", args=[report.pk]))
        self.assertRedirects(response, reverse("login") + "?next=" + reverse("reports-delete", args=[report.pk]))

        self.client.login(email=self.user.email, password="foo")
        self.user.is_active = False
        self.user.save()
        response = self.client.get(reverse("reports-delete", args=[report.pk]))
        self.assertEqual(response.status_code, 403)

    def test_get(self):
        self.client.login(email=self.user.email, password="foo")
        report = make(Report, point=ORIGIN)
        response = self.client.get(reverse("reports-delete", args=[report.pk]))
        self.assertEqual(response.status_code, 200)

    def test_post(self):
        self.client.login(email=self.user.email, password="foo")
        report = make(Report, point=ORIGIN)
        make(Report, point=ORIGIN)
        response = self.client.post(reverse("reports-delete", args=[report.pk]))
        self.assertRedirects(response, reverse("reports-list"))
        self.assertFalse(Report.objects.filter(pk=report.pk).exists())
        self.assertEqual(Report.objects.count(), 1)
