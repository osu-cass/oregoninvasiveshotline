import urllib.parse
import logging

from django.shortcuts import redirect
from django.utils.http import url_has_allowed_host_and_scheme
from django.contrib.sites.models import Site

logger = logging.getLogger(__name__)


def safe_redirect(request, proposed_redirect, fallback=""):
    if url_has_allowed_host_and_scheme(
        url=proposed_redirect,
        allowed_hosts=request.get_host(),
        require_https=request.is_secure(), 
    ):
        return redirect(proposed_redirect)
    elif proposed_redirect is not None and proposed_redirect.strip():
        msg = "Redirect to unsafe URL attempted '{}'"
        logger.warning(msg.format(proposed_redirect))

    if fallback:
        return redirect(fallback)
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
