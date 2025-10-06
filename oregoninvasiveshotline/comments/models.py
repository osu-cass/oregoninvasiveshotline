from django.urls import reverse
from django.db import models

from oregoninvasiveshotline.visibility import Visibility


class Comment(Visibility, models.Model):
    """
    Comments can be left on reports
    """
    comment_id = models.AutoField(primary_key=True)
    body = models.TextField()
    created_on = models.DateTimeField(auto_now_add=True)
    edited_on = models.DateField(auto_now=True)

    visibility = models.IntegerField(choices=Visibility.choices, default=Visibility.PROTECTED, help_text="Controls who can see this comment")

    created_by = models.ForeignKey("users.User", on_delete=models.CASCADE)
    report = models.ForeignKey("reports.Report", related_name="comments", on_delete=models.CASCADE)

    class Meta:
        db_table = "comment"
        ordering = ["created_on", "pk"]

    def get_absolute_url(self):
        return reverse("reports-detail", args=[self.report.pk]) + "#comment-" + str(self.pk)

    def __str__(self):
        return 'Comment on: report "{0.report}"'.format(self)
