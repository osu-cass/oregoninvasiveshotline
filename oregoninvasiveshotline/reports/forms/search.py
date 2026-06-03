from typing import Any, cast

from django import forms
from django.db.models import Q

from oregoninvasiveshotline.reports.forms.choices import get_category_choices, get_county_choices
from oregoninvasiveshotline.reports.models import Invite
from oregoninvasiveshotline.utils.search import SearchForm


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
