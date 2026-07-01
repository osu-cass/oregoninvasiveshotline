from django.urls import reverse
from django.test import TestCase

from model_bakery.baker import make

from ..models import Invite, Report
from .detail_helpers import DetailViewUserSetupMixin
from .shared import ORIGIN


class DetailViewAccessTest(DetailViewUserSetupMixin, TestCase):

    def test_anonymous_users_cant_view_non_public_reports_and_is_prompted_to_login(self):
        report = make(Report, is_public=False, point=ORIGIN)
        response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertRedirects(response, reverse("login") + "?next=" + reverse("reports-detail", args=[report.pk]))

    def test_anonymous_users_with_proper_session_state_can_view_non_public_reports(self):
        report = make(Report, is_public=False, created_by=self.inactive_user, point=ORIGIN)
        session = self.client.session
        session['report_ids'] = [report.pk]
        session.save()
        response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertEqual(response.status_code, 200)

    def test_anonymous_users_with_proper_session_state_should_be_prompted_to_login_if_the_report_was_created_by_an_active_user(self):
        report = make(Report, is_public=False, created_by=self.user, point=ORIGIN)
        session = self.client.session
        session['report_ids'] = [report.pk]
        session.save()
        response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertRedirects(response, reverse("login") + "?next=" + reverse("reports-detail", args=[report.pk]))

    def test_invited_experts_cannot_see_every_report(self):
        report = make(Report, is_public=False, point=ORIGIN)
        # we set is_active to True just so self.client.login works, but we have
        # to set it back to False
        invited_expert = self.user
        self.client.login(email=invited_expert.email, password="foo")
        invited_expert.is_active = False
        invited_expert.save()

        # the expert hasn't been invited to this report, so it should trigger
        # permission denied
        response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertEqual(response.status_code, 403)

        # once we invite the expert, it should be ok
        make(Invite, user=invited_expert, report=report)
        response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertEqual(response.status_code, 200)
