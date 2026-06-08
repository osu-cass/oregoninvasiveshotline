import codecs
import csv

from django.urls import reverse
from django.test import TestCase

from model_bakery.baker import make

from oregoninvasiveshotline.utils.test.user import UserMixin

from ..models import Report
from ..views import _export
from .shared import ORIGIN


class ReportListView(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )

    def test_get(self):
        reports = make(Report, _quantity=3, point=ORIGIN)
        self.client.login(email=self.user.email, password="foo")
        response = self.client.get(reverse("reports-list"))
        self.assertEqual(response.status_code, 200)
        self.assertIn(reports[0].title, response.content.decode())


class ExportTest(TestCase):

    def test_csv(self):
        reports = make(Report, _quantity=3, point=ORIGIN)
        response = _export(reports, format="csv")
        reader = csv.DictReader(codecs.iterdecode(response, "utf8"))
        rows = list(reader)
        self.assertEqual(3, len(rows))
        self.assertEqual(rows[2]['Description'], reports[2].description)

    def test_kml(self):
        reports = make(Report, _quantity=3, point=ORIGIN)
        response = _export(reports, format="kml")
        # this is harder to test without trying to parse the XML
        self.assertIn(reports[0].description, response.content.decode())