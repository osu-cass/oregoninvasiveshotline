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


class InviteFormTest(TestCase, UserMixin):

    def test_clean_emails(self):
        # test a few valid emails
        form = InviteForm({
            "emails": "foo@pdx.edu,bar@pdx.edu  ,  fog@pdx.edu,foo@pdx.edu"
        })
        self.assertTrue(form.is_valid())
        self.assertEqual(sorted(form.cleaned_data['emails']), sorted(["foo@pdx.edu", "bar@pdx.edu", "fog@pdx.edu"]))

        # test blank
        form = InviteForm({
            "emails": ""
        })
        self.assertFalse(form.is_valid())
        self.assertTrue(form.has_error("emails"))

        # test invalid email
        form = InviteForm({
            "emails": "invalid@@pdx.ads"
        })
        self.assertFalse(form.is_valid())
        self.assertTrue(form.has_error("emails"))

        # test valid and invalid
        form = InviteForm({
            "emails": "valid@pdx.edu, invalid@@pdx.ads"
        })
        self.assertFalse(form.is_valid())
        self.assertTrue(form.has_error("emails"))
        self.assertIn("invalid@@", str(form.errors))

    def test_save(self):
        inviter = self.create_user()
        report = make(Report, point=ORIGIN)

        form = InviteForm({
            'emails': 'foo@pdx.edu',
            'body': 'body',
        })
        self.assertTrue(form.is_valid())
        invite_report = form.save(inviter, report)
        self.assertEqual(invite_report.invited, ['foo@pdx.edu'])
        self.assertEqual(invite_report.already_invited, [])

        form = InviteForm({
            'emails': 'foo@pdx.edu, bar@pdx.edu',
            'body': 'body',
        })
        self.assertTrue(form.is_valid())
        invite_report = form.save(inviter, report)
        self.assertEqual(invite_report.invited, ['bar@pdx.edu'])
        self.assertEqual(invite_report.already_invited, ['foo@pdx.edu'])
