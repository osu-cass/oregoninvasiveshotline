from django.contrib.gis.db import models

from oregoninvasiveshotline.reports.models.report import Report


class Invite(models.Model):
    """An invitation to review a report.

    Arbitrary people can be invited (via email) to review and leave
    comments on a report.
    """
    class Meta:
        db_table = 'invite'

    invite_id = models.AutoField(primary_key=True)
    created_by = models.ForeignKey('users.User', related_name='+', on_delete=models.CASCADE)
    created_on = models.DateTimeField(auto_now_add=True)
    report = models.ForeignKey(Report, on_delete=models.CASCADE)

    # The invitee
    user = models.ForeignKey('users.User', related_name='invites', on_delete=models.CASCADE)
