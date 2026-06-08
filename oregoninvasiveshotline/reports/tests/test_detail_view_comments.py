from unittest.mock import patch

from django.urls import reverse
from django.test import TestCase

from model_bakery.baker import make

from oregoninvasiveshotline.comments.forms import CommentForm
from oregoninvasiveshotline.comments.models import Comment

from ..models import Invite, Report
from .detail_helpers import DetailViewUserSetupMixin
from .shared import ORIGIN


class DetailViewCommentTest(DetailViewUserSetupMixin, TestCase):

    def test_comment_form_dependent_on_the_can_create_comment_check(self):
        report = make(Report, is_public=True, point=ORIGIN)
        with patch("oregoninvasiveshotline.reports.views.can_create_comment", return_value=True) as perm_check:
            with patch("oregoninvasiveshotline.reports.views.CommentForm"):
                response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertTrue(perm_check.called)
        self.assertNotEqual(None, response.context['comment_form'])

        with patch("oregoninvasiveshotline.reports.views.can_create_comment", return_value=False) as perm_check:
            with patch("oregoninvasiveshotline.reports.views.CommentForm"):
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
