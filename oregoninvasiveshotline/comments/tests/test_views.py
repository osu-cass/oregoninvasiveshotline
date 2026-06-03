from django.test import TestCase
from django.urls import reverse

from model_bakery.baker import make

from oregoninvasiveshotline.utils.test.user import UserMixin
from oregoninvasiveshotline.images.models import Image
from oregoninvasiveshotline.reports.models import Report

from ..models import Comment


from .shared import ORIGIN


class CommentEditViewTest(TestCase, UserMixin):

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

    def test_get(self):
        report = make(Report, created_by=self.inactive_user, point=ORIGIN)
        session = self.client.session
        session['report_ids'] = [report.pk]
        session.save()
        comment = make(Comment, report=report, created_by=self.inactive_user)
        response = self.client.get(reverse("comments-edit", args=[comment.pk]))
        self.assertEqual(response.status_code, 200)

    def test_anonymous_users_are_forced_to_login(self):
        comment = make(Comment, report=make(Report, point=ORIGIN))
        response = self.client.get(reverse("comments-edit", args=[comment.pk]))
        self.assertEqual(response.status_code, 302)

    def test_not_allowed_to_edit(self):
        report = make(Report, point=ORIGIN)
        comment = make(Comment, report=report)
        self.client.login(email=self.user.email, password="foo")
        response = self.client.get(reverse("comments-edit", args=[comment.pk]))
        self.assertEqual(response.status_code, 403)

    def test_post(self):
        report = make(Report, created_by=self.inactive_user, point=ORIGIN)
        session = self.client.session
        session['report_ids'] = [report.pk]
        session.save()
        comment = make(Comment, report=report, created_by=self.inactive_user)
        data = {
            "body": "hello",
            "form-TOTAL_FORMS": "0",
            "form-INITIAL_FORMS": "0",
            "form-MIN_NUM_FORMS": "0",
            "form-MAX_NUM_FORMS": "1000",
        }
        response = self.client.post(reverse("comments-edit", args=[comment.pk]), data)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Comment.objects.get(pk=comment.pk).body, "hello")

    def test_post_with_image(self):
        # make a report for a user who is allowed to login and control
        # visibility (this would be a site admin)
        report = make(Report, created_by=self.admin, point=ORIGIN)
        self.client.login(email=self.admin.email, password="admin")

        comment = make(Comment, report=report, created_by=self.admin)
        data = {
            "body": "hello",
            "visibility": Comment.PUBLIC,
            "form-TOTAL_FORMS": "1",
            "form-INITIAL_FORMS": "0",
            "form-MIN_NUM_FORMS": "0",
            "form-MAX_NUM_FORMS": "1000",
            "form-0-image_data_uri": "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=",
            "form-0-name": "Hello world",
            "form-0-visibility": Image.PUBLIC,
        }
        response = self.client.post(reverse("comments-edit", args=[comment.pk]), data)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Comment.objects.get(pk=comment.pk).body, "hello")
        self.assertEqual(Image.objects.filter(comment=comment, visibility=Image.PUBLIC).count(), 1)


class CommentDeleteViewTest(TestCase, UserMixin):

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

    def test_get(self):
        report = make(Report, point=ORIGIN)
        comment = make(Comment, report=report, created_by=self.user)
        self.client.login(email=self.user.email, password="foo")
        response = self.client.get(reverse("comments-delete", args=[comment.pk]))
        self.assertEqual(response.status_code, 200)

    def test_post(self):
        report = make(Report, point=ORIGIN)
        comment = make(Comment, report=report, created_by=self.user)
        self.client.login(email=self.user.email, password="foo")
        response = self.client.post(reverse("comments-delete", args=[comment.pk]))
        self.assertEqual(response.status_code, 302)

    def test_not_allowed_to_delete(self):
        report = make(Report, created_by=self.user, point=ORIGIN)
        comment = make(Comment, report=report)
        self.client.login(email=self.user.email, password="foo")
        response = self.client.post(reverse("comments-delete", args=[comment.pk]))
        self.assertRedirects(response, reverse("reports-detail", args=[report.pk]))


class CommentUrlizeViewTest(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True
        )

    def test_get(self):
        report = make(Report, created_by=self.user, point=ORIGIN)
        comment = make(Comment, report=report, created_by=self.user, body="www.google.com")
        self.client.login(email=self.user.email, password="foo")
        self.assertEqual(Comment.objects.get(pk=comment.pk).body, "www.google.com")
        response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertIn('<a href="http://www.google.com"', str(response.content))


class CommentNoUrlizeViewTest(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=False
        )

    def test_get(self):
        report = make(Report, created_by=self.user, point=ORIGIN)
        comment = make(Comment, report=report, created_by=self.user, body="www.google.com")
        session = self.client.session
        session['report_ids'] = [report.pk]
        session.save()
        self.client.login(email=self.user.email, password="foo")
        self.assertEqual(Comment.objects.get(pk=comment.pk).body, "www.google.com")
        response = self.client.get(reverse("reports-detail", args=[report.pk]))
        self.assertContains(response, 'www.google.com')
        self.assertNotIn('<a href="http://www.google.com"', str(response.content))
