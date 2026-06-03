from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render

from oregoninvasiveshotline.reports.models import Report
from oregoninvasiveshotline.reports.perms import permissions
from oregoninvasiveshotline.utils.db import will_be_deleted_with


@permissions.can_claim_report
def claim(request, report_id):
    report = get_object_or_404(Report, pk=report_id)
    if request.method == "POST" and (report.claimed_by is None or "steal" in request.POST):
        report.claimed_by = request.user
        report.save()
        return redirect("reports-detail", report.pk)

    return render(request, "reports/claim.html", {
        "report": report,
    })


@permissions.can_unclaim_report
def unclaim(request, report_id):
    report = get_object_or_404(Report, pk=report_id)
    if request.method == "POST":
        report.claimed_by = None
        report.save()
        return redirect("reports-detail", report.pk)

    return render(request, "reports/unclaim.html", {
        "report": report,
    })


@permissions.can_delete_report
def delete(request, report_id):
    report = get_object_or_404(Report, pk=report_id)
    if request.method == "POST":
        report.delete()
        messages.success(request, "Report deleted!")
        return redirect("reports-list")

    related_objects = list(will_be_deleted_with(report))

    return render(request, "delete.html", {
        "object": report,
        "will_be_deleted_with": related_objects,
    })
