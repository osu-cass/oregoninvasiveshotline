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


class ReportListView(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )

    def test_get(self):
        reports = make(Report, _quantity=3, point=ORIGIN)
        self.client.login(email=self.user.email, password="foo")
        response = self.client.get(reverse("reports-list"))
        self.assertEqual(response.status_code, 200)
        self.assertIn(reports[0].title, response.content.decode())


class ExportTest(TestCase):

    def test_csv(self):
        reports = make(Report, _quantity=3, point=ORIGIN)
        response = _export(reports, format="csv")
        reader = csv.DictReader(codecs.iterdecode(response, "utf8"))
        rows = list(reader)
        self.assertEqual(3, len(rows))
        self.assertEqual(rows[2]['Description'], reports[2].description)

    def test_kml(self):
        reports = make(Report, _quantity=3, point=ORIGIN)
        response = _export(reports, format="kml")
        # this is harder to test without trying to parse the XML
        self.assertIn(reports[0].description, response.content.decode())
