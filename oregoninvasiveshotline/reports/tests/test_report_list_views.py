from django.urls import reverse
from django.test import TestCase

from model_bakery.baker import make

from oregoninvasiveshotline.utils.test.user import UserMixin

from ..models import Invite, Report
from .shared import ORIGIN


class ReportListView(TestCase, UserMixin):
    """Cover report-list search and export behavior."""

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )

    def test_get(self):
        """Render reports for an active user."""
        reports = make(Report, _quantity=3, point=ORIGIN)
        self.client.login(email=self.user.email, password="foo")
        response = self.client.get(reverse("reports-list"))
        self.assertEqual(response.status_code, 200)
        self.assertIn(reports[0].title, response.content.decode())

    def get_report_ids(self, response):
        """Return serialized report identifiers from a list response."""
        return {report["pk"] for report in response.context["reports"]}

    def assert_report_card_absent(self, response, report):
        """Assert that a report's list card is absent from a response."""
        report_url = reverse("reports-detail", args=[report.pk])
        self.assertNotContains(
            response,
            '<a class="strong" href="{}">'.format(report_url),
        )

    def test_invalid_anonymous_search_shows_errors_and_no_reports(self):
        """Reject invalid public search fields without exposing reports."""
        public_report = make(Report, point=ORIGIN, is_public=True)
        private_report = make(Report, point=ORIGIN, is_public=False)

        response = self.client.get(reverse("reports-list"), {
            "categories": "not-a-category",
            "counties": "not-a-county",
            "order_by": "not-a-sort",
        })

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.context["form"].is_valid())
        self.assertFalse(response.context["reports"])
        self.assertEqual(response.context["page"].paginator.count, 0)
        self.assertNotIn(public_report.pk, self.get_report_ids(response))
        self.assertNotIn(private_report.pk, self.get_report_ids(response))
        self.assert_report_card_absent(response, public_report)
        self.assert_report_card_absent(response, private_report)
        self.assertContains(response, 'role="alert"')
        self.assertContains(response, "Categories")
        self.assertContains(response, "Counties")
        self.assertContains(response, "Order by")
        self.assertContains(
            response,
            "Correct the search errors above to view reports.",
        )
        self.assertNotContains(response, "No matching reports found.")
        self.assertNotContains(response, "subscribe to this search")

    def test_active_null_keyword_search_shows_error_and_no_reports(self):
        """Reject a null keyword for active users without listing reports."""
        report = make(Report, point=ORIGIN)
        self.client.login(email=self.user.email, password="foo")

        response = self.client.get(reverse("reports-list"), {"q": "\x00"})

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.context["form"].is_valid())
        self.assertFalse(response.context["reports"])
        self.assertEqual(response.context["page"].paginator.count, 0)
        self.assertNotIn(report.pk, self.get_report_ids(response))
        self.assertContains(response, 'role="alert"')
        self.assertContains(response, "Search")
        self.assertContains(response, "Null characters are not allowed.")
        self.assertNotContains(response, "Export:")
        self.assertNotContains(response, "Subscribe to this search")

    def test_anonymous_null_keyword_search_shows_error_and_no_reports(self):
        """Reject a null keyword from an anonymous user."""
        report = make(Report, point=ORIGIN, is_public=True)

        response = self.client.get(reverse("reports-list"), {"q": "\x00"})

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.context["form"].is_valid())
        self.assertFalse(response.context["reports"])
        self.assertEqual(response.context["page"].paginator.count, 0)
        self.assertNotIn(report.pk, self.get_report_ids(response))
        self.assert_report_card_absent(response, report)
        self.assertContains(response, 'role="alert"')
        self.assertContains(response, "Search")
        self.assertContains(response, "Null characters are not allowed.")

    def test_invalid_session_owner_search_returns_no_reports(self):
        """Reject invalid searches that include session-owned reports."""
        report = make(Report, point=ORIGIN, is_public=False)
        session = self.client.session
        session["report_ids"] = [report.pk]
        session.save()

        response = self.client.get(reverse("reports-list"), {
            "categories": "not-a-category",
        })

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.context["form"].is_valid())
        self.assertFalse(response.context["reports"])
        self.assertEqual(response.context["page"].paginator.count, 0)
        self.assertNotIn(report.pk, self.get_report_ids(response))
        self.assert_report_card_absent(response, report)

    def test_invalid_inactive_invited_search_returns_no_reports(self):
        """Reject invalid invited searches for inactive users."""
        invited_user = self.create_user(
            username="invitee@example.com",
            is_active=False,
        )
        invited_report = make(Report, point=ORIGIN, is_public=False)
        other_report = make(Report, point=ORIGIN, is_public=True)
        make(Invite, user=invited_user, created_by=self.user, report=invited_report)
        self.client.force_login(invited_user)

        response = self.client.get(reverse("reports-list"), {
            "source": "invited",
            "categories": "not-a-category",
        })

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.context["form"].is_valid())
        self.assertEqual(response.context["page"].paginator.count, 0)
        self.assertFalse(response.context["reports"])
        self.assertNotIn(invited_report.pk, self.get_report_ids(response))
        self.assertNotIn(other_report.pk, self.get_report_ids(response))

    def test_valid_searches_preserve_visibility_rules(self):
        """Keep valid anonymous, invited, session, and active searches scoped."""
        public_report = make(Report, point=ORIGIN, is_public=True)
        private_report = make(Report, point=ORIGIN, is_public=False)
        session_report = make(Report, point=ORIGIN, is_public=False)

        response = self.client.get(reverse("reports-list"))
        self.assertEqual(self.get_report_ids(response), {public_report.pk})

        session = self.client.session
        session["report_ids"] = [session_report.pk]
        session.save()
        response = self.client.get(reverse("reports-list"))
        self.assertEqual(
            self.get_report_ids(response),
            {public_report.pk, session_report.pk},
        )

        invited_user = self.create_user(
            username="invitee@example.com",
            is_active=False,
        )
        make(Invite, user=invited_user, created_by=self.user, report=private_report)
        self.client.force_login(invited_user)
        response = self.client.get(reverse("reports-list"), {"source": "invited"})
        self.assertEqual(self.get_report_ids(response), {private_report.pk})

        active_report = make(Report, point=ORIGIN, created_by=self.user)
        self.client.login(email=self.user.email, password="foo")
        response = self.client.get(reverse("reports-list"), {"source": "reported"})
        self.assertEqual(self.get_report_ids(response), {active_report.pk})

    def test_invalid_active_exports_render_search_errors(self):
        """Return the error page instead of exporting invalid active searches."""
        make(Report, point=ORIGIN)
        self.client.login(email=self.user.email, password="foo")

        for export_format in ("csv", "kml"):
            with self.subTest(export_format=export_format):
                response = self.client.get(reverse("reports-list"), {
                    "q": "\x00",
                    "export": export_format,
                })

                self.assertEqual(response.status_code, 200)
                self.assertTrue(response["Content-Type"].startswith("text/html"))
                self.assertNotIn("Content-Disposition", response)
                self.assertContains(
                    response,
                    "Correct the search errors above to view reports.",
                )

    def test_valid_filtered_exports_only_include_matching_reports(self):
        """Export only reports selected by a valid active search."""
        selected_report = make(Report, point=ORIGIN, is_archived=True)
        excluded_report = make(Report, point=ORIGIN, is_archived=False)
        self.client.login(email=self.user.email, password="foo")

        for export_format in ("csv", "kml"):
            with self.subTest(export_format=export_format):
                response = self.client.get(reverse("reports-list"), {
                    "is_archived": "archived",
                    "export": export_format,
                })

                content = response.content.decode()
                self.assertEqual(response.status_code, 200)
                self.assertEqual(
                    response["Content-Disposition"],
                    "attachment; filename=\"reports.{}\"".format(export_format),
                )
                self.assertIn(str(selected_report.pk), content)
                self.assertNotIn(str(excluded_report.pk), content)

    def test_valid_empty_search_keeps_no_matches_message(self):
        """Keep the empty-result message for valid searches."""
        self.client.login(email=self.user.email, password="foo")

        response = self.client.get(reverse("reports-list"), {
            "is_archived": "archived",
        })

        self.assertTrue(response.context["form"].is_valid())
        self.assertFalse(response.context["reports"])
        self.assertContains(response, "No matching reports found.")
