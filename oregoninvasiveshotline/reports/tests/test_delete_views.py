from django.urls import reverse
from django.test import TestCase

from model_bakery.baker import make

from oregoninvasiveshotline.utils.test.user import UserMixin

from ..models import Report
from .shared import ORIGIN


class DeleteViewTest(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )

    def test_permissions(self):
        report = make(Report, point=ORIGIN)
        response = self.client.get(reverse("reports-delete", args=[report.pk]))
        self.assertRedirects(response, reverse("login") + "?next=" + reverse("reports-delete", args=[report.pk]))

        self.client.login(email=self.user.email, password="foo")
        self.user.is_active = False
        self.user.save()
        response = self.client.get(reverse("reports-delete", args=[report.pk]))
        self.assertEqual(response.status_code, 403)

    def test_get(self):
        self.client.login(email=self.user.email, password="foo")
        report = make(Report, point=ORIGIN)
        response = self.client.get(reverse("reports-delete", args=[report.pk]))
        self.assertEqual(response.status_code, 200)

    def test_post(self):
        self.client.login(email=self.user.email, password="foo")
        report = make(Report, point=ORIGIN)
        make(Report, point=ORIGIN)
        response = self.client.post(reverse("reports-delete", args=[report.pk]))
        self.assertRedirects(response, reverse("reports-list"))
        self.assertFalse(Report.objects.filter(pk=report.pk).exists())
        self.assertEqual(Report.objects.count(), 1)
