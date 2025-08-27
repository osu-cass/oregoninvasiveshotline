import functools

from django import forms
from django.forms.models import modelformset_factory

from oregoninvasiveshotline.utils.forms import BaseModelFormSet
from oregoninvasiveshotline.reports.perms import can_adjust_visibility

from .fields import ClearableImageInput
from .models import Image


class ImageForm(forms.ModelForm):
    class Meta:
        model = Image
        fields = [
            'image',
            'name',
            'visibility',
        ]

        widgets = {
            'image': ClearableImageInput,
            'name': forms.TextInput(attrs={"placeholder": "Caption"})
        }

    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['image'].label = "Your Image: "
        self.fields['name'].label = ""
        self.fields['visibility'].label = ""

        if user is None or not can_adjust_visibility(user, self.instance.report):
            self.fields.pop('visibility')
            self.instance.visibility = Image.PUBLIC


class BaseImageFormSet(BaseModelFormSet):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def save_new(self, form, commit=True):
        """Saves and returns an existing model instance for the given form."""
        form.instance.created_by = self.user
        setattr(form.instance, self.fk.__class__.__name__.lower(), self.fk)
        super().save_new(form, commit)

    def save(self, user, fk, commit=True):
        self.user = user
        self.fk = fk
        super().save(commit)


# NOTE: The get_image_formset function was refactored to a direct
#       modelformset_factory call to fix issues with passing the `extra`
#       argument to the formset constructor. The original comment is preserved below.
#
#       """
#       This is annoying, but because ImageForm takes arguments in the __init__
#       method, we have to alter the formset's form on the fly
#
#       http://stackoverflow.com/a/813647/2733517
#       """
ImageFormSet = modelformset_factory(
    Image,
    form=ImageForm,
    formset=BaseImageFormSet,
    can_delete=True,
    extra=0,
)
