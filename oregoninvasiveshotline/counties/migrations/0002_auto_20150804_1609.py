# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('counties', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            """CREATE INDEX county_gist ON county USING gist (the_geom);"""
        )
    ]
