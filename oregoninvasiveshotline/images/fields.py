import os
import string
from base64 import b64decode
from binascii import Error
from tempfile import NamedTemporaryFile

from django import forms
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from django.core.signing import BadSignature, Signer
from django.forms.widgets import FILE_INPUT_CONTRADICTION, ClearableFileInput
from django.utils.safestring import mark_safe

CHOICES = string.ascii_letters + string.digits + "-_"
assert len(CHOICES) == 64


class ClearableImageInput(ClearableFileInput):
    """
    This field widget can be used on an ImageField. It writes the file to
    disk during validation, so when the form is rendered again, the user
    doesn't have to re-upload the file.

    It also has a special feature that allows an HTML data URI of an image to
    be posted using the `%(field_name)s_data_uri` hidden input field. This
    feature allows you to POST resized images on the client side without
    resorting to AJAX and the FormData API in JavaScript.

    The file is written to a directory called "tmp_dir" which is MEDIA_ROOT/tmp
    by default.

    Path traveral vulerabilities are prevented using the Django
    signing utility and os.urandom() filenames, so make sure your SECRET_KEY is
    safe.
    """
    template_with_initial = (
        '<span class="preview"><img src="%(initial_url)s" width="100" /></span> '
        '%(input)s'
    )

    signer = Signer(salt="file-resubmit")

    # where uploaded files are stored temporarily. This needs to be in
    # MEDIA_ROOT somewhere so the files can be accessed via the web
    tmp_dir = os.path.join(settings.MEDIA_ROOT, "tmp")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.signed_path = None
        self._sentinel = object()
        self._cached_value = self._sentinel
        
        self.tmp_dir = os.path.join(settings.MEDIA_ROOT, "tmp")

    def signed_path_field_name(self, name):
        """
        Returns the name of the hidden input field containing the signed_path
        """
        return "%s_signed_path" % name

    def data_uri_field_name(self, name):
        """
        Returns the name of the hidden input field containing the data_uri
        """
        return "%s_data_uri" % name

    def value_from_datadict(self, data, files, name):
        os.makedirs(self.tmp_dir, exist_ok=True)
        # we cache the return value of this function, since it is called a
        # bunch of time, and is expensive
        if self._cached_value is self._sentinel:
            upload = super().value_from_datadict(data, files, name)
            if upload != FILE_INPUT_CONTRADICTION:
                self.signed_path = data.get(self.signed_path_field_name(name), None)
                data_uri = data.get(self.data_uri_field_name(name))
                has_file = (upload or data_uri)
                # the path to the cached uploaded file
                path = None
                # if we have a cache key, and no file, fetch the file from the cache
                if self.signed_path and not has_file:
                    try:
                        path = self.signer.unsign(self.signed_path)
                    except BadSignature:
                        # False means the field value should be cleared, which
                        # is the best thing we can do in this case. It
                        # shouldn't happen anyways.
                        self.signed_path = ""
                        self._cached_value = None
                        return self._cached_value
                elif has_file:
                    # we have a file, so write it to disk, just in case form validation fails
                    with NamedTemporaryFile(prefix="".join(CHOICES[x % 64] for x in os.urandom(16)), suffix=".jpg", dir=self.tmp_dir, delete=False) as f:
                        # write the uploaded file to disk, or the data from the dataURI
                        try:
                            if upload:
                                f.write(upload.read())
                            else:
                                f.write(b64decode(data_uri[data_uri.find(",")+1:]))
                        except Error:
                            pass
                        else:
                            path = f.name
                            self.signed_path = self.signer.sign(f.name)

                if path:
                    upload = UploadedFile(open(path, "rb"), name=path, size=os.path.getsize(path))
                    # tack on a URL attribute so the parent Widget thinks it
                    # has an initial value
                    upload.url = settings.MEDIA_URL + os.path.relpath(upload.file.name, settings.MEDIA_ROOT)

            self._cached_value = upload

        return self._cached_value

    def render(self, name, value, attrs=None, renderer=None):
        if attrs is None:
            attrs = {}

        attrs['accept'] = "image/*"

        output = super().render(name, value, attrs, renderer=renderer)
        if self.signed_path:
            output += forms.HiddenInput().render(self.signed_path_field_name(name), self.signed_path, {})

        output += forms.HiddenInput().render(self.data_uri_field_name(name), "", {"class": "datauri"})
        return mark_safe(output)
