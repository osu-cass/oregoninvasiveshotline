import io
import tempfile
from typing import cast
from unittest.mock import patch

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.test import TransactionTestCase, override_settings

from PIL import Image as PILImage

from oregoninvasiveshotline.comments.models import Comment
from oregoninvasiveshotline.images.models import Image

from ..forms import NewReportForm
from .form_helpers import get_valid_new_report_form_data, make_uploaded_image


class NewReportFormSaveTest(TransactionTestCase):

    def test_identification_process_not_required(self):
        """Ensure the wizard form validates without an identification process note."""
        form = NewReportForm(get_valid_new_report_form_data())
        self.assertTrue(form.is_valid())

        with (
            patch("oregoninvasiveshotline.reports.forms.notify_report_submission.delay"),
            patch("oregoninvasiveshotline.reports.forms.notify_report_subscribers.delay"),
        ):
            report = form.save()

        self.assertEqual(report.identification_process, "")

    def test_save_maps_wizard_fields(self):
        """Ensure wizard fields are persisted to report and follow-up comment records."""
        form = NewReportForm(get_valid_new_report_form_data(
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
        form = NewReportForm(get_valid_new_report_form_data())
        self.assertTrue(form.is_valid())
        uploaded_image = make_uploaded_image(
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
        form = NewReportForm(get_valid_new_report_form_data())
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
