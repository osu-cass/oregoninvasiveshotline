import os
import time
from datetime import timedelta

from django.conf import settings

# Temp uploads only need to outlive a failed form submit and its resubmit.
TMP_UPLOAD_MAX_AGE = timedelta(hours=24)


def tmp_upload_dir() -> str:
    """Return the directory where ClearableImageInput keeps temporary upload copies."""
    return os.path.join(settings.MEDIA_ROOT, "tmp")


def purge_tmp_uploads() -> int:
    """Delete temporary upload files older than 24 hours and return how many were deleted."""
    cutoff = time.time() - TMP_UPLOAD_MAX_AGE.total_seconds()
    deleted = 0
    try:
        entries = list(os.scandir(tmp_upload_dir()))
    except FileNotFoundError:
        return 0

    for entry in entries:
        if not entry.is_file() or entry.stat().st_mtime >= cutoff:
            continue
        try:
            os.remove(entry.path)
        except FileNotFoundError:
            continue
        deleted += 1
    return deleted
