from django.contrib.auth.models import AnonymousUser
from django.db.models import Q, QuerySet
from django.http import HttpRequest

from ..comments.models import Comment
from ..images.models import Image
from ..perms import permissions
from ..users.models import User
from ..visibility import Visibility
from .models import Invite, Report

# A logged-in user, an anonymous visitor, or a report creator a session acts as.
Viewer = User | AnonymousUser


@permissions.register(model=Report)
def can_delete_report(user, report):
    return user.is_active


@permissions.register(model=Report)
def can_edit_report(user, report):
    return user.is_active and user.is_staff


@permissions.register(model=Report)
def can_view_private_report(user, report):
    if user.is_anonymous:
        return False

    if report.created_by == user:
        return True

    if user.is_active:
        return True

    if Invite.objects.filter(report=report, user_id=user.pk).exists():
        return True


@permissions.register(model=Report)
def can_view_report_submitter_pii(user, report: Report) -> bool:
    return user.is_authenticated and (user.is_active or user.is_staff)


# Ignored the assignment of the decorator as it applies properly at runtime.
@permissions.register(model=Report)  # pyright: ignore
def can_adjust_visibility(user, report):
    return user.is_active or Invite.objects.filter(user=user, report=report).exists()


@permissions.register(model=Report)  # pyright: ignore
def can_claim_report(user, report):
    return user.is_active


@permissions.register(model=Report)  # pyright: ignore
def can_unclaim_report(user, report):
    return report.claimed_by_id == user.pk


@permissions.register(model=Report)  # pyright: ignore
def can_manage_report(user, report):
    return user.is_authenticated and (user.is_staff or report.claimed_by_id == user.pk)


def report_session_user(request: HttpRequest, report: Report) -> Viewer | None:
    """Return the user a request acts as when viewing ``report``, or None if they must log in.

    A visitor who submitted ``report`` in this session acts as its creator while the creator
    account is inactive. If the creator account is active, the visitor has to log in instead.
    """
    user = request.user
    if report.pk not in request.session.get("report_ids", []) or user.is_active:
        return user
    if report.created_by.pk == user.pk:
        return user
    if report.created_by.is_active:
        return None
    return report.created_by


def can_view_report(user: Viewer, report: Report) -> bool:
    """Return whether ``user`` can open ``report`` at all."""
    return report.is_public or bool(can_view_private_report(user, report))


def _visible_levels(user: Viewer, report: Report) -> list[int]:
    """Return the visibility levels of report content that ``user`` can see."""
    if user.is_anonymous:
        return [Visibility.PUBLIC]
    if can_adjust_visibility(user, report):
        return [Visibility.PUBLIC, Visibility.PROTECTED, Visibility.PRIVATE]
    # The remaining case is the reporter.
    return [Visibility.PUBLIC, Visibility.PROTECTED]


def can_view_report_image(user: Viewer, report: Report, image: Image) -> bool:
    """Return whether ``user`` can see ``image``, which belongs to ``report`` or its comments."""
    return can_view_report(user, report) and image.visibility in _visible_levels(user, report)


def visible_report_comments(user: Viewer, report: Report) -> QuerySet[Comment]:
    """Return the comments on ``report`` that ``user`` can see."""
    return Comment.objects.filter(report=report, visibility__in=_visible_levels(user, report))


def visible_report_images(user: Viewer, report: Report) -> QuerySet[Image]:
    """Return the images on ``report`` and its comments that ``user`` can see."""
    images = Image.objects.filter(Q(report=report) | Q(comment__report=report))
    return images.filter(visibility__in=_visible_levels(user, report))
