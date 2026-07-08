import codecs
import csv

from django.test import TestCase

from model_bakery.baker import make

from ..models import Report
from ..views import _export
from .shared import ORIGIN


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
