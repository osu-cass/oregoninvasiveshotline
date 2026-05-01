from collections import namedtuple
from typing import Any, List, cast

from django.contrib.gis.geos import Point
from django.core.files.uploadedfile import UploadedFile
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import Q
from django import forms

from oregoninvasiveshotline.utils.search import SearchForm
from oregoninvasiveshotline.comments.models import Comment
from oregoninvasiveshotline.counties.models import County
from oregoninvasiveshotline.images.models import Image
from oregoninvasiveshotline.visibility import Visibility
from oregoninvasiveshotline.species.models import Category, Severity, Species
from oregoninvasiveshotline.users.models import User
from oregoninvasiveshotline.reports.models import Invite, Report
from oregoninvasiveshotline.reports.tasks import (
    notify_report_submission,
    notify_report_subscribers,
    notify_invited_reviewer
)

ALLOWED_REPORT_STATES = ("Oregon", "Washington")

def get_county(point: Point):
    """Return the first county polygon that intersects a point.

    Args:
        point: Geographic point to test for county intersection.

    Returns:
        County | None: First matching county, if any.
    """
    return County.objects.filter(
        the_geom__intersects=point,
    ).first()


def get_category_choices():
    categories = Category.objects.all().order_by('name')
    category_choices = []
    category_choices.extend((c.pk, c.name) for c in categories)
    return category_choices


def get_county_choices():
    county_choices = []
    for county in County.objects.all().order_by('state', 'name'):
        county_choices.append((county.pk, county.label))
    return county_choices


class ReportSearchForm(SearchForm):
    """
    Search for reports.

    This form handles searching of reports by both managers and
    anonymous users.

    Form data can be used to create a :class:`UserNotificationQuery`
    object in the database, which captures the input to this form as
    a QueryDict string. So be careful if you start renaming fields,
    since that will break any :class:`UserNotificationQuery` rows that
    rely on that field.
    """
    public_fields = ['q', 'order_by', 'source', 'categories', 'counties']

    source = forms.ChoiceField(
        required=False,
        label='Extra Criteria',
        choices=[
            ('', '- Extra Criteria -'),
            ('invited', 'Invited to Review'),
            ('reported', 'Reported by Me')
        ]
    )
    categories = forms.MultipleChoiceField(
        required=False,
        label='',
        choices=get_category_choices,
        widget=forms.SelectMultiple(attrs={'title': 'Categories'})
    )
    counties = forms.MultipleChoiceField(
        required=False,
        label='',
        choices=get_county_choices,
        widget=forms.SelectMultiple(attrs={'title': 'Counties'})
    )
    is_archived = forms.ChoiceField(
        required=False,
        initial='notarchived',
        label='Is Archived?',
        choices=[
            ('', '- Archived? -'),
            ('archived', 'Archived'),
            ('notarchived', 'Not archived'),
        ]
    )
    is_public = forms.ChoiceField(
        required=False,
        label='Is Public?',
        choices=[
            ('', '- Public? -'),
            ('public', 'Public'),
            ('notpublic', 'Not public'),
        ])
    claimed_by = forms.ChoiceField(
        required=False,
        label='Claimed By?',
        choices=[
            ('', '- Claimed By -'),
            ('me', 'Me'),
            ('nobody', 'Nobody'),
        ])
    order_by = forms.ChoiceField(
        required=False,
        choices=[
            ('species', 'Species'),
            ('category', 'Category'),
            ('-created_on', 'Newest'),
        ],
        widget=forms.widgets.RadioSelect
    )

    def get_search_fields(self):
        return (
            'county__name',
            'reported_category__name',
            'reported_species__name',
            'reported_species__scientific_name',
            'actual_species__category__name',
            'actual_species__name',
            'actual_species__scientific_name',
            'report_id'
        )

    def __init__(self, *args, user, report_ids=(), **kwargs):
        super().__init__(*args, **kwargs)

        # Only certain fields on this form can be used by members of the public
        if not user.is_active:
            for name in list(self.fields):
                if name not in self.public_fields:
                    self.fields.pop(name)

        if user.is_anonymous:
            if report_ids:
                source_field = cast(forms.ChoiceField, self.fields['source'])
                source_choices: Any = source_field.choices
                source_field.choices = [
                    (value, label)
                    for (value, label) in source_choices if value != 'invited']
            else:
                self.fields.pop('source')

        self.user = user
        self.report_ids = report_ids

    def search(self, queryset):
        reports = super().search(queryset)

        # Ensure anonymous/public users cannot see non-public reports in all cases
        if not self.user.is_active:
            if self.report_ids:
                reports = reports.filter(
                    Q(pk__in=self.report_ids) | Q(is_public=True)
                )
            else:
                reports = reports.filter(is_public=True)

        if self.cleaned_data.get('counties'):
            reports = reports.filter(
                county__in=self.cleaned_data.get('counties')
            )
        if self.cleaned_data.get('categories'):
            reports = reports.filter(
                Q(reported_category__in=self.cleaned_data.get('categories')) |  \
                Q(actual_species__category__in=self.cleaned_data.get('categories'))
            )

        is_archived = self.cleaned_data.get('is_archived')
        if is_archived == 'archived':
            reports = reports.filter(is_archived=True)
        elif is_archived == 'notarchived':
            reports = reports.exclude(is_archived=True)

        is_public = self.cleaned_data.get('is_public')
        if is_public == 'public':
            reports = reports.filter(is_public=True)
        elif is_public == 'notpublic':
            reports = reports.exclude(is_public=True)

        claimed_by = self.cleaned_data.get('claimed_by')
        if claimed_by == 'me':
            reports = reports.filter(claimed_by=self.user)
        elif claimed_by == 'nobody':
            reports = reports.filter(claimed_by__isnull=True)

        source = self.cleaned_data.get('source')
        if source == 'invited':
            user_invites = Invite.objects.filter(user=self.user)
            reports = reports.filter(
                pk__in=user_invites.values_list('report_id', flat=True)
            )
        elif source == 'reported':
            if self.user.is_active:
                reports = reports.filter(created_by=self.user)
            if self.report_ids:
                reports = reports.filter(pk__in=self.report_ids)

        order_by = self.cleaned_data.get('order_by')
        if order_by:
            if order_by == 'species':
                reports = reports.order_by(
                    'actual_species__name',
                    'reported_species__name'
                )
            elif order_by == '-species':
                reports = reports.order_by(
                    '-actual_species__name',
                    '-reported_species__name'
                )
            elif order_by == 'category':
                reports = reports.order_by(
                    'actual_species__category__name',
                    'reported_category__name'
                )
            elif order_by == '-category':
                reports = reports.order_by(
                    '-actual_species__category__name',
                    '-reported_category__name'
                )
            else:
                reports = reports.order_by(order_by)
        elif not self.cleaned_data.get('q'):
            reports = reports.order_by('-created_on')

        return reports


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

    def _get_report_description(self):
        """Build the final report description from wizard fields.

        Returns:
            str: Combined description text.
        """
        find_description = self.cleaned_data.get('find_description', '')
        identification_process = self.cleaned_data.get('identification_process')
        if identification_process and find_description:
            return (
                f"{find_description}\n\n"
                f"Identification process: {identification_process}"
            )
        if identification_process:
            return f"Identification process: {identification_process}"
        return find_description

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
            description=self._get_report_description(),
            location=self.cleaned_data.get('location_description'),
            point=point,
            has_specimen=False,
            created_by=user,
        )
        report.county = get_county(point)
        report.save()

        # Save uploaded images attached to this report.
        for i, image_file in enumerate(images or []):
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


class InviteForm(forms.Form):
    """
    Form to invite people to comment on a report
    """
    SUBMIT_FLAG = "INVITE"

    emails = forms.CharField(label="Email addresses (comma separated)")
    body = forms.CharField(widget=forms.Textarea, required=False)

    def clean_emails(self):
        emails = set([email.strip() for email in self.cleaned_data['emails'].split(",") if email.strip()])
        for email in emails:
            try:
                validate_email(email)
            except forms.ValidationError:
                raise forms.ValidationError('"%(email)s" is an invalid email', params={"email": email})

        return emails

    def save(self, inviter, report):
        """
        Send an invitation to the specified ``email`` address.

        If an invite has already been sent to the ``email`` address for
        the specified ``report``, nothing will be done. Otherwise, an
        ``Invite`` record is created and an email is sent.

        Returns:
            bool: True if the invite was sent; False if an invite has
                already been sent to the email address for the specified
                report.
        """
        invited = []
        already_invited = []

        for email in self.cleaned_data['emails']:
            user, _ = User.objects.get_or_create(email__iexact=email,
                                                 defaults={'email': email.lower(),
                                                           'is_active': False})
            (invite, created) = Invite.objects.get_or_create(user=user,
                                                             report=report,
                                                             defaults={'created_by': inviter})
            if created:
                transaction.on_commit(lambda: notify_invited_reviewer.delay(invite.pk, self.cleaned_data.get('body')))
                invited.append(email)
            else:
                already_invited.append(email)

        # make the invite into a comment
        Comment.objects.create(report=report,
                               visibility=Comment.PRIVATE,
                               body=self.cleaned_data.get("body"),
                               created_by=inviter)

        return namedtuple("InviteReport", "invited already_invited")(invited, already_invited)


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

