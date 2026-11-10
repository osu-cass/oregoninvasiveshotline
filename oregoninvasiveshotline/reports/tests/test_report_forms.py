from unittest.mock import patch

from django.test import TransactionTestCase

from model_bakery.baker import make

from oregoninvasiveshotline.utils.test.user import UserMixin
from oregoninvasiveshotline.comments.models import Comment
from oregoninvasiveshotline.users.models import User

from ..constants import REPORT_LONG_TEXT_MAX_LENGTH
from ..forms import ReportForm
from ..models import Report
from .shared import ORIGIN


class ReportFormTest(TransactionTestCase, UserMixin):
    LONG_TEXT_FIELDS = ("description", "location", "questions")

    def test_reported_species_is_not_required(self):
        form = ReportForm({})
        self.assertFalse(form.is_valid())
        self.assertFalse(form.has_error("reported_species"))

    def test_save_creates_user_if_it_doesnt_exist(self):
        # the user doesn't exist, so it should be created when the form is saved
        form = ReportForm({
            "email": "foo@example.com",
            "first_name": "Foo",
            "last_name": "Bar",
            "prefix": "Mr.",
            "suffix": "PHD",
        })
        self.assertFalse(form.is_valid())
        report = make(Report, pk=1, point=ORIGIN)
        pre_count = User.objects.count()

        with patch("oregoninvasiveshotline.reports.forms.forms.ModelForm.save") as save:
            form.instance = report
            form.save()
            self.assertTrue(save.called)

        self.assertEqual(User.objects.count(), pre_count+1)
        self.assertEqual(report.created_by.email, "foo@example.com")
        self.assertEqual(report.created_by.is_active, False)
        self.assertEqual(report.created_by.last_name, "Bar")

        # the user already exists, so no record should be created
        pre_count = User.objects.count()
        form = ReportForm({
            "email": "FOO@eXaMplE.com",  # using odd casing here to ensure `icontains` is used
        })
        self.assertFalse(form.is_valid())
        pre_count = User.objects.count()
        with patch("oregoninvasiveshotline.reports.forms.forms.ModelForm.save") as save:
            form.instance = report
            form.save()
            self.assertTrue(save.called)

        self.assertEqual(User.objects.count(), pre_count)

    def test_comment_is_added(self):
        form = ReportForm({
            "email": "foo@example.com",
            "first_name": "Foo",
            "last_name": "Bar",
            "questions": "hello world",
        })
        self.assertFalse(form.is_valid())
        report = make(Report, point=ORIGIN)
        with patch("oregoninvasiveshotline.reports.forms.forms.ModelForm.save"):
            form.instance = report
            form.save()

        self.assertEqual(Comment.objects.get(report=report).body, "hello world")

    def test_long_text_fields_validate_max_length(self):
        """Long text fields reject values over the max length."""
        too_long = "a" * (REPORT_LONG_TEXT_MAX_LENGTH + 1)
        form = ReportForm({field_name: too_long for field_name in self.LONG_TEXT_FIELDS})

        form.is_valid()

        for field_name in self.LONG_TEXT_FIELDS:
            with self.subTest(field_name=field_name):
                self.assertTrue(form.has_error(field_name, "max_length"))
