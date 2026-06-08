import os

from django.contrib.gis.geos import Point
from django.db.models.signals import post_save

from ..models import Report, receiver__generate_icon

ORIGIN = Point(0, 0)
TEST_IMAGE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..', 'test_assets', 'fsm.png')
)


class SuppressPostSaveMixin:

    @classmethod
    def setUpClass(cls):
        # Parent class comes from each concrete test case.
        super().setUpClass()  # pyright: ignore
        post_save.disconnect(receiver__generate_icon, sender=Report)

    @classmethod
    def tearDownClass(cls):
        # Parent class comes from each concrete test case.
        super().tearDownClass()  # pyright: ignore
        post_save.connect(receiver__generate_icon, sender=Report)
