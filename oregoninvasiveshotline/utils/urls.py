import urllib.parse
import logging
from urllib.parse import urlsplit

from django.shortcuts import redirect
from django.urls import reverse
from django.contrib.sites.models import Site

logger = logging.getLogger(__name__)


def safe_redirect(request, proposed_redirect, fallback_url_name=""):
    if proposed_redirect and proposed_redirect.strip():
        parts = urlsplit(proposed_redirect)
        if parts.scheme == "" and parts.netloc == "" and proposed_redirect.startswith("/"):
            return redirect(proposed_redirect)
        msg = "Redirect to unsafe URL attempted '{}'"
        logger.warning(msg.format(proposed_redirect))

    if fallback_url_name:
        return redirect(reverse(fallback_url_name))
    return redirect('/')


def build_absolute_url(path, query_string=None):
    domain = Site.objects.get_current().domain
    return urllib.parse.urlunparse((
        # scheme
        'https',
        # netloc
        domain,
        # path
        path,
        # params
        '',
        # query
        query_string,
        # fragment
        ''
    ))
