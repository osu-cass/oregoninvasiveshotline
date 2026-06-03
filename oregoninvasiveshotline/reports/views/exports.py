from collections import OrderedDict
import csv

from django.http import HttpResponse
from django.template.loader import render_to_string


def _export(reports, format):
    """
    Returns an HttpResponse containing all the reports in the specified format
    """
    if format == "csv":
        response = HttpResponse("", content_type="text/csv")
        # maps a field name, to a function that gets the data for the field,
        # given a Report object
        fields = OrderedDict([
            ("Report ID", lambda report: report.pk),
            ("Category", lambda report: str(report.category)),
            ("Common Name", lambda report: report.species.name if report.species else ""),
            ("Scientific Name", lambda report: report.species.scientific_name if report.species else ""),
            ("Species Confirmed", lambda report: bool(report.actual_species)),
            ("Reported By", lambda report: str(report.created_by)),
            ("Reported On", lambda report: str(report.created_on)),
            ("Claimed By", lambda report: str(report.claimed_by)),
            ("Description", lambda report: report.description),
            ("Latitude", lambda report: report.point.y),
            ("Longitude", lambda report: report.point.x),
            ("EDRR Status", lambda report: report.edrr_status),
            ("Is Public", lambda report: report.is_public),
            ("Is Archived", lambda report: report.is_archived),
        ])
        writer = csv.DictWriter(response, fields.keys())
        writer.writeheader()
        for report in reports:
            row = {}
            for key, accessor in fields.items():
                row[key] = accessor(report)
            writer.writerow(row)
    elif format == "kml":
        response = HttpResponse(render_to_string("reports/export.kml", {
            "reports": reports
        }), content_type="text/csv")
    else:
        raise ValueError("%s in not a valid format" % format)

    response['Content-Disposition'] = 'attachment; filename="reports.%s"' % format
    return response
