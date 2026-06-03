from django.conf import settings
from django.core.paginator import EmptyPage, PageNotAnInteger, Paginator
from django.shortcuts import render
from django.urls import reverse

from oregoninvasiveshotline.reports.forms import ReportSearchForm
from oregoninvasiveshotline.reports.models import Report
from oregoninvasiveshotline.reports.serializers import ReportSerializer
from oregoninvasiveshotline.reports.views.exports import _export
from oregoninvasiveshotline.users.utils import get_tab_counts


def list_(request):
    params = request.GET
    user = request.user
    report_ids = request.session.get('report_ids', [])

    form = ReportSearchForm(params, user=user, report_ids=report_ids)
    reports = Report.objects.all()
    if form.is_valid():
        reports = form.search(reports)

    # Handle the case where they want to export the reports
    # XXX: Why isn't this a separate view?
    export_format = params.get('export')
    if user.is_active and export_format in ('kml', 'csv'):
        reports = reports.select_related(
            'reported_category',
            'reported_species',
            'reported_species__severity',
            'actual_species',
            'actual_species__category',
            'actual_species__severity',
            'created_by',
            'claimed_by',
        )
        return _export(reports=reports, format=export_format)

    # Paginate the results
    paginator = Paginator(reports, settings.ITEMS_PER_PAGE)
    active_page = request.GET.get('page')

    try:
        page = paginator.page(active_page)
    except PageNotAnInteger:
        page = paginator.page(1)
    except EmptyPage:
        page = paginator.page(paginator.num_pages)

    # Serialize and render report data to JSON
    serializer = ReportSerializer(page.object_list, many=True)
    reports = serializer.data

    template_name = 'list' if user.is_active else 'list_public'
    template = 'reports/{name}.html'.format(name=template_name)

    tab = params.get('tabs') or 'search'
    tab_context = get_tab_counts(user, report_ids)

    subscription_url = reverse('notifications-create')
    subscription_params = request.GET.urlencode()
    if subscription_params:
        subscription_url = '?'.join((subscription_url, subscription_params))
    else:
        subscription_url = None

    context = {
        'reports': reports,
        'page': page,
        'form': form,
        'subscription_url': subscription_url,
        'tab': tab,
    }
    context.update(tab_context)

    return render(request, template, context)
