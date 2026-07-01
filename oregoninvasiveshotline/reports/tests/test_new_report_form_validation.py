from django.test import TransactionTestCase

from ..forms import NewReportForm, PHONE_VALIDATION_ERROR, REPORT_LONG_TEXT_MAX_LENGTH
from .form_helpers import get_valid_new_report_form_data


class NewReportFormValidationTest(TransactionTestCase):

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
        form = NewReportForm(get_valid_new_report_form_data(
            identification_process="Compared flower color and leaf shape to the field guide.",
            phone="+1 (541) 555-1212 ext. 123",
            questions="Can someone confirm whether removal is recommended?",
        ))

        self.assertTrue(form.is_valid())

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
                form = NewReportForm(get_valid_new_report_form_data(**{field_name: too_long}))

                self.assertFalse(form.is_valid())
                self.assert_field_has_error_code(form, field_name, "max_length")

    def test_phone_is_optional(self):
        """Ensure the optional phone field accepts blank values."""
        form = NewReportForm(get_valid_new_report_form_data(phone=""))

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
                form = NewReportForm(get_valid_new_report_form_data(phone=phone_number))

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
                form = NewReportForm(get_valid_new_report_form_data(phone=phone_number))

                self.assertFalse(form.is_valid())
                self.assert_phone_error(form)
