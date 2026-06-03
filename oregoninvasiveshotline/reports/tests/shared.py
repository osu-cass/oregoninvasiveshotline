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

ORIGIN = Point(0, 0)
TEST_IMAGE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..', 'test_assets', 'fsm.png')
)


class SuppressPostSaveMixin:

    @classmethod
    def setUpClass(cls):
        # Super class comes from tests, which is passed in but not available to static code analysis
        super().setUpClass()  # pyright: ignore
        post_save.disconnect(receiver__generate_icon, sender=Report)

    @classmethod
    def tearDownClass(cls):
        # Super class comes from tests, which is passed in but not available to static code analysis
        super().tearDownClass()  # pyright: ignore
        post_save.connect(receiver__generate_icon, sender=Report)
