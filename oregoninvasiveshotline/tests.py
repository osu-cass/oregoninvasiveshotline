import tempfile
from pathlib import Path

from django.test import SimpleTestCase, TestCase

from oregoninvasiveshotline.utils.storage import ViteManifestStaticFilesStorage
from oregoninvasiveshotline.utils.test.user import UserMixin


class ViteManifestStaticFilesStorageTest(SimpleTestCase):
    def setUp(self):
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        root = Path(temp_dir.name)
        (root / "assets").mkdir()
        (root / "assets" / "main-B3uSAs9o.js").write_text("export {};")
        (root / "css").mkdir()
        (root / "css" / "site.css").write_text("body {}")
        self.storage = ViteManifestStaticFilesStorage(location=temp_dir.name)

    def test_vite_assets_keep_original_name(self):
        self.assertEqual(
            self.storage.hashed_name("assets/main-B3uSAs9o.js"),
            "assets/main-B3uSAs9o.js",
        )

    def test_other_files_are_hashed(self):
        self.assertRegex(
            self.storage.hashed_name("css/site.css"),
            r"^css/site\.[0-9a-f]{12}\.css$",
        )

    def test_save_manifest(self):
        self.storage.save_manifest()
        self.assertTrue(self.storage.exists(self.storage.manifest_name))


class RubyPasswordHasherTest(TestCase, UserMixin):
    def test_verify(self):
        with self.settings(PASSWORD_HASHERS=('django.contrib.auth.hashers.PBKDF2PasswordHasher',
                                             'oregoninvasiveshotline.hashers.RubyPasswordHasher')):
            user = self.create_user(username="foo@pdx.edu", password="foobar")
            # this is foobar hashed with sha512
            hash = "c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2"
            user.password = "RubyPasswordHasher$1$$" + hash
            user.save()
            self.assertTrue(user.check_password("foobar"))
            self.assertFalse(user.check_password("2"))
            # this should still work, despite the fact that the
            # RubyPasswordHasher didn't implement all the methods (because it
            # isn't the first password hasher)
            user.set_password("foobar2")
