
from django.contrib.auth.models import AnonymousUser
from django.test import TestCase

from model_bakery.baker import make

from oregoninvasiveshotline.utils.test.user import UserMixin
from oregoninvasiveshotline.notifications.models import UserNotificationQuery
from oregoninvasiveshotline.reports.models import Invite, Report

from ..utils import get_tab_counts


from .shared import ORIGIN


class GetTabCountsTest(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )

    def test_subscribed(self):
        make(UserNotificationQuery, user=self.user)
        make(UserNotificationQuery)
        context = get_tab_counts(self.user, [])
        self.assertEqual(context['subscribed'], 1)

    def test_invited_to(self):
        make(Invite, user=self.user, report=make(Report, point=ORIGIN))
        make(Invite, report=make(Report, point=ORIGIN))
        context = get_tab_counts(self.user, [])
        self.assertEqual(context['invited_to'], 1)

    def test_reported(self):
        make(Report, created_by=self.user, point=ORIGIN)
        make(Report, point=ORIGIN)
        report_id = make(Report, point=ORIGIN).pk
        context = get_tab_counts(self.user, [report_id])
        self.assertEqual(context['reported'], 2)

    def test_open_and_claimed(self):
        make(Report, point=ORIGIN)
        user = AnonymousUser()
        context = get_tab_counts(user, [])
        self.assertEqual(context['open_and_claimed'], 0)

        make(Report, claimed_by=self.user, point=ORIGIN)
        context = get_tab_counts(self.user, [])
        self.assertEqual(context['open_and_claimed'], 1)

    def test_unclaimed_reports(self):
        make(Report, claimed_by=self.user, point=ORIGIN)
        make(Report, point=ORIGIN)
        user = AnonymousUser()
        context = get_tab_counts(user, [])
        self.assertEqual(context['unclaimed_reports'], 0)

        user = self.create_user(
            username="inactive_user@example.com",
            is_active=False
        )
        context = get_tab_counts(user, [])
        self.assertEqual(context['unclaimed_reports'], 0)

        other_user = self.create_user(
            username="active_other@example.com",
            is_active=True
        )
        context = get_tab_counts(other_user, [])
        self.assertEqual(context['unclaimed_reports'], 1)
