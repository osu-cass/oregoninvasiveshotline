from ..perms import permissions
from .models import Invite, Report


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
