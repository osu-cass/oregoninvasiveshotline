from typing import List, cast

from django import forms
from django.contrib.gis.geos import Point
from django.core.exceptions import SuspiciousFileOperation
from django.core.files.uploadedfile import UploadedFile
from django.db import transaction

from oregoninvasiveshotline.comments.models import Comment
from oregoninvasiveshotline.images.models import Image
from oregoninvasiveshotline.reports.forms.locations import get_county
from oregoninvasiveshotline.reports.models import Report
from oregoninvasiveshotline.reports.tasks import notify_report_submission, notify_report_subscribers
from oregoninvasiveshotline.species.models import Category, Species
from oregoninvasiveshotline.users.models import User
from oregoninvasiveshotline.utils.images import is_webp
from oregoninvasiveshotline.visibility import Visibility


class ReportForm(forms.ModelForm):

    email = forms.EmailField()
    # Assignment type is correct at runtime.
    prefix = forms.CharField(required=False)  # pyright: ignore[reportAssignmentType]
    first_name = forms.CharField()
    last_name = forms.CharField()
    suffix = forms.CharField(required=False)
    phone = forms.CharField(required=False)
    questions = forms.CharField(
        required=False,
        widget=forms.Textarea,
        label=(
            'Do you have additional questions for the invasive species expert who will review '
            'this report?'
        ),
    )

    class Meta:
        model = Report
        fields = [
            'reported_category',
            'reported_species',
            'description',
            'location',
            'point',
            'has_specimen',
        ]
        widgets = {
            'point': forms.widgets.HiddenInput
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        reported_species_field = cast(forms.ModelChoiceField, self.fields['reported_species'])
        reported_species_field.empty_label = 'Unknown'
        reported_species_field.required = False


    def clean_email(self):
        # NOTE: Technically, email addresses are case-sensitive, but in
        #       practice we can ignore that.
        email = self.cleaned_data['email']
        email = email.lower()
        return email

    def save(self, *args, **kwargs):
        """Save the report, attach reporter details, and queue notifications.

        Args:
            *args: Positional arguments passed to ModelForm.save.
            **kwargs: Keyword arguments passed to ModelForm.save.

        Returns:
            Report: The saved report instance.
        """
        report = self.instance

        # NOTE: If the user doesn't exist, a new inactive account is
        #       automatically created here, which seems to me like a
        #       tremendously bad idea (still trying to work out how to
        #       fix this).
        email = self.cleaned_data['email']
        defaults = {
            'email': email.lower(),
            'prefix': self.cleaned_data.get('prefix', ''),
            'first_name': self.cleaned_data.get('first_name'),
            'last_name': self.cleaned_data.get('last_name'),
            'suffix': self.cleaned_data.get('suffix', ''),
            'phone': self.cleaned_data.get('phone', ''),
            'is_active': False,
        }
        user, _ = User.objects.get_or_create(email__iexact=email, defaults=defaults)

        report.created_by = user
        report.county = get_county(report.point)

        super().save(*args, **kwargs)

        questions = self.cleaned_data.get('questions')
        if questions:
            Comment.objects.create(
                report=report, created_by=user, body=questions, visibility=Comment.PROTECTED)

        transaction.on_commit(lambda: notify_report_submission.delay(report.pk, user.pk))
        transaction.on_commit(lambda: notify_report_subscribers.delay(report.pk))

        return report


class NewReportForm(forms.Form):

    find_description = forms.CharField()
    category = forms.ModelChoiceField(queryset=Category.objects.all())
    species = forms.ModelChoiceField(queryset=Species.objects.all(), required=False)
    is_species_unknown = forms.BooleanField(required=False, label='Species unknown')
    identification_process = forms.CharField(required=False, widget=forms.Textarea)
    location_description = forms.CharField()
    # Long/Lat are required, but we instead just set an error message on
    # latitude that's a bit more human friendly later on in the clean method.
    latitude = forms.FloatField(required=False)
    longitude = forms.FloatField(required=False)
    email = forms.EmailField()
    first_name = forms.CharField()
    last_name = forms.CharField()
    phone = forms.CharField(required=False)
    questions = forms.CharField(required=False, widget=forms.Textarea)

    def clean_email(self):
        """Normalize the submitted email address to lowercase.

        Returns:
            str: Normalized lowercase email address.
        """
        # NOTE: Technically, email addresses are case-sensitive, but in
        #       practice we can ignore that.
        email = self.cleaned_data['email']
        email = email.lower()
        return email

    def clean(self):
        """Validate species-selection rules and required map coordinates.

        Returns:
            dict[str, Any]: Cleaned form data.
        """
        cleaned_data = super().clean()
        category = cleaned_data.get('category')
        species = cleaned_data.get('species')
        is_species_unknown = cleaned_data.get('is_species_unknown')

        if category and category.species.exists() and not species and not is_species_unknown:
            self.add_error("species", "Either choose a species or check the 'Mark as unknown' option.")
            self.add_error("is_species_unknown", "Either check the 'Mark as unknown' option or choose a species.")

        # Currently this is an impossible state to get into based on the current UI code.
        # However, probably still worth handling.
        if species and is_species_unknown:
            self.add_error("species", "You cannot choose a species and mark it as unknown at the same time.")
            self.add_error("is_species_unknown", "You cannot choose a species and mark it as unknown at the same time.")

        latitude = cleaned_data.get("latitude")
        longitude = cleaned_data.get("longitude")
        if latitude is None or longitude is None:
            self.add_error("latitude", "Select a location on the map.")
            return cleaned_data

        # point = Point(longitude, latitude, srid=4326)
        # if not get_allowed_county(point):
        #     self.add_error("latitude", "Report location must be in Oregon or Washington.")

        return cleaned_data

    def _get_report_point(self):
        """Create a WGS84 point from cleaned latitude and longitude values.

        Returns:
            Point: Geographic point using SRID 4326.
        """
        latitude = self.cleaned_data.get("latitude")
        longitude = self.cleaned_data.get("longitude")
        return Point(longitude, latitude, srid=4326)

    def save(self, images: List[UploadedFile] | None = None, captions: List[str] | None = None):
        """Create a report, attach uploaded images, and queue notifications.

        Args:
            images: Uploaded image files from the wizard.
            captions: Optional captions aligned to uploaded images by index.

        Returns:
            Report: The created report instance.
        """
        if images and images.__len__() > 10:
            raise forms.ValidationError("You can only upload up to 10 images.")
        # NOTE: If the user doesn't exist, a new inactive account is
        #       automatically created here, which seems to me like a
        #       tremendously bad idea (still trying to work out how to
        #       fix this).
        email = self.cleaned_data['email']
        defaults = {
            'email': email.lower(),
            'prefix': '',
            'first_name': self.cleaned_data.get('first_name'),
            'last_name': self.cleaned_data.get('last_name'),
            'suffix': '',
            'phone': self.cleaned_data.get('phone', ''),
            'is_active': False,
        }
        user, _ = User.objects.get_or_create(email__iexact=email, defaults=defaults)

        point = self._get_report_point()
        report = Report(
            reported_category=self.cleaned_data['category'],
            reported_species=self.cleaned_data.get('species'),
            description=self.cleaned_data.get('find_description'),
            identification_process=self.cleaned_data.get('identification_process'),
            location=self.cleaned_data.get('location_description'),
            point=point,
            has_specimen=False,
            created_by=user,
        )
        report.county = get_county(point)
        report.save()

        # Save uploaded images attached to this report.
        for i, image_file in enumerate(images or []):
            if not is_webp(image_file):
                # All submitted images MUST be of type webp
                # This conversion is done on the client and if it isn't, then the user is an attacker
                raise SuspiciousFileOperation("Images must be of type webp.")
            caption = (captions[i] if captions and i < len(captions) else '') or ''
            Image.objects.create(
                image=image_file,
                name=caption,
                created_by=user,
                report=report,
                visibility=Visibility.PUBLIC,
            )

        questions = self.cleaned_data.get('questions')
        if questions:
            Comment.objects.create(
                report=report, created_by=user, body=questions, visibility=Comment.PROTECTED)

        transaction.on_commit(lambda: notify_report_submission.delay(report.pk, user.pk))
        transaction.on_commit(lambda: notify_report_subscribers.delay(report.pk))

        return report
