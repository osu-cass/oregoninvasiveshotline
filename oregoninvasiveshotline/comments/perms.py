from oregoninvasiveshotline.reports.models import Report
from oregoninvasiveshotline.reports.perms import can_view_private_report

from ..perms import permissions
from .models import Comment


@permissions.register(model=Report)
def can_create_comment(user, report):
    return can_view_private_report(user, report)


@permissions.register(model=Comment)
def can_edit_comment(user, comment):
    return user.is_staff or comment.created_by == user


def get_comment_editor(request, comment):
    """Resolve the effective user allowed to edit the comment"""
    if can_edit_comment(request.user, comment):
        return request.user
    report = comment.report

    # Anonymous reporters can edit their own comments
    if (
        request.user.is_anonymous
        and report.pk in request.session.get("report_ids", [])
        and not report.created_by.is_active
        and comment.created_by_id == report.created_by_id
    ):
        return report.created_by
    return None


@permissions.register(model=Comment)
def can_delete_comment(user, comment):
    return comment.pk is not None and can_edit_comment(user, comment)
