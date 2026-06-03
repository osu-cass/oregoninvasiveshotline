from collections import OrderedDict
import itertools
import posixpath

from django.conf import settings
from django.shortcuts import render

from oregoninvasiveshotline.reports.utils import icon_file_name
from oregoninvasiveshotline.species.models import Category, Severity


def help(request):
    categories = OrderedDict()
    base_icon_url = posixpath.join(settings.MEDIA_URL, settings.ICON_DIR)
    pairs = itertools.product(Category.objects.all(), Severity.objects.all())
    for category, severity in pairs:
        file_name = icon_file_name(category.icon, severity.color)
        icon_url = posixpath.join(base_icon_url, file_name)
        categories.setdefault(category, []).append({
            'icon_url': icon_url,
            'severity': severity.name
        })
    return render(request, 'reports/help.html', {
        'categories': categories,
    })
