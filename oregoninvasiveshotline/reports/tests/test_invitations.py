from django.test import TestCase

from model_bakery.baker import make

from oregoninvasiveshotline.utils.test.user import UserMixin

from ..forms import InviteForm
from ..models import Report
from .shared import ORIGIN


class InviteFormTest(TestCase, UserMixin):

    def test_clean_emails(self):
        # test a few valid emails
        form = InviteForm({
            "emails": "foo@pdx.edu,bar@pdx.edu  ,  fog@pdx.edu,foo@pdx.edu"
        })
        self.assertTrue(form.is_valid())
        self.assertEqual(sorted(form.cleaned_data['emails']), sorted(["foo@pdx.edu", "bar@pdx.edu", "fog@pdx.edu"]))

        # test blank
        form = InviteForm({
            "emails": ""
        })
        self.assertFalse(form.is_valid())
        self.assertTrue(form.has_error("emails"))

        # test invalid email
        form = InviteForm({
            "emails": "invalid@@pdx.ads"
        })
        self.assertFalse(form.is_valid())
        self.assertTrue(form.has_error("emails"))

        # test valid and invalid
        form = InviteForm({
            "emails": "valid@pdx.edu, invalid@@pdx.ads"
        })
        self.assertFalse(form.is_valid())
        self.assertTrue(form.has_error("emails"))
        self.assertIn("invalid@@", str(form.errors))

    def test_save(self):
        inviter = self.create_user()
        report = make(Report, point=ORIGIN)

        form = InviteForm({
            'emails': 'foo@pdx.edu',
            'body': 'body',
        })
        self.assertTrue(form.is_valid())
        invite_report = form.save(inviter, report)
        self.assertEqual(invite_report.invited, ['foo@pdx.edu'])
        self.assertEqual(invite_report.already_invited, [])

        form = InviteForm({
            'emails': 'foo@pdx.edu, bar@pdx.edu',
            'body': 'body',
        })
        self.assertTrue(form.is_valid())
        invite_report = form.save(inviter, report)
        self.assertEqual(invite_report.invited, ['bar@pdx.edu'])
        self.assertEqual(invite_report.already_invited, ['foo@pdx.edu'])