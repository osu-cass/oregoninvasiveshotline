import functools

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render

from oregoninvasiveshotline.comments.forms import CommentForm
from oregoninvasiveshotline.comments.models import Comment
from oregoninvasiveshotline.comments.perms import can_create_comment
from oregoninvasiveshotline.images.forms import BaseImageFormSet, ImageFormSet
from oregoninvasiveshotline.images.models import Image
from oregoninvasiveshotline.reports.forms import InviteForm, ManagementForm
from oregoninvasiveshotline.reports.models import Invite, Report
from oregoninvasiveshotline.reports.perms import can_claim_report, can_manage_report, can_view_private_report
from oregoninvasiveshotline.species.models import category_id_to_species_id_json
from oregoninvasiveshotline.utils.urls import safe_redirect


def detail(request, report_id):
    """
    This is a complex view that handles displaying all the information about a
    Report. It needs to take into account the user's role on the Report to
    determine whether to display the comment form, and which comments to
    display, etc. It also handles the management of the report by the expert
    who claimed it
    """
    report = get_object_or_404(Report, pk=report_id)

    if (report.pk in request.session.get("report_ids", []) and
            report.created_by.is_active and
            report.created_by.pk != request.user.pk and
            not request.user.is_active):
        # if the report was created by an active user and they aren't logged in
        return login_required(lambda request: HttpResponse())(request)

    if (report.pk in request.session.get("report_ids", []) and
            not report.created_by.is_active and
            report.created_by.pk != request.user.pk and
            not request.user.is_active):
        # if the user submitted the report, allow them to masquerade as that
        # user for the life of this request
        request.user = report.created_by

    if not report.is_public:
        if request.user.is_anonymous:
            messages.info(request, "If this is your report, please use the login system below to authenticate yourself.")
            return login_required(lambda request: HttpResponse())(request)
        elif not can_view_private_report(request.user, report):
            raise PermissionDenied()

    # there are a bunch of forms that can be filled out on this page, by
    # default, they can't be filled out
    comment_form = None
    image_formset: BaseImageFormSet | None = None
    invite_form = None
    management_form = None
    # this tells us which form was filled out since there are many on the page
    submit_flag = request.POST.get("submit_flag")

    # process the comment form only if they are allowed to leave comments
    if can_create_comment(request.user, report):
        PartialCommentForm = functools.partial(CommentForm, user=request.user, report=report)

        if request.POST and submit_flag == CommentForm.SUBMIT_FLAG:
        # ImageFormSet inherits type incorrectly so we need to cast it to the correct type
            image_formset = ImageFormSet(request.POST, request.FILES, queryset=Image.objects.none(), form_kwargs={'user': request.user})  # pyright: ignore[reportAssignmentType]
            comment_form = PartialCommentForm(request.POST, request.FILES)
            assert comment_form is not None
            assert image_formset is not None
            if comment_form.is_valid() and image_formset.is_valid():
                comment = comment_form.save()
                image_formset.save_all(user=comment.created_by, fk=comment)
                messages.success(request, "Comment Added!")
                if can_claim_report(request.user, report):
                    if report.claimed_by is None:
                        report.claimed_by = request.user
                        report.save()
                        messages.success(request, "Report claimed!")
                return safe_redirect(request, request.get_full_path())

        else:
            comment_form = PartialCommentForm()
            # ImageFormSet inherits type incorrectly so we need to cast it to the correct type
            image_formset = ImageFormSet(queryset=Image.objects.none(), form_kwargs={'user': request.user})  # pyright: ignore[reportAssignmentType]

    # handle all the management forms
    if can_manage_report(request.user, report):
        # Confirming the report form...
        if request.POST and submit_flag == ManagementForm.SUBMIT_FLAG:
            management_form = ManagementForm(request.POST, instance=report)
            if management_form.is_valid():
                management_form.save()
                messages.success(request, "Updated!")
                return safe_redirect(request, request.get_full_path())
        else:
            management_form = ManagementForm(instance=report)

        # Inviting experts...
        if request.POST and submit_flag == InviteForm.SUBMIT_FLAG:
            invite_form = InviteForm(request.POST)
            if invite_form.is_valid():
                invite_report = invite_form.save(request.user, report)
                message = "%d invited" % (len(invite_report.invited))
                if invite_report.already_invited:
                    message += " (%d already invited)" % len(invite_report.already_invited)
                messages.success(request, message)
                return safe_redirect(request, request.get_full_path())
        else:
            invite_form = InviteForm()

    # filter down the comments based on the user's permissions
    comments = Comment.objects.filter(report=report)
    images = Image.objects.filter(Q(report=report) | Q(comment__report=report))
    if request.user.is_anonymous:
        comments = comments.filter(visibility=Comment.PUBLIC)
        images = images.filter(visibility=Image.PUBLIC)
    elif request.user.is_active or Invite.objects.filter(user=request.user, report=report).exists():
        # no need to filter for these folks
        pass
    else:
        # the logged in user is the person who reported
        comments = comments.filter(Q(visibility=Comment.PUBLIC) | Q(visibility=Comment.PROTECTED))
        images = images.filter(Q(visibility=Image.PUBLIC) | Q(visibility=Image.PROTECTED))

    invites = list(i.user.email for i in Invite.objects.filter(report=report).select_related("user"))

    return render(request, "reports/detail.html", {
        "report": report,
        "comments": comments,
        "images": list(images),
        "category_id_to_species_id": category_id_to_species_id_json(),
        "invites": invites,
        # all the forms
        "image_formset": image_formset,
        "comment_form": comment_form,
        "invite_form": invite_form,
        "management_form": management_form,
    })
