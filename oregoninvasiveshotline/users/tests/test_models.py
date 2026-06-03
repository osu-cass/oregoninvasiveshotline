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


from .shared import ORIGIN


class UserTest(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            first_name="foo",
            last_name="bar",
            is_active=True,
            is_staff=False
        )
        self.admin = self.create_user(
            username="admin@example.com",
            password="admin",
            is_active=True,
            is_staff=True
        )

    def test_str(self):
        self.assertEqual(str(self.user), "foo bar")
        # the str method should fall back on the email address if a part of
        # their name is blank
        self.user.first_name = ""
        self.user.save()
        self.assertEqual(str(self.user), self.user.email)

    def test_get_full_name(self):
        self.assertEqual(self.user.get_full_name(), "foo bar")

    def test_get_short_name(self):
        self.assertEqual(self.user.get_short_name(), "foo b.")

    def test_has_perm(self):
        """Staff members have all Django admin perms"""
        self.assertFalse(self.user.has_perm("foo"), self.user)
        self.assertTrue(self.admin.has_perm("foo"), self.admin)

    def test_has_module_perms(self):
        """Staff members have all Django admin perms"""
        self.assertFalse(self.user.has_module_perms("foo"), self.user)
        self.assertTrue(self.admin.has_module_perms("foo"), self.admin)

    def test_get_proper_name(self):
        user = self.create_user(
            username="asdf",
            prefix="Mr.",
            first_name="Foo",
            last_name="Bar",
            suffix="PHD"
        )
        # User object returned by create_user may not have fully inferred type for custom methods
        self.assertEqual(user.get_proper_name(), "Mr. Foo Bar, PHD") # pyright: ignore

        other_user = self.create_user(
            username="fdsa",
            first_name="Foo",
            last_name="Bar",
            prefix="",
            suffix=""
        )
        # User object returned by create_user may not have fully inferred type for custom methods
        self.assertEqual(other_user.get_proper_name(), "Foo Bar")  # pyright: ignore

    def test_get_authentication_url_and_authenticate(self):
        url = self.user.get_authentication_url(next="lame")  # pyright: ignore
        parts = urllib.parse.urlparse(url)
        self.assertEqual(parts.path, reverse("users-authenticate"))
        query = urllib.parse.parse_qs(parts.query)
        self.assertEqual(query['next'][0], "lame")
        self.assertEqual(self.user, User.from_signature(query['sig'][0]))
