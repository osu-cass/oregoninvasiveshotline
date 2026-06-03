
from django.core.exceptions import NON_FIELD_ERRORS
from django.test import TestCase

from model_bakery.baker import make

from oregoninvasiveshotline.species.models import Category, Severity, Species

from ..forms import ManagementForm
from ..models import Report


from .shared import ORIGIN, SuppressPostSaveMixin


class ManagementFormTest(SuppressPostSaveMixin, TestCase):

    def test_species_and_category_initialized(self):
        species = make(Species)
        report = make(Report, reported_species=species, reported_category=species.category, point=ORIGIN)
        form = ManagementForm(instance=report)
        self.assertEqual(form.initial['category'], species.category)
        self.assertEqual(form.initial['actual_species'], species)

    def test_field_widget_ids_match_expected_id_from_javascript(self):
        """
        The javascript for the category/species selector expects the ids for
        the category and species fields to be something particular
        """
        report = make(Report, point=ORIGIN)
        form = ManagementForm(instance=report)
        self.assertEqual(form.fields['category'].widget.attrs['id'], 'id_reported_category')
        self.assertEqual(form.fields['actual_species'].widget.attrs['id'], 'id_reported_species')

    def test_either_a_new_species_is_entered_xor_an_existing_species_is_selected(self):
        report = make(Report, point=ORIGIN)
        data = {
            "new_species": "Yeti",
            "actual_species": make(Species).pk
        }
        form = ManagementForm(data, instance=report)
        self.assertFalse(form.is_valid())
        self.assertTrue(form.has_error(NON_FIELD_ERRORS, code="species_contradiction"))

        data = {
            "new_species": "Yeti",
        }
        form = ManagementForm(data, instance=report)
        self.assertFalse(form.is_valid())
        self.assertFalse(form.has_error(NON_FIELD_ERRORS, code="species_contradiction"))

    def test_if_new_species_is_entered_severity_is_required(self):
        report = make(Report, point=ORIGIN)
        data = {
            "new_species": "Yeti",
        }
        form = ManagementForm(data, instance=report)
        self.assertFalse(form.is_valid())
        self.assertTrue(form.has_error("severity", code="required"))

    def test_new_species_is_saved(self):
        report = make(Report, point=ORIGIN)
        category = make(Category)
        severity = make(Severity)
        data = {
            "new_species": "Yeti",
            "category": category.pk,
            "severity": severity.pk
        }
        form = ManagementForm(data, instance=report)
        self.assertTrue(form.is_valid())
        form.save()
        species = Species.objects.get(name="Yeti", category=category)
        self.assertEqual(report.actual_species, species)

    def test_is_public_field_disabled_for_is_confidential_species(self):
        report = make(Report, actual_species__is_confidential=True, point=ORIGIN)
        form = ManagementForm(instance=report, data={
            # even though this was submitted with a True-y value, the form
            # should override it so it is always False
            "is_public": 1,
            "edrr_status": 0,
            "category": make(Category).pk,
        })
        self.assertTrue(form.fields['is_public'].widget.attrs['disabled'])
        self.assertTrue(form.is_valid())
        form.save()
        # even though the data spoofed the is_public flag as True, it should still be false
        self.assertFalse(report.is_public)

    def test_settings_the_actual_species_to_a_confidential_species_raises_an_error_if_the_report_is_public_too(self):
        report = make(Report, point=ORIGIN)
        form = ManagementForm(instance=report, data={
            "actual_species": make(Species, is_confidential=True).pk,
            "is_public": 1,
            "edrr_status": 0,
            "category": make(Category).pk,
        })
        self.assertFalse(form.is_valid())
        self.assertTrue(form.has_error(NON_FIELD_ERRORS, "species-confidential"))
