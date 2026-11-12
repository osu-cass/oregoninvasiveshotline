import mimetypes
import os
from urllib.parse import quote

from django.conf import settings
from django.http import FileResponse, Http404, HttpRequest, HttpResponse
from django.http.response import HttpResponseBase
from django.shortcuts import get_object_or_404
from django.utils._os import safe_join

from oregoninvasiveshotline.reports.perms import can_view_report_image, report_session_user
from oregoninvasiveshotline.users.models import User

from .models import Image

# Nginx serves this internal location from MEDIA_ROOT; clients cannot request it directly.
PROTECTED_MEDIA_URL = "/protected-media/"

# Browsers must ask Django again before reusing a cached copy, so revoked access takes effect.
# Nginx still answers unchanged files with 304.
CACHE_CONTROL = "private, no-cache"


def media_response(name: str) -> HttpResponseBase:
    """Return a response that sends the media file ``name``. Callers check permissions first.

    Nginx sends the file through ``X-Accel-Redirect``. Django sends it in DEBUG, where
    there is no nginx.
    """
    if settings.DEBUG:
        path = safe_join(settings.MEDIA_ROOT, name)
        if not os.path.isfile(path):
            raise Http404()
        response: HttpResponseBase = FileResponse(open(path, "rb"))
    else:
        # An unknown type must not fall back to Django's text/html default.
        content_type = mimetypes.guess_type(name)[0] or "application/octet-stream"
        response = HttpResponse(content_type=content_type)
        response["X-Accel-Redirect"] = PROTECTED_MEDIA_URL + quote(name)
    response["Cache-Control"] = CACHE_CONTROL
    return response


def report_image_response(request: HttpRequest, image: Image, name: str) -> HttpResponseBase:
    """Send the file ``name`` for ``image`` if the requester can see the image on its report."""
    report = image.report or (image.comment.report if image.comment else None)
    if report is None:
        raise Http404()
    user = report_session_user(request, report)
    if user is None or not can_view_report_image(user, report, image):
        raise Http404()
    return media_response(name)


def serve_image(request: HttpRequest, name: str) -> HttpResponseBase:
    """Serve an uploaded image from ``MEDIA_ROOT/images``.

    User profile photos share this directory and are public.
    """
    path = f"images/{name}"
    image = Image.objects.select_related("report", "comment__report").filter(image=path).first()
    if image is not None:
        return report_image_response(request, image, path)
    if User.objects.filter(photo=path).exists():
        return media_response(path)
    raise Http404()


def serve_thumbnail(request: HttpRequest, image_id: int) -> HttpResponseBase:
    """Serve the generated thumbnail for an image."""
    image = get_object_or_404(Image.objects.select_related("report", "comment__report"), pk=image_id)
    return report_image_response(request, image, f"generated_thumbnails/{image_id}.png")
