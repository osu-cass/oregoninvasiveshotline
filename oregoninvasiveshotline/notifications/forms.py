from django import forms

from oregoninvasiveshotline.users.models import User

from .models import UserNotificationQuery


class UserNotificationQueryForm(forms.ModelForm):

    class Meta:
        model = UserNotificationQuery
        fields = (
            'name',
            'user',  # Only admins can set this field
        )
        labels = {
            'user': 'Assign subscription to user (admin only)'
        }

    def __init__(self, *args, **kwargs):
        current_user = kwargs.pop('current_user', None)
        is_staff = current_user and current_user.is_staff
        super().__init__(*args, **kwargs)
        if not is_staff:
            self.fields.pop('user')


class UserSubscriptionAdminForm(forms.ModelForm):

    class Meta:
        model = UserNotificationQuery
        fields = ('user', 'name', 'query')
        labels = {
            'name': 'Subscription Name',
        }
        help_texts = {
            'name': (
                'Note: Changing the owner of a subscription will notify the user '
                'that you have assigned a subscription to them'
            ),
            'query': (
                'Altering the query string is disabled. Try creating a new '
                'subscription by clicking "Search Reports" and subscribing to '
                'a new search'
            ),
        }
        querysets = {
            'user': User.objects.filter(is_active=True),
        }
        widgets = {
            'name': forms.widgets.TextInput(attrs={
                'placeholder': (
                    'For easier review, give the subscription a name. '
                    'For example, "Mammals in Clark County"'
                ),
            }),
            'query': forms.widgets.TextInput(attrs={
                'readonly': True,
            }),
        }


class UserSubscriptionDeleteForm(forms.Form):

    subscriptions = forms.ModelMultipleChoiceField(
        required=True, widget=forms.CheckboxSelectMultiple, queryset=UserNotificationQuery.objects.none())

    def __init__(self, *args, user, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)
        initial = UserNotificationQuery.objects.filter(user=user)
        assert isinstance(self.fields['subscriptions'], forms.ModelMultipleChoiceField)
        self.fields['subscriptions'].queryset = initial

    def iter_items(self):
        subscriptions = list(self['subscriptions'])  # pyright: ignore
        assert isinstance(self.fields['subscriptions'], forms.ModelMultipleChoiceField)
        for model, choice in zip(self.fields['subscriptions'].queryset, subscriptions):
            yield model, choice

    def save(self, *args, **kwargs):
        for field in self.cleaned_data['subscriptions']:
            field.delete()
