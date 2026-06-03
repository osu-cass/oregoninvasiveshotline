from django.core import mail
from django.contrib.gis.geos import Point
from django.test import TestCase, TransactionTestCase
from django.db import transaction
from django.urls import reverse

from model_bakery.baker import make

from oregoninvasiveshotline.utils.test.user import UserMixin
from oregoninvasiveshotline.images.models import Image
from oregoninvasiveshotline.reports.models import Invite, Report

from ..forms import CommentForm
from ..models import Comment


from .shared import ORIGIN


class CommentFormTest(TransactionTestCase, UserMixin):

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

    def test_report_and_created_by_initialized_for_new_comment(self):
        report = make(Report, point=ORIGIN)
        form = CommentForm(user=self.user, report=report)
        self.assertEqual(form.instance.created_by, self.user)
        self.assertEqual(form.instance.report, report)

    def test_visibility_field_removed_for_non_experts(self):
        report = make(Report, point=ORIGIN)
        form = CommentForm(user=self.inactive_user, report=report)
        self.assertNotIn("visibility", form.fields)
        self.assertEqual(form.instance.visibility, Comment.PROTECTED)

    def test_emails_sent_out_for_new_comments_notifies_managers_and_staffers_who_commented(self):
        other_user = self.create_user(username="other@example.com", is_active=False)
        report = make(Report, point=ORIGIN)

        should_be_notified = make(Comment, report=report, created_by=self.admin).created_by.email
        should_not_be_notified = make(Comment, report=report, created_by=self.inactive_user).created_by.email
        form = CommentForm({'body': "foo"}, user=other_user, report=report)
        self.assertTrue(form.is_valid())

        # notification task is out-of-band and uses 'on_commit' barrier
        # so the path being tested is wrapped in a transaction
        with transaction.atomic():
            form.save()

        self.assertIn(should_be_notified, [email.to[0] for email in mail.outbox])
        self.assertNotIn(should_not_be_notified, [email.to for email in mail.outbox])

    def test_email_sent_out_for_new_comment_to_user_who_claimed_report(self):
        report = make(Report, claimed_by=self.user, point=ORIGIN)

        form = CommentForm({'body': "foo"}, user=self.inactive_user, report=report)
        self.assertTrue(form.is_valid())

        # notification task is out-of-band and uses 'on_commit' barrier
        # so the path being tested is wrapped in a transaction
        with transaction.atomic():
            form.save()

        assert report.claimed_by is not None
        self.assertIn(report.claimed_by.email, [email.to[0] for email in mail.outbox])

    def test_email_sent_out_for_new_comment_to_all_invited_experts(self):
        report = make(Report, point=ORIGIN)
        invite = make(Invite, report=report, user=self.user)

        form = CommentForm({'body': "foo"}, user=self.inactive_user, report=report)
        self.assertTrue(form.is_valid())

        # notification task is out-of-band and uses 'on_commit' barrier
        # so the path being tested is wrapped in a transaction
        with transaction.atomic():
            form.save()

        self.assertIn(invite.user.email, [email.to[0] for email in mail.outbox])

    def test_email_not_sent_to_person_submitting_comment(self):
        report = make(Report, point=ORIGIN)
        make(Invite, report=report, user=self.user)

        form = CommentForm({'body': "foo", 'visibility': Comment.PUBLIC},
                           user=self.user, report=report)
        self.assertTrue(form.is_valid())

        # notification task is out-of-band and uses 'on_commit' barrier
        # so the path being tested is wrapped in a transaction
        with transaction.atomic():
            form.save()

        self.assertNotIn(self.user.email, [email.to[0] for email in mail.outbox])

    def test_email_only_sent_to_submitter_if_comment_is_PUBLIC_or_PROTECTED(self):
        report = make(Report, created_by=self.inactive_user, point=ORIGIN)
        invite = make(Invite, report=report)

        form = CommentForm({'body': "foo", 'visibility': Comment.PUBLIC},
                           user=invite.user, report=report)
        self.assertTrue(form.is_valid())

        # notification task is out-of-band and uses 'on_commit' barrier
        # so the path being tested is wrapped in a transaction
        with transaction.atomic():
            form.save()

        self.assertIn(self.inactive_user.email, [email.to[0] for email in mail.outbox])

        mail.outbox = []
        # if the comment is PRIVATE, they don't get notified
        other_user = self.create_user(username="other@example.com", is_active=False)
        report = make(Report, created_by=other_user, point=ORIGIN)
        invite = make(Invite, report=report)

        form = CommentForm({
            'body': "foo",
            'visibility': Comment.PRIVATE,
        }, user=invite.user, report=report)
        self.assertTrue(form.is_valid())

        # notification task is out-of-band and uses 'on_commit' barrier
        # so the path being tested is wrapped in a transaction
        with transaction.atomic():
            form.save()

        self.assertNotIn(other_user.email, [email.to[0] for email in mail.outbox])
