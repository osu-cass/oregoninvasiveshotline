import os
from html.parser import HTMLParser

from django.contrib.gis.geos import Point
from django.db.models.signals import post_save

from ..models import Report, receiver__generate_icon

ORIGIN = Point(0, 0)
TEST_IMAGE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..', 'test_assets', 'fsm.png')
)


def get_element_attrs(content: str, element_id: str) -> dict[str, str] | None:
    """Return the attributes of the element with an id, or None if absent."""
    found: list[dict[str, str]] = []

    class _Finder(HTMLParser):
        def handle_starttag(self, tag, attrs):
            attr_map = {name: value or '' for name, value in attrs}
            if attr_map.get('id') == element_id:
                found.append(attr_map)

    _Finder().feed(content)
    return found[0] if found else None


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
