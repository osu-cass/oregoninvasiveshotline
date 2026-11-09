from django.core.management.base import BaseCommand

from ...tmp_uploads import purge_tmp_uploads


class Command(BaseCommand):
    help = "Delete temporary image uploads older than 24 hours"

    def handle(self, *args, **options) -> None:
        """Purge old temporary uploads and report the count."""
        deleted = purge_tmp_uploads()
        self.stdout.write(f"Deleted {deleted} temporary upload(s).")
