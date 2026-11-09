from django.core.management import call_command

from oregoninvasiveshotline.celery import app


@app.task
def purge_tmp_uploads():
    """Run the purge_tmp_uploads management command."""
    call_command("purge_tmp_uploads")
