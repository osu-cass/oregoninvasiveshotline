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


class CreateViewTest(TestCase):

    def test_get(self):
        c1 = make(Category)
        c2 = make(Category)
        s1 = make(Species, category=c1)
        s2 = make(Species, category=c1)
        make(Species, category=c2)
        response = self.client.get(reverse("reports-create"))
        self.assertEqual(response.status_code, 200)
        # make sure the category_id_to_species_id gets populated
        self.assertEqual(set(json.loads(response.context['category_id_to_species_id'])[str(c1.pk)]), set([s1.pk, s2.pk]))

    def test_post(self):
        data = {
            "location": "back ally",
            "point": "SRID=4326;POINT(-6.7236328125 8.61328125)",
            "reported_category": make(Category).pk,
            "description": "It was HUGE",
            "questions": "question",
            "prefix": "Dr.",
            "first_name": "John",
            "last_name": "Evil",
            "suffix": "PHD",
            "email": "john@example.com",
            "form-TOTAL_FORMS": "0",
            "form-INITIAL_FORMS": "0",
            "form-MIN_NUM_FORMS": "0",
            "form-MAX_NUM_FORMS": "1000",
        }

        response = self.client.post(reverse("reports-create"), data)
        report = Report.objects.order_by("-pk").first()
        assert report is not None
        self.assertRedirects(response, reverse("reports-detail", args=[report.pk]))
        session = self.client.session
        # make sure the report_ids in the session gets updated
        self.assertIn(report.pk, session['report_ids'])
