import io
import tempfile
from typing import cast
from unittest.mock import patch

from django.core import mail
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db import transaction
from django.test import TransactionTestCase, override_settings

from model_bakery.baker import make
from PIL import Image as PILImage

from oregoninvasiveshotline.utils.test.user import UserMixin
from oregoninvasiveshotline.comments.models import Comment
from oregoninvasiveshotline.images.models import Image
from oregoninvasiveshotline.species.models import Category
from oregoninvasiveshotline.notifications.models import UserNotificationQuery
from oregoninvasiveshotline.users.models import User

from ..forms import (
    NewReportForm,
    PHONE_VALIDATION_ERROR,
    REPORT_LONG_TEXT_MAX_LENGTH,
    ReportForm,
)
from ..models import Report
from .shared import ORIGIN


class ReportFormTest(TransactionTestCase, UserMixin):

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

    def test_notify_sends_emails_to_subscribers(self):
        user = self.create_user(username='foo@example.com')

        # Subscribe to the same thing twice to ensure that only one
        # email is sent to the user when a report matches.
        make(UserNotificationQuery, query='q=foobarius', user=user)
        make(UserNotificationQuery, query='q=foobarius', user=user)

        # This report does *not* have the words "foobarius" in it, so no
        # email should be sent.
        form = ReportForm({
            "email": "foo@example.com",
            "first_name": "Foo",
            "last_name": "Bar",
        })
        self.assertFalse(form.is_valid())
        report = make(Report, point=ORIGIN)
        with patch("oregoninvasiveshotline.reports.forms.forms.ModelForm.save"):
            # notification task is out-of-band and uses 'on_commit' barrier
            # so the path being tested is wrapped in a transaction
            with transaction.atomic():
                form.instance = report
                form.save()

        # mailbox should contain one report submission email
        self.assertEqual(len(mail.outbox), 1)

        # This report *does* have the word "foobarius" in it, so it
        # should trigger an email to be sent.
        report = make(Report, reported_category__name='foobarius', point=ORIGIN)
        with patch("oregoninvasiveshotline.reports.forms.forms.ModelForm.save"):
            # notification task is out-of-band and uses 'on_commit' barrier
            # so the path being tested is wrapped in a transaction
            with transaction.atomic():
                form.instance = report
                form.save()

        # mailbox should contain two report submission emails and a
        # subscription notification
        self.assertEqual(len(mail.outbox), 3)

        # If we notify about the same report, no new email should be sent.
        with patch("oregoninvasiveshotline.reports.forms.forms.ModelForm.save"):
            # notification task is out-of-band and uses 'on_commit' barrier
            # so the path being tested is wrapped in a transaction
            with transaction.atomic():
                form.instance = report
                form.save()

        # mailbox should contain three report submission emails and a
        # subscription notification
        self.assertEqual(len(mail.outbox), 4)


class NewReportFormTest(TransactionTestCase):

    def _get_valid_form_data(self, **overrides: object) -> dict[str, object]:
        """Return valid report wizard form data."""
        category = make(Category)
        data = {
            "find_description": "Found near trail edge",
            "category": category.pk,
            "location_description": "Near mile marker 3",
            "latitude": 44.0481,
            "longitude": -123.0906,
            "email": "foo@example.com",
            "first_name": "Foo",
            "last_name": "Bar",
        }
        data.update(overrides)
        return data

    def _make_uploaded_image(
        self,
        file_name: str = "test.png",
        image_format: str = "PNG",
        mode: str = "RGB",
        color: tuple[int, ...] = (255, 0, 0),
    ) -> InMemoryUploadedFile:
        """Return an in-memory uploaded image."""
        image_data = io.BytesIO()
        PILImage.new(mode, (2, 2), color).save(image_data, format=image_format)
        image_size = image_data.tell()
        image_data.seek(0)
        return InMemoryUploadedFile(
            image_data,
            'image',
            file_name,
            f"image/{image_format.lower()}",
            image_size,
            None,
        )

    def assert_field_has_error_code(
        self,
        form: NewReportForm,
        field_name: str,
        error_code: str,
    ) -> None:
        """Assert that a form field has an error with the expected code."""
        field_errors = form.errors.as_data().get(field_name, [])
        self.assertTrue(
            any(error.code == error_code for error in field_errors),
            f"Expected {field_name!r} to have an error with code {error_code!r}.",
        )

    def assert_phone_error(self, form: NewReportForm) -> None:
        """Assert that the phone field has the configured validation error."""
        field_errors = form.errors.as_data().get("phone", [])
        self.assertTrue(
            any(error.message == PHONE_VALIDATION_ERROR for error in field_errors),
            "Expected phone to have the configured validation error.",
        )

    def test_complete_form_data_validates(self):
        """Ensure a full wizard form submission validates successfully."""
        form = NewReportForm(self._get_valid_form_data(
            identification_process="Compared flower color and leaf shape to the field guide.",
            phone="+1 (541) 555-1212 ext. 123",
            questions="Can someone confirm whether removal is recommended?",
        ))

        self.assertTrue(form.is_valid())

    def test_identification_process_not_required(self):
        """Ensure the wizard form validates without an identification process note."""
        form = NewReportForm(self._get_valid_form_data())
        self.assertTrue(form.is_valid())

        with (
            patch("oregoninvasiveshotline.reports.forms.notify_report_submission.delay"),
            patch("oregoninvasiveshotline.reports.forms.notify_report_subscribers.delay"),
        ):
            report = form.save()

        self.assertEqual(report.identification_process, "")

    def test_long_text_fields_validate_max_length(self):
        """Ensure long wizard text fields reject values over the configured limit."""
        too_long = "a" * (REPORT_LONG_TEXT_MAX_LENGTH + 1)
        fields = [
            "find_description",
            "identification_process",
            "location_description",
        ]

        for field_name in fields:
            with self.subTest(field_name=field_name):
                form = NewReportForm(self._get_valid_form_data(**{field_name: too_long}))

                self.assertFalse(form.is_valid())
                self.assert_field_has_error_code(form, field_name, "max_length")

    def test_phone_is_optional(self):
        """Ensure the optional phone field accepts blank values."""
        form = NewReportForm(self._get_valid_form_data(phone=""))

        self.assertTrue(form.is_valid())

    def test_phone_accepts_common_formats(self):
        """Ensure common phone number formats validate successfully."""
        phone_numbers = [
            "(541) 555-1212",
            "541.555.1212",
            "+1 541-555-1212",
            "541 555 1212 x99",
            "541-555-1212 ext. 123",
            "541-555-1212 extension 12345",
        ]

        for phone_number in phone_numbers:
            with self.subTest(phone_number=phone_number):
                form = NewReportForm(self._get_valid_form_data(phone=phone_number))

                self.assertTrue(form.is_valid())

    def test_phone_rejects_invalid_values(self):
        """Ensure phone validation rejects short numbers and invalid characters."""
        phone_numbers = [
            "555-1212",
            "541-555-1212 office",
            "541-555-1212 ext abc",
            "541-555-1212 #123",
        ]

        for phone_number in phone_numbers:
            with self.subTest(phone_number=phone_number):
                form = NewReportForm(self._get_valid_form_data(phone=phone_number))

                self.assertFalse(form.is_valid())
                self.assert_phone_error(form)

    def test_save_maps_wizard_fields(self):
        """Ensure wizard fields are persisted to report and follow-up comment records."""
        form = NewReportForm(self._get_valid_form_data(
            find_description="Leafy plant with white flowers",
            identification_process="Compared leaves and flower clusters with a field guide",
            location_description="Along roadside ditch",
            latitude=44.0521,
            longitude=-123.0867,
            questions="Can someone confirm species?",
        ))
        self.assertTrue(form.is_valid())

        with (
            patch("oregoninvasiveshotline.reports.forms.notify_report_submission.delay"),
            patch("oregoninvasiveshotline.reports.forms.notify_report_subscribers.delay"),
        ):
            report = form.save()

        self.assertEqual(report.description, "Leafy plant with white flowers")
        self.assertEqual(
            report.identification_process,
            "Compared leaves and flower clusters with a field guide",
        )
        self.assertEqual(
            report.location,
            "Along roadside ditch",
        )
        self.assertEqual(Comment.objects.get(report=report).body, "Can someone confirm species?")

    def test_save_converts_non_webp_images(self):
        """Ensure non-WebP uploads are saved as WebP files."""
        form = NewReportForm(self._get_valid_form_data())
        self.assertTrue(form.is_valid())
        uploaded_image = self._make_uploaded_image(
            mode="RGBA",
            color=(255, 0, 0, 0),
        )

        with (
            tempfile.TemporaryDirectory() as media_root,
            override_settings(MEDIA_ROOT=media_root),
            patch("oregoninvasiveshotline.reports.forms.notify_report_submission.delay"),
            patch("oregoninvasiveshotline.reports.forms.notify_report_subscribers.delay"),
        ):
            report = form.save(images=[uploaded_image])
            saved_image = Image.objects.get(report=report)

            self.assertTrue(saved_image.image.name.endswith(".webp"))
            with PILImage.open(saved_image.image.path) as img:
                self.assertEqual(img.format, "WEBP")
                pixel = cast(tuple[int, int, int, int], img.convert("RGBA").getpixel((0, 0)))
                self.assertEqual(pixel[3], 0)

    def test_save_raises_validation_error_when_image_conversion_fails(self):
        """Ensure conversion failures surface as validation errors."""
        form = NewReportForm(self._get_valid_form_data())
        self.assertTrue(form.is_valid())
        image_data = io.BytesIO(b"not an image")
        uploaded_image = InMemoryUploadedFile(
            image_data,
            'image',
            'test.jpg',
            'image/jpeg',
            len(image_data.getvalue()),
            None,
        )

        with self.assertRaisesMessage(
            ValidationError,
            "One or more images could not be processed. Please upload valid image files.",
        ):
            form.save(images=[uploaded_image])
