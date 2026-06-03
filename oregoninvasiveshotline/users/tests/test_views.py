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


class DetailViewTest(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )
        self.admin = self.create_user(
            username="admin@example.com",
            password="admin",
            is_active=True,
            is_staff=True
        )
        self.inactive_user = self.create_user(
            username="inactive@example.com",
            is_active=False
        )

    def test_permission(self):
        response = self.client.get(reverse("users-detail", args=[self.inactive_user.pk]))
        self.assertEqual(response.status_code, 404)

        response = self.client.get(reverse("users-detail", args=[self.user.pk]))
        self.assertEqual(response.status_code, 200)

    def test_get(self):
        self.client.login(email=self.user.email, password="foobar")
        self.client.get(reverse("users-detail", args=[self.user.pk]))


class EditViewTest(TestCase, UserMixin):

    def test_get(self):
        user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True
        )
        self.client.login(email=user.email, password="foo")
        self.client.get(reverse("users-edit", args=[user.pk]))


class AuthenticateViewTest(TestCase, UserMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.login_redirect_url = reverse(settings.LOGIN_REDIRECT_URL)

    def test_bad_signature_redirects_to_home(self):
        response = self.client.get(reverse("users-authenticate") + "?sig=asfd")
        self.assertRedirects(response, reverse("home"))

    def test_active_or_invited_users_are_logged_in(self):
        # test for an invited user
        invite = make(Invite, report=make(Report, point=ORIGIN))
        # pyright ignores this because `make` doesn't provide precise type
        url = invite.user.get_authentication_url()  # pyright: ignore
        response = self.client.get(url)
        self.assertRedirects(response, self.login_redirect_url)

        # test for an active user
        user = self.create_user(username="inactive@example.com", is_active=False)
        # pyright ignores this because `make` doesn't provide precise type
        url = user.get_authentication_url() # pyright: ignore
        response = self.client.get(url)
        self.assertRedirects(response, self.login_redirect_url)

    def test_report_ids_session_variable_is_populated(self):
        user = self.create_user(username="foo@example.com", is_active=True)
        report = make(Report, created_by=user, point=ORIGIN)
        # pyright ignores this because `make` doesn't provide precise type
        url = user.get_authentication_url() # pyright: ignore
        response = self.client.get(url)
        self.assertRedirects(response, self.login_redirect_url)
        self.assertIn(report.pk, self.client.session['report_ids'])


class UserHomeViewTest(TestCase):
    def test_fully_anonymous_users_sent_away(self):
        response = self.client.get(reverse("users-home"))
        self.assertRedirects(response, reverse("home"))

    def test_anonymous_user_with_report_ids_session_variable(self):
        # they should be able to see the reports they submitted that are in the
        # session var
        r1 = make(Report, point=ORIGIN)
        r2 = make(Report, point=ORIGIN)
        make(Report, point=ORIGIN)  # this report shouldn't show up in the reported queryset
        session = self.client.session
        session['report_ids'] = [r1.pk, r2.pk]
        session.save()

        response = self.client.get(reverse("users-home"))
        self.assertEqual(2, response.context['reported'])


class LoginViewTest(TransactionTestCase, UserMixin):
    def test_get(self):
        response = self.client.get(reverse("login"))
        self.assertEqual(response.status_code, 200)

    def test_logging_in_email_prints_error_message_for_nonexistent_user(self):
        # notification task is out-of-band and uses 'on_commit' barrier
        # so the path being tested is wrapped in a transaction
        payload = {
            "email": "i.do.not.exist@example.com",
            "form": "OTHER_LOGIN",
        }
        response = self.client.post(reverse("login"), data=payload, follow=True)
        self.assertIn(b"Could not find the account i.do.not.exist@example.com for public login",
                      response.content)

    def test_logging_in_via_email_sends_an_email(self):
        user = self.create_user(username="foo@example.com", is_active=False)

        with patch("oregoninvasiveshotline.users.tasks.User.get_authentication_url",
                   return_value="foobarius"):
            # notification task is out-of-band and uses 'on_commit' barrier
            # so the path being tested is wrapped in a transaction
            with transaction.atomic():
                payload = {
                    "email": user.email,
                    "form": "OTHER_LOGIN",
                }
                response = self.client.post(reverse("login"), data=payload)
                self.assertRedirects(response, reverse("login"))

            self.assertTrue(len(mail.outbox), 1)
            self.assertIn("foobarius", mail.outbox[0].body)
