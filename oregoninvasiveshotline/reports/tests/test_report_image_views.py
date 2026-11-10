import os
import shutil
import tempfile
from uuid import uuid4

from django.test import TestCase, override_settings
from django.urls import reverse

from model_bakery.baker import make

from oregoninvasiveshotline.comments.models import Comment
from oregoninvasiveshotline.images.models import Image
from oregoninvasiveshotline.users.models import User

from ..models import Invite, Report
from .detail_helpers import DetailViewUserSetupMixin
from .shared import ORIGIN, SuppressPostSaveMixin


class ReportImageViewTest(SuppressPostSaveMixin, DetailViewUserSetupMixin, TestCase):

    def make_image(self, visibility: int, **kwargs) -> Image:
        """Create an image record attached through ``kwargs``; the file itself is not needed."""
        return make(Image, image=f"images/{uuid4().hex}.jpg", visibility=visibility, **kwargs)

    def get_image(self, image: Image):
        return self.client.get(reverse("images-serve", args=[image.image.name.removeprefix("images/")]))

    def start_reporter_session(self, report: Report) -> None:
        """Mark ``report`` as submitted in this session, like the report form does."""
        session = self.client.session
        session["report_ids"] = [report.pk]
        session.save()

    def test_anonymous_user_gets_public_image_on_public_report(self):
        report = make(Report, is_public=True, point=ORIGIN)
        image = self.make_image(Image.PUBLIC, report=report)
        response = self.get_image(image)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["X-Accel-Redirect"], "/protected-media/" + image.image.name)
        self.assertEqual(response["Content-Type"], "image/jpeg")
        self.assertEqual(response["Cache-Control"], "private, no-cache")

    def test_anonymous_user_cannot_get_restricted_images(self):
        public_report = make(Report, is_public=True, point=ORIGIN)
        private_report = make(Report, is_public=False, point=ORIGIN)
        cases = {
            "protected image": self.make_image(Image.PROTECTED, report=public_report),
            "private image": self.make_image(Image.PRIVATE, report=public_report),
            "public image on private report": self.make_image(Image.PUBLIC, report=private_report),
        }
        for label, image in cases.items():
            with self.subTest(label):
                self.assertEqual(self.get_image(image).status_code, 404)

    def test_reporter_session_gets_protected_but_not_private_images(self):
        report = make(Report, is_public=False, created_by=self.inactive_user, point=ORIGIN)
        self.start_reporter_session(report)
        protected = self.make_image(Image.PROTECTED, report=report)
        private = self.make_image(Image.PRIVATE, report=report)

        response = self.get_image(protected)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Cache-Control"], "private, no-cache")
        self.assertEqual(self.get_image(private).status_code, 404)

    def test_active_user_gets_private_image(self):
        report = make(Report, is_public=False, point=ORIGIN)
        image = self.make_image(Image.PRIVATE, report=report)
        self.client.force_login(self.user)
        response = self.get_image(image)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Cache-Control"], "private, no-cache")

    def test_comment_image_uses_the_comment_report(self):
        report = make(Report, is_public=True, point=ORIGIN)
        comment = make(Comment, report=report, visibility=Comment.PUBLIC)
        image = self.make_image(Image.PUBLIC, comment=comment)
        self.assertEqual(self.get_image(image).status_code, 200)

    def test_thumbnail_follows_image_visibility(self):
        report = make(Report, is_public=True, point=ORIGIN)
        public = self.make_image(Image.PUBLIC, report=report)
        private = self.make_image(Image.PRIVATE, report=report)

        response = self.client.get(reverse("images-thumbnail", args=[public.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["X-Accel-Redirect"], f"/protected-media/generated_thumbnails/{public.pk}.png")
        response = self.client.get(reverse("images-thumbnail", args=[private.pk]))
        self.assertEqual(response.status_code, 404)

        private_report = make(Report, is_public=False, point=ORIGIN)
        on_private_report = self.make_image(Image.PUBLIC, report=private_report)
        response = self.client.get(reverse("images-thumbnail", args=[on_private_report.pk]))
        self.assertEqual(response.status_code, 404)

    def test_invited_expert_gets_private_image(self):
        report = make(Report, is_public=False, point=ORIGIN)
        image = self.make_image(Image.PRIVATE, report=report)
        # Log in while active, then deactivate, like the detail view invite test.
        self.client.force_login(self.user)
        self.user.is_active = False
        self.user.save()
        self.assertEqual(self.get_image(image).status_code, 404)

        make(Invite, user=self.user, report=report)
        self.assertEqual(self.get_image(image).status_code, 200)

    def test_image_without_a_report_is_not_found(self):
        image = self.make_image(Image.PUBLIC)
        self.assertEqual(self.get_image(image).status_code, 404)

    def test_unknown_file_type_is_not_sent_as_html(self):
        report = make(Report, is_public=True, point=ORIGIN)
        image = make(Image, image="images/upload.unmappedext", visibility=Image.PUBLIC, report=report)
        response = self.get_image(image)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/octet-stream")

    def test_user_photo_is_public(self):
        make(User, email="photo@example.com", photo="images/avatar.jpg.png")
        response = self.client.get(reverse("images-serve", args=["avatar.jpg.png"]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["X-Accel-Redirect"], "/protected-media/images/avatar.jpg.png")
        self.assertEqual(response["Cache-Control"], "private, no-cache")

    def test_unknown_image_is_not_found(self):
        response = self.client.get(reverse("images-serve", args=["missing.jpg"]))
        self.assertEqual(response.status_code, 404)

    def test_debug_serves_file_without_nginx(self):
        media_root = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, media_root)
        os.makedirs(os.path.join(media_root, "images"))
        report = make(Report, is_public=True, point=ORIGIN)
        image = self.make_image(Image.PUBLIC, report=report)
        with open(os.path.join(media_root, image.image.name), "wb") as f:
            f.write(b"image-bytes")

        with override_settings(DEBUG=True, MEDIA_ROOT=media_root):
            response = self.get_image(image)
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("X-Accel-Redirect", response)
        self.assertEqual(b"".join(response.streaming_content), b"image-bytes")
