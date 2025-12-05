import functools

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render

from oregoninvasiveshotline.images.forms import BaseImageFormSet, ImageFormSet
from oregoninvasiveshotline.images.models import Image

from .forms import CommentForm
from .models import Comment
from .perms import can_edit_comment


def edit(request, comment_id):
    comment = get_object_or_404(Comment, pk=comment_id)
    report = comment.report
    if report.pk in request.session.get("report_ids", []) and not report.created_by.is_active:
        request.user = report.created_by

    if request.user.is_anonymous:
        return login_required(lambda request: HttpResponse())(request)

    if not can_edit_comment(request.user, comment):
        raise PermissionDenied()

    PartialCommentForm = functools.partial(CommentForm, user=request.user, report=comment.report, instance=comment)
    if request.POST:
        form = PartialCommentForm(request.POST)
        # ImageFormSet effectively extends BaseImageFormSet but is Any, so we coerce it to the type we want and ignore the type error
        formset: BaseImageFormSet = ImageFormSet(request.POST, request.FILES, queryset=Image.objects.filter(comment=comment), form_kwargs={'user': request.user})  # pyright: ignore[reportAssignmentType]
        if form.is_valid() and formset.is_valid():
            form.save()
            formset.save_all(user=comment.created_by, fk=comment)
            messages.success(request, "Comment Edited")
            return redirect("reports-detail", comment.report.pk)
    else:
        form = PartialCommentForm()
        # see above comment for ignore reasoning
        formset: BaseImageFormSet = ImageFormSet(queryset=Image.objects.filter(comment=comment), form_kwargs={'user': request.user})  # pyright: ignore[reportAssignmentType]

    return render(request, "comments/edit.html", {
        "comment": comment,
        "form": form,
        "formset": formset,
    })


def delete(request, comment_id):
    comment = get_object_or_404(Comment, pk=comment_id)
    report = comment.report
    if request.method == "POST":
        if can_edit_comment(request.user, comment):
            comment.delete()
            messages.success(request, "Comment Deleted")
        else:
            messages.warning(request, "Comment Is Not Yours To Edit")
        return redirect("reports-detail", report.pk)
    return render(request, "delete.html", {
        "object": comment,
    })
