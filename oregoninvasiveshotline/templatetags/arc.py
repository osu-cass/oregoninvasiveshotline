import json

from django import template
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.safestring import mark_safe

try:
    import markdown as _markdown
except ImportError:
    _markdown = None



register = template.Library()


@register.simple_tag
def google_analytics(tracking_id=None, cookie_domain=None, tracker_name=None, fields=None):
    """Generate a configured Google Analytics <script> tag.

    The args to this tag correspond to the args to GA's ``create``
    command.

    When ``DEBUG`` mode is enabled, an HTML comment placeholder will be
    returned instead of the GA <script> tag.

    If a ``tracking_id`` is passed when calling the tag, that ID will be
    used. Otherwise, if the ``GOOGLE.analytics.tracking_id`` is present
    and contains a value, that ID will be used.

    If a tracking ID isn't passed or found in the settings, then a
    placeholder HTML comment will be returned instead of the GA <script>
    tag.

    The remaining args are optional. They can be passed directly or
    added to the 'GOOGLE.analytics.*' settings namespace. The defaults
    are (expressed as JavaScript values):

        - cookie_domain: 'auto'
        - tracker_name: undefined
        - fields: undefined

    ``cookie_domain`` and ``tracker_name`` should be strings. ``fields``
    should be a dict with simple values that can be converted to JSON (I
    don't think we'll have much need for ``fields``; see the GA docs for
    what it can contain).

    """
    tracking_id = tracking_id or settings.GOOGLE_ANALYTICS_TRACKING_ID
    if tracking_id and not settings.DEBUG:
        cookie_domain = cookie_domain or 'auto'
        tracker_name = tracker_name or None
        fields = fields or None
        value = """
            <script>
                (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
                })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

                ga(
                    'create',
                    '%(tracking_id)s',    // Tracking ID
                    '%(cookie_domain)s',  // Cookie domain
                    %(tracker_name)s,     // Tracker name
                    %(fields)s            // Fields
                );

                ga('send', 'pageview');
            </script>
        """ % {
            'tracking_id': tracking_id,
            'cookie_domain': cookie_domain,
            'tracker_name': "'%s'" % tracker_name if tracker_name else 'undefined',
            'fields': json.dumps(fields) if fields else 'undefined',
        }
    else:
        value = '<!-- Google Analytics code goes here -->'
    return mark_safe(value)


@register.filter
def jsonify(obj):
    return mark_safe(json.dumps(obj))


@register.filter
def markdown(content):
    if _markdown is None:
        raise ImproperlyConfigured(
            'Markdown must be installed to use the markdown template filter')
    return mark_safe(_markdown.markdown(content))


@register.simple_tag(takes_context=True)
def add_get(context, **params):
    request = context['request']
    request_params = request.GET.copy()
    for name, value in params.items():
        request_params[name] = value
    return '?{query_string}'.format(query_string=request_params.urlencode())


@register.filter
def model_name(model):
    return model._meta.verbose_name.title()
