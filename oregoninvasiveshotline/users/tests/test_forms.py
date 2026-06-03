from unittest.mock import patch

from django.test import TestCase

from model_bakery.baker import prepare

from oregoninvasiveshotline.utils.test.user import UserMixin

from ..forms import UserForm, UserSearchForm
from ..models import User




class UserFormTest(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )
        self.admin = self.create_user(
            username="admin@example.com",
            password="admin",
            is_active=True,
            is_staff=True
        )

    def test_password_field_only_when_user_being_created(self):
        """
        The password field should only be on the form if the user is being
        created (not edited)
        """
        other_user = self.create_user()
        form = UserForm(user=other_user)
        self.assertIn("password", form.fields)

        form = UserForm(instance=self.user, user=other_user)
        self.assertNotIn("password", form.fields)

    def test_your_dangerous_fields_are_not_editable(self):
        """
        Fields like is_active and is_staff should not be changable if the user
        is editing himself
        """
        form = UserForm(user=self.admin, instance=self.admin)
        self.assertNotIn("is_active", form.fields)
        self.assertNotIn("is_staff", form.fields)

        # if someone is editing someone else, they can update those fields
        form = UserForm(instance=self.user, user=self.admin)
        self.assertIn("is_active", form.fields)
        self.assertIn("is_staff", form.fields)

    def test_non_staffers_cannot_set_some_fields(self):
        """
        Some fields should not be editable by non-staffers
        """
        form = UserForm(user=self.user, instance=self.user)
        self.assertNotIn("is_staff", form.fields)

    def test_save_sets_the_password_for_new_users(self):
        """
        If the user is being created, the password should be updated
        """
        # to avoid having to generate valid data for this form, we mock up the
        # superclass's save method and the form's cleaned_data
        with patch("oregoninvasiveshotline.users.forms.forms.ModelForm.save") as mock:
            user = prepare(User)
            form = UserForm(instance=user, user=self.user)
            form.cleaned_data = {"password": "foobar"}

            form.save()

            self.assertTrue(self.user.check_password("foo"))
            # ensure the superclass was called (which actually saves the model)
            self.assertTrue(mock.called)


class UserSearchFormTest(TestCase, UserMixin):
    """
    Tests for the User search form
    """
    def test_search_list_managers_only(self):
        user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )
        admin = self.create_user(
            username="admin@example.com",
            password="admin",
            is_active=True,
            is_staff=True
        )
        other_user = self.create_user(
            username="other@example.com",
            is_active=False
        )

        form = UserSearchForm({"q": "", "is_manager": True})
        users = form.search(User.objects.all())

        self.assertNotIn(other_user, users)
        self.assertIn(admin, users)
        self.assertIn(user, users)
        self.assertEqual(len(users), 2)
