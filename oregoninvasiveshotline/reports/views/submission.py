from typing import Any, Dict

from django import forms
from django.conf import settings
from django.contrib import messages
from django.http import HttpRequest
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods
from inertia import render as inertia_render

from oregoninvasiveshotline.images.forms import BaseImageFormSet, ImageFormSet
from oregoninvasiveshotline.images.models import Image
from oregoninvasiveshotline.reports.forms import NewReportForm, ReportForm
from oregoninvasiveshotline.species.models import Category, category_id_to_species_id_json
from oregoninvasiveshotline.users.models import User
from oregoninvasiveshotline.utils.inertia import collect_indexed, get_post_data, inertia_location, is_precognition, parse_precognition_fields


def create(request: HttpRequest):
    """
    Render the public form for submitting reports
    """

    if request.POST:
        form = ReportForm(request.POST, request.FILES)
        # ImageFormSet inherits type incorrectly so we need to cast it to the correct type
        formset: BaseImageFormSet = ImageFormSet(request.POST, request.FILES, queryset=Image.objects.none())  # pyright: ignore[reportAssignmentType]
        if form.is_valid() and formset.is_valid():
            report = form.save()
            formset.save_all(user=report.created_by, fk=report)
            messages.success(request, "Report submitted successfully")
            request.session.setdefault("report_ids", []).append(report.pk)
            request.session.modified = True
            response = redirect("reports-detail", report.pk)
            # the template sets some cookies in JS that we want to clear when
            # the report is submitted. This means the next time they go to this
            # page, the map will be initialized with the defaults
            response.delete_cookie("center", request.get_full_path())
            response.delete_cookie("zoom", request.get_full_path())
            return response
    else:
        # ImageFormSet inherits type incorrectly so we need to cast it to the correct type
        formset: BaseImageFormSet = ImageFormSet(queryset=Image.objects.none())  # pyright: ignore[reportAssignmentType]
        form = ReportForm()

    return render(request, "reports/create.html", {
        "form": form,
        "category_id_to_species_id": category_id_to_species_id_json(),
        "formset": formset
    })


@require_http_methods(["GET", "POST"])
def create_new(request: HttpRequest):
    """
    Render the new experience for the public form for submitting reports.

    Args:
        request: Incoming HTTP request.

    Returns:
        HttpResponse: Inertia page response, validation response, or redirect response.
    """
    props: Dict[str, Any] = {}

    if request.method == "POST":
        data = get_post_data(request)
        form = NewReportForm(data, request.FILES)

        if is_precognition(request):
            return parse_precognition_fields(request, form)

        if form.is_valid():
            images = collect_indexed(request.FILES, "images")
            captions = collect_indexed(request.POST, "image_captions")
            try:
                report = form.save(images=images, captions=captions)
            except forms.ValidationError as e:
                form.add_error("images", e)
            else:
                messages.success(request, "Report submitted successfully")
                request.session.setdefault("report_ids", []).append(report.pk)
                request.session.modified = True
                return inertia_location(f"/reports/detail/{report.pk}")

        props["errors"] = form.errors

    categories = Category.objects.prefetch_related("species").all()

    props["categories"] = [
        {
            "category_id": category.category_id,
            "name": category.name,
            "species": [
                {
                    "species_id": species.species_id,
                    "name": species.name,
                    "scientific_name": species.scientific_name,
                    "identification_image": species.identification_image.url if species.identification_image else None,
                    "identification_image_alt": species.identification_image_alt,
                    "identification_external_resource_link": species.identification_external_resource_link
                } for species in category.species.all()
            ]
        }
     for category in categories
    ]

    props["google_api_key"] = settings.GOOGLE_API_KEY
    props["google_map_id"] = settings.GOOGLE_MAP_ID

    user = request.user

    props["user"] = {
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
    } if isinstance(user, User) else None

    return inertia_render(request, "reportWizard", props)
