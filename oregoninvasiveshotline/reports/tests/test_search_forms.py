from datetime import timedelta

from django.utils import timezone
from django.test import TestCase

from model_bakery.baker import make

from oregoninvasiveshotline.utils.test.user import UserMixin

from ..forms import ReportSearchForm
from ..models import Invite, Report


from .shared import ORIGIN


class ReportSearchFormTest(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=True
        )
        self.report = Report()

    def tearDown(self):
        if self.report.pk is not None:
            self.report.delete()

    def test_filter_by_open_and_claimed_reports(self):
        # test combined filters
        claimed_open_report = make(
            Report, claimed_by=self.user, is_archived=False, point=ORIGIN)
        claimed_archived_report = make(
            Report, claimed_by=self.user, is_archived=True, point=ORIGIN)
        unclaimed_report = make(Report, claimed_by=None, point=ORIGIN)

        form = ReportSearchForm({
            "q": "",
            "claimed_by": "me",
            "is_archived": "notarchived"
        }, user=self.user)
        reports = form.search(Report.objects.all())

        self.assertIn(claimed_open_report, reports)
        self.assertNotIn(claimed_archived_report, reports)
        self.assertNotIn(unclaimed_report, reports)
        self.assertEqual(len(reports), 1)

    def test_filter_by_claimed_by_me_reports(self):
        claimed_open_report = make(
            Report, claimed_by=self.user, is_archived=False, point=ORIGIN)
        claimed_archived_report = make(
            Report, claimed_by=self.user, is_archived=True, point=ORIGIN)
        unclaimed_report = make(Report, claimed_by=None, point=ORIGIN)

        form = ReportSearchForm({
            "q": "",
            "claimed_by": "me",
        }, user=self.user)
        reports = form.search(Report.objects.all())

        self.assertIn(claimed_open_report, reports)
        self.assertIn(claimed_archived_report, reports)
        self.assertNotIn(unclaimed_report, reports)
        self.assertEqual(len(reports), 2)

    def test_filter_by_unclaimed_reports(self):
        claimed_report = make(Report, claimed_by=self.user, point=ORIGIN)
        unclaimed_report = make(Report, claimed_by=None, point=ORIGIN)

        form = ReportSearchForm({
            "q": "",
            "claimed_by": "nobody",
        }, user=self.user)
        reports = form.search(Report.objects.all())

        self.assertIn(unclaimed_report, reports)
        self.assertNotIn(claimed_report, reports)
        self.assertEqual(len(reports), 1)

    def test_filter_by_archived_reports(self):
        archived_report = make(Report, is_archived=True, point=ORIGIN)
        unarchived_report = make(Report, is_archived=False, point=ORIGIN)

        form = ReportSearchForm({
            "q": "",
            "is_archived": "archived",
        }, user=self.user)
        reports = form.search(Report.objects.all())

        self.assertIn(archived_report, reports)
        self.assertNotIn(unarchived_report, reports)
        self.assertEqual(len(reports), 1)

    def test_filter_by_unarchived_reports(self):
        archived_report = make(Report, is_archived=True, point=ORIGIN)
        unarchived_report = make(Report, is_archived=False, point=ORIGIN)

        form = ReportSearchForm({
            "q": "",
            "is_archived": "notarchived",
        }, user=self.user)
        reports = form.search(Report.objects.all())

        self.assertIn(unarchived_report, reports)
        self.assertNotIn(archived_report, reports)
        self.assertEqual(len(reports), 1)

    def test_filter_by_public_reports(self):
        pub_report = make(Report, is_public=True, point=ORIGIN)
        priv_report = make(Report, is_public=False, point=ORIGIN)

        form = ReportSearchForm({
            "q": "",
            "is_public": "public",
        }, user=self.user)
        reports = form.search(Report.objects.all())

        self.assertIn(pub_report, reports)
        self.assertNotIn(priv_report, reports)
        self.assertEqual(len(reports), 1)

    def test_filter_by_not_public_reports(self):
        pub_report = make(Report, is_public=True, point=ORIGIN)
        priv_report = make(Report, is_public=False, point=ORIGIN)

        form = ReportSearchForm({
            "q": "",
            "is_public": "notpublic",
        }, user=self.user)
        reports = form.search(Report.objects.all())

        self.assertIn(priv_report, reports)
        self.assertNotIn(pub_report, reports)
        self.assertEqual(len(reports), 1)

    def test_filter_by_reports_user_was_invited_to(self):
        inviter = self.create_user(username="inviter@example.com")
        invited_report = make(Report, created_by=inviter, point=ORIGIN)
        other_report = make(Report, point=ORIGIN)
        make(Invite, user=self.user, created_by=inviter, report=invited_report)

        form = ReportSearchForm({
            "q": "",
            "source": "invited",
        }, user=self.user)
        reports = form.search(Report.objects.all())

        self.assertIn(invited_report, reports)
        self.assertNotIn(other_report, reports)
        self.assertEqual(len(reports), 1)

    def test_filter_by_reports_user_reported(self):
        my_report = make(Report, created_by=self.user, point=ORIGIN)
        other_report = make(Report, point=ORIGIN)

        form = ReportSearchForm({
            "q": "",
            "source": "reported",
        }, user=self.user, report_ids=[my_report.pk])
        reports = form.search(Report.objects.all())

        self.assertIn(my_report, reports)
        self.assertNotIn(other_report, reports)
        self.assertEqual(len(reports), 1)

    def test_order_by_field_sorts_reports(self):
        now = timezone.now()
        make(Report, created_on=now - timedelta(days=1), point=ORIGIN)
        make(Report, created_on=now, point=ORIGIN)
        make(Report, created_on=now + timedelta(days=1), point=ORIGIN)

        form = ReportSearchForm({
            "order_by": "-created_on",
        }, user=self.user)
        reports = form.search(Report.objects.all())

        self.assertTrue(reports, Report.objects.all().order_by("-created_on"))

    def test_inactive_users_only_see_public_fields(self):
        self.user.is_active = False
        self.user.save()
        form = ReportSearchForm({'q': ""}, user=self.user)
        form_fields = sorted(tuple(form.fields.keys()))
        public_fields = sorted(form.public_fields)
        self.assertEqual(form_fields, public_fields)

    def test_inactive_users_only_see_public_reports_and_reports_they_created(self):
        self.user.is_active = False
        self.user.save()
        pub_report = make(Report, is_public=True, point=ORIGIN)
        priv_report = make(Report, is_public=False, point=ORIGIN)
        my_report = make(Report, created_by=self.user, point=ORIGIN)

        # Since we aren't creating reports through a view, manually assign the
        # created report to report_ids (already covered in view tests)
        form = ReportSearchForm({"q": ""}, user=self.user, report_ids=[my_report.pk])
        reports = form.search(Report.objects.all())

        # Ensure that only pub_report and my_report are in the list of reports
        self.assertIn(pub_report, reports)
        self.assertIn(my_report, reports)
        self.assertNotIn(priv_report, reports)
        self.assertEqual(len(reports), 2)
