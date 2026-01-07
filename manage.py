#!/usr/bin/env python
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'oregoninvasiveshotline.settings')
    os.environ.setdefault('DJANGO_ENV', 'dev')

    from django.conf import settings

    if settings.DEBUG and os.environ.get('ENABLE_DEBUGGER') == 'true':
        if os.environ.get('RUN_MAIN') or os.environ.get('WERKZEUG_RUN_MAIN'):
            import debugpy
            debugpy.listen(("0.0.0.0", 1080))
            print('Debugpy listening on 0.0.0.0:1080')

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
