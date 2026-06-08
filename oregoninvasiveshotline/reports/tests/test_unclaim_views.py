from django.urls import reverse
from django.test import TestCase

from model_bakery.baker import make

from oregoninvasiveshotline.utils.test.user import UserMixin

from ..models import Report
from .shared import ORIGIN


class UnclaimViewTest(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )

    def test_only_person_who_claimed_report_can_unclaim_it(self):
        report = make(Report, point=ORIGIN)
        # to set it back to False
        self.client.login(email=self.user.email, password="foo")

        response = self.client.get(reverse("reports-unclaim", args=[report.pk]))
        self.assertEqual(response.status_code, 403)

        # Self and report is not typed properly, so self.user/report.claimed_by is not typed properly
        report.claimed_by = self.user  # pyright: ignore
        report.save()
        response = self.client.get(reverse("reports-unclaim", args=[report.pk]))
        self.assertEqual(response.status_code, 200)

        response = self.client.post(reverse("reports-unclaim", args=[report.pk]))
        report.refresh_from_db()
        self.assertEqual(None, report.claimed_by)
