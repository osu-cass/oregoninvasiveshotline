from collections import namedtuple

from django import forms
from django.core.validators import validate_email
from django.db import transaction

from oregoninvasiveshotline.comments.models import Comment
from oregoninvasiveshotline.reports.models import Invite
from oregoninvasiveshotline.reports.tasks import notify_invited_reviewer
from oregoninvasiveshotline.users.models import User


class InviteForm(forms.Form):
    """
    Form to invite people to comment on a report
    """
    SUBMIT_FLAG = "INVITE"

    emails = forms.CharField(label="Email addresses (comma separated)")
    body = forms.CharField(widget=forms.Textarea, required=False)

    def clean_emails(self):
        emails = set([email.strip() for email in self.cleaned_data['emails'].split(",") if email.strip()])
        for email in emails:
            try:
                validate_email(email)
            except forms.ValidationError:
                raise forms.ValidationError('"%(email)s" is an invalid email', params={"email": email})

        return emails

    def save(self, inviter, report):
        """
        Send an invitation to the specified ``email`` address.

        If an invite has already been sent to the ``email`` address for
        the specified ``report``, nothing will be done. Otherwise, an
        ``Invite`` record is created and an email is sent.

        Returns:
            bool: True if the invite was sent; False if an invite has
                already been sent to the email address for the specified
                report.
        """
        invited = []
        already_invited = []

        for email in self.cleaned_data['emails']:
            user, _ = User.objects.get_or_create(email__iexact=email,
                                                 defaults={'email': email.lower(),
                                                           'is_active': False})
            (invite, created) = Invite.objects.get_or_create(user=user,
                                                             report=report,
                                                             defaults={'created_by': inviter})
            if created:
                transaction.on_commit(lambda: notify_invited_reviewer.delay(invite.pk, self.cleaned_data.get('body')))
                invited.append(email)
            else:
                already_invited.append(email)

        # make the invite into a comment
        Comment.objects.create(report=report,
                               visibility=Comment.PRIVATE,
                               body=self.cleaned_data.get("body"),
                               created_by=inviter)

        return namedtuple("InviteReport", "invited already_invited")(invited, already_invited)
