import binascii
import io
import os

from django.core.files.uploadedfile import InMemoryUploadedFile
from django.test import TestCase

from model_bakery.baker import make, prepare

from ..models import Report
from .shared import ORIGIN


class TestReportIconGeneration(TestCase):

    def _make_category_icon(self):
        content = binascii.unhexlify(
            # Turtle icon encoded as hex
            b'89504e470d0a1a0a0000000d494844520000002000000025080600000023b7eb47000000d249444154588'
            b'5ed95410ec42008453f93b9191cbb9ecd59991082561cba980c6fd3a6c6f004a1405114455114bf063377'
            b'fdfc96d7c9a6de7b9a0445373073bfae0b0020220080d61ae975bb47afa708008095d08c350020a2658cb'
            b'08027a1453cb14733e0e1952645203b3870d005abe083dde04702d9bcbd8fb69522274a1168add1183622'
            b'9236f53cdc123073b76d65dfb398a676e7c65ba21db014884a9c04bf15d0121a4f6877f28505acc86afc5'
            b'a911d19b70b66ec9422f223028219589d74466a066cf08c0115be038327a7e37ff101afa37d185ce02898'
            b'0000000049454e44ae426082'
        )

        return InMemoryUploadedFile(
            io.BytesIO(content),
            'image',
            'test.png',
            'image/png',
            len(content),
            None
        )

    def test_generate_icon_manually(self):
        category = make(
            'species.Category',
            icon=self._make_category_icon()
        )
        report = prepare(
            Report,
            point=ORIGIN,
            actual_species__severity__color='#ff8800',
            actual_species__category=category,
        )
        self.assertFalse(os.path.exists(report.icon_path))
        report.generate_icon()
        self.assertTrue(os.path.exists(report.icon_path))
        # Clean up
        os.unlink(report.icon_path)
        os.unlink(category.icon.path)

    def test_icon_is_generated_on_post_save_for_existing_reports(self):
        report = make(
            Report,
            point=ORIGIN,
            actual_species__severity__color='#ff8800',
            actual_species__category__icon=self._make_category_icon(),
        )
        # The report was saved with a PK by make(), so it should have an
        # icon.
        self.assertTrue(os.path.exists(report.icon_path))
        # Remove the icon and verify that its icon is re-created the
        # next time the report is saved.
        os.unlink(report.icon_path)
        self.assertFalse(os.path.exists(report.icon_path))
        report.save()
        self.assertTrue(os.path.exists(report.icon_path))
        # Clean up
        os.unlink(report.icon_path)
