import urllib.parse
from unittest.mock import patch

from django.conf import settings
from django.core import mail
from django.contrib.auth.models import AnonymousUser
from django.contrib.gis.geos import Point
from django.db import transaction
from django.urls import reverse
from django.test import TestCase, TransactionTestCase

from model_bakery.baker import make, prepare

from oregoninvasiveshotline.utils.test.user import UserMixin
from oregoninvasiveshotline.notifications.models import UserNotificationQuery
from oregoninvasiveshotline.reports.models import Invite, Report

from ..forms import UserForm, UserSearchForm
from ..utils import get_tab_counts
from ..models import User

ORIGIN = Point(0, 0)
