from oregoninvasiveshotline.utils.test.user import UserMixin


class DetailViewUserSetupMixin(UserMixin):
    """Create users shared by report detail view tests."""

    def setUp(self) -> None:
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
        )
        self.admin = self.create_user(
            username="admin@example.com",
            password="admin",
            is_active=True,
            is_staff=True,
        )
        self.inactive_user = self.create_user(
            username="inactive@example.com",
            is_active=False,
        )
