# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('species', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='species',
            old_name='confidential',
            new_name='is_confidential',
        ),
    ]
