from typing import cast

from django import forms

from oregoninvasiveshotline.reports.models import Report
from oregoninvasiveshotline.species.models import Category, Severity, Species


class ManagementForm(forms.ModelForm):
    """
    Allows the expert to confirm the report by choosing a species (or creating
    a new species)
    """
    SUBMIT_FLAG = "MANAGEMENT"
    confidential_error_text = "This species is marked as confidential, so you cannot make this report public."

    new_species = forms.CharField(required=False, label="")
    severity = forms.ModelChoiceField(queryset=Severity.objects.all(), label="", required=False)
    category = forms.ModelChoiceField(queryset=Category.objects.all(), empty_label="")

    class Meta:
        model = Report
        fields = [
            'actual_species',
            'is_public',
            'is_archived',
            'edrr_status',
        ]

    def __init__(self, *args, instance, **kwargs):
        initial = kwargs.pop("initial", {})
        if instance.actual_species is None:
            initial['actual_species'] = instance.reported_species
            initial['category'] = instance.reported_category
        else:
            initial['category'] = instance.actual_species.category

        super().__init__(*args, instance=instance, initial=initial, **kwargs)

        # we have to use these specific IDs so the JS in species_selector.js works
        self.fields['category'].widget.attrs['id'] = "id_reported_category"
        self.fields['actual_species'].widget.attrs['id'] = "id_reported_species"

        self.fields['new_species'].widget.attrs['placeholder'] = "Species common name"

        actual_species_field = cast(forms.ModelChoiceField, self.fields['actual_species'])
        actual_species_field.empty_label = ""
        actual_species_field.required = False

        if self.instance.actual_species and self.instance.actual_species.is_confidential:
            self.fields['is_public'].widget.attrs['disabled'] = True
            self.fields['is_public'].help_text = self.confidential_error_text

    def clean_is_public(self):
        if self.instance.actual_species and self.instance.actual_species.is_confidential:
            return False
        return self.cleaned_data['is_public']

    def clean(self):
        new_species = self.cleaned_data.get("new_species")
        actual_species = self.cleaned_data.get("actual_species")
        severity = self.cleaned_data.get("severity")

        if bool(new_species) & bool(actual_species):
            raise forms.ValidationError("Either choose a species or create a new one.", code="species_contradiction")

        if new_species and not severity:
            self.add_error("severity", forms.ValidationError("This field is required", code="required"))

        if actual_species and actual_species.is_confidential and self.cleaned_data.get("is_public"):
            raise forms.ValidationError(self.confidential_error_text, code="species-confidential")

        return self.cleaned_data

    def save(self, *args, **kwargs):
        new_species = self.cleaned_data.get("new_species")
        severity = self.cleaned_data.get("severity")

        if new_species:
            species = Species(name=new_species, severity=severity, category=self.cleaned_data['category'])
            species.save()
            self.instance.actual_species = species
        elif not self.cleaned_data.get("actual_species"):
            self.instance.actual_species = None

        return super().save(*args, **kwargs)
