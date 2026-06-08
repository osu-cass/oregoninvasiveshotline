from django.urls import reverse
from django.test import TestCase

from model_bakery.baker import make

from oregoninvasiveshotline.utils.test.user import UserMixin

from ..models import Report
from .shared import ORIGIN


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
