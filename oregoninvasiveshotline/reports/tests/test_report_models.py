import posixpath
import io
import os

from django.conf import settings
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.test import TestCase

from model_bakery.baker import make

from oregoninvasiveshotline.comments.models import Comment
from oregoninvasiveshotline.images.models import Image
from oregoninvasiveshotline.species.models import Category, Species

from ..models import Report
from .shared import ORIGIN, TEST_IMAGE_PATH, SuppressPostSaveMixin


class ReportTest(SuppressPostSaveMixin, TestCase):

    def setUp(self):
        self.report = Report()

    def tearDown(self):
        if self.report.pk is not None:
            self.report.delete()

    def _make_report_image(self):
        with open(TEST_IMAGE_PATH, 'rb') as image_file:
            image_data = image_file.read()

        return InMemoryUploadedFile(
            io.BytesIO(image_data),
            'image',
            'test.png',
            'image/png',
            os.path.getsize(TEST_IMAGE_PATH),
            None
        )

    def test_species(self):
        reported_species = make(Species)
        actual_species = make(Species)

        self.assertEqual(make(Report, actual_species=None, reported_species=reported_species, point=ORIGIN).species, reported_species)
        self.assertEqual(make(Report, actual_species=actual_species, reported_species=reported_species, point=ORIGIN).species, actual_species)
        self.assertEqual(make(Report, actual_species=None, reported_species=None, point=ORIGIN).species, None)

    def test_category(self):
        reported_species = make(Species)
        actual_species = make(Species)

        self.assertEqual(
            make(Report, actual_species=None, reported_species=None, reported_category=reported_species.category, point=ORIGIN).category,
            reported_species.category
        )
        self.assertEqual(make(Report, actual_species=actual_species, reported_species=reported_species, point=ORIGIN).category, actual_species.category)

    def test_is_misidentified(self):
        reported_species = make(Species)
        actual_species = make(Species)

        # if they didn't identify the species, then it can't be misidentified
        self.assertEqual(make(Report, actual_species=None, reported_species=None, point=ORIGIN).is_misidentified, False)
        # if the reported and actual species are the same, it's not misidentified
        self.assertEqual(make(Report, actual_species=actual_species, reported_species=actual_species, point=ORIGIN).is_misidentified, False)
        # if the species differ, then it is misidentified
        self.assertEqual(make(Report, actual_species=actual_species, reported_species=reported_species, point=ORIGIN).is_misidentified, True)

    def test_title(self):
        report = make(Report, actual_species=None, reported_species=None, reported_category=make(Category, name='Foo'), point=ORIGIN)
        self.assertEqual(report.title, 'Foo')
        report = make(Report, actual_species=None, reported_species=make(Species, name='Bar', scientific_name='Foo'), point=ORIGIN)
        self.assertEqual(report.title, 'Bar (Foo)')

    def test_image_url(self):
        report = make(Report, point=ORIGIN)

        # A report with only a private image shouldn't have an image URL
        make(
            Image,
            report=report,
            visibility=Image.PRIVATE
        )
        expected_url = None
        self.assertEqual(report.image_url, expected_url)

        # A report with a public image should have an image URL
        image = make(
            Image,
            report=report,
            image=self._make_report_image(),
            visibility=Image.PUBLIC
        )
        file_name = '{image.pk}.png'.format(image=image)
        expected_url = posixpath.join(settings.MEDIA_URL, 'generated_thumbnails', file_name)
        self.assertEqual(report.image_url, expected_url)

        path = os.path.join(settings.MEDIA_ROOT, 'generated_thumbnails', file_name)
        self.assertTrue(os.path.exists(path))

    def test_image_url_from_comment(self):
        report = make(Report, point=ORIGIN)

        make(
            Image,
            comment=make(Comment, report=report),
            visibility=Image.PRIVATE,
            _quantity=2
        )
        expected_url = None
        self.assertEqual(report.image_url, expected_url)

        image = make(
            Image,
            report=report,
            image=self._make_report_image(),
            visibility=Image.PUBLIC
        )
        file_name = '{image.pk}.png'.format(image=image)
        expected_url = posixpath.join(settings.MEDIA_URL, 'generated_thumbnails', file_name)
        self.assertEqual(report.image_url, expected_url)

        path = os.path.join(settings.MEDIA_ROOT, 'generated_thumbnails', file_name)
        self.assertTrue(os.path.exists(path))
