from unittest.mock import Mock, patch

from django.urls import reverse
from django.test import TestCase

from model_bakery.baker import make

from ..models import Report
from .detail_helpers import DetailViewUserSetupMixin
from .shared import ORIGIN


class DetailViewFormTest(DetailViewUserSetupMixin, TestCase):

    def test_forms_are_none_for_anonymous_users(self):
        report = make(Report, is_public=True, point=ORIGIN)
        response = self.client.get(reverse("reports-detail", args=[report.pk]))
        forms = [
            "comment_form",
            "image_formset",
            "invite_form",
            "management_form",
        ]
        for form in forms:
            self.assertEqual(None, response.context[form])

    def test_forms_are_initialized_for_admins(self):
        self.client.login(email=self.admin.email, password="admin")
        report = make(Report, point=ORIGIN)
        response = self.client.get(reverse("reports-detail", args=[report.pk]))
        forms = [
            "comment_form",
            "image_formset",
            "invite_form",
            "management_form",
        ]
        for form in forms:
            self.assertNotEqual(None, response.context[form])

    def test_forms_filled_out(self):
        report = make(Report, point=ORIGIN)
        self.client.login(email=self.admin.email, password="admin")

        with patch("oregoninvasiveshotline.reports.views.ManagementForm", SUBMIT_FLAG="foo") as m:
            data = {
                "submit_flag": ["foo"],
            }
            response = self.client.post(reverse("reports-detail", args=[report.pk]), data)
            m.assert_called_once_with(data, instance=report)
            self.assertTrue(m().save.called)
            self.assertRedirects(response, reverse("reports-detail", args=[report.pk]))

        # the InviteForm is slightly more complicated, so we need a special case for that
        with patch("oregoninvasiveshotline.reports.views.InviteForm", SUBMIT_FLAG="foo", save=Mock(return_value=Mock(already_invited=1))) as m:
            data = {
                "submit_flag": ["foo"],
            }
            response = self.client.post(reverse("reports-detail", args=[report.pk]), data)
            self.assertEqual(1, m.call_count)
            m().save.assert_called_once_with(self.admin, report)
            self.assertRedirects(response, reverse("reports-detail", args=[report.pk]))
