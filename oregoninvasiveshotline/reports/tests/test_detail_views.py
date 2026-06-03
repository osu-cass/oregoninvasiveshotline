from unittest.mock import Mock, patch

from django.urls import reverse
from django.test import TestCase

from model_bakery.baker import make

from oregoninvasiveshotline.utils.test.user import UserMixin
from oregoninvasiveshotline.comments.forms import CommentForm
from oregoninvasiveshotline.comments.models import Comment

from ..models import Invite, Report


from .shared import ORIGIN


class DetailViewTest(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True
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

    def test_comment_form_dependent_on_the_can_create_comment_check(self):
        report = make(Report, is_public=True, point=ORIGIN)
        with patch("oregoninvasiveshotline.reports.views.detail.can_create_comment", return_value=True) as perm_check:
            with patch("oregoninvasiveshotline.reports.views.detail.CommentForm"):
                response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertTrue(perm_check.called)
        self.assertNotEqual(None, response.context['comment_form'])

        with patch("oregoninvasiveshotline.reports.views.detail.can_create_comment", return_value=False) as perm_check:
            with patch("oregoninvasiveshotline.reports.views.detail.CommentForm"):
                response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertTrue(perm_check.called)
        self.assertEqual(None, response.context['comment_form'])

    def test_display_of_comments_for_each_permission_level(self):
        report = make(Report, is_public=True, created_by=self.inactive_user, point=ORIGIN)
        public = make(Comment, report=report, visibility=Comment.PUBLIC)
        protected = make(Comment, report=report, visibility=Comment.PROTECTED)
        private = make(Comment, report=report, visibility=Comment.PRIVATE)

        # anonymous users should only be able to see public comments
        response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertIn(public.body, response.content.decode())
        self.assertNotIn(protected.body, response.content.decode())
        self.assertNotIn(private.body, response.content.decode())

        # the person who made the report should be allowed to see PROTECTED and PUBLIC comments
        session = self.client.session
        session['report_ids'] = [report.pk]
        session.save()
        response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertIn(public.body, response.content.decode())
        self.assertIn(protected.body, response.content.decode())
        self.assertNotIn(private.body, response.content.decode())

        # staffers should see everything
        self.client.login(email=self.user.email, password="foo")
        session = self.client.session
        session['report_ids'] = []
        session.save()
        response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertIn(public.body, response.content.decode())
        self.assertIn(protected.body, response.content.decode())
        self.assertIn(private.body, response.content.decode())

        # invited experts should see everything
        self.client.logout()
        invited_expert = self.user
        self.client.login(email=invited_expert.email, password="foo")
        invited_expert.is_active = False  # we just had to set this to True to make self.client.login work
        invited_expert.save()
        make(Invite, user=invited_expert, report=report)
        response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertIn(public.body, response.content.decode())
        self.assertIn(protected.body, response.content.decode())
        self.assertIn(private.body, response.content.decode())

    def test_create_comment(self):
        report = make(Report, point=ORIGIN)
        self.client.login(email=self.user.email, password="foo")
        data = {
            "body": "foo",
            "visibility": Comment.PUBLIC,
            "form-TOTAL_FORMS": "0",
            "form-INITIAL_FORMS": "0",
            "form-MIN_NUM_FORMS": "0",
            "form-MAX_NUM_FORMS": "1000",
            "submit_flag": CommentForm.SUBMIT_FLAG
        }
        response = self.client.post(reverse("reports-detail", args=[report.pk]), data)
        self.assertRedirects(response, reverse("reports-detail", args=[report.pk]))
        self.assertEqual(1, Comment.objects.filter(report=report).count())

    def test_create_comment_and_claim(self):
        report = make(Report, point=ORIGIN, claimed_by=None)
        self.assertIsNone(report.claimed_by)
        self.client.login(email=self.user.email, password="foo")
        data = {
            "body": "foo",
            "visibility": Comment.PUBLIC,
            "form-TOTAL_FORMS": "0",
            "form-INITIAL_FORMS": "0",
            "form-MIN_NUM_FORMS": "0",
            "form-MAX_NUM_FORMS": "1000",
            "submit_flag": CommentForm.SUBMIT_FLAG
        }
        response = self.client.post(reverse("reports-detail", args=[report.pk]), data)
        self.assertRedirects(response, reverse("reports-detail", args=[report.pk]))
        response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertEqual(response.context['report'].claimed_by, self.user)

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

        with patch("oregoninvasiveshotline.reports.views.detail.ManagementForm", SUBMIT_FLAG="foo") as m:
            data = {
                "submit_flag": ["foo"],
            }
            response = self.client.post(reverse("reports-detail", args=[report.pk]), data)
            m.assert_called_once_with(data, instance=report)
            self.assertTrue(m().save.called)
            self.assertRedirects(response, reverse("reports-detail", args=[report.pk]))

        # the InviteForm is slightly more complicated, so we need a special case for that
        with patch("oregoninvasiveshotline.reports.views.detail.InviteForm", SUBMIT_FLAG="foo", save=Mock(return_value=Mock(already_invited=1))) as m:
            data = {
                "submit_flag": ["foo"],
            }
            response = self.client.post(reverse("reports-detail", args=[report.pk]), data)
            self.assertEqual(1, m.call_count)
            m().save.assert_called_once_with(self.admin, report)
            self.assertRedirects(response, reverse("reports-detail", args=[report.pk]))
