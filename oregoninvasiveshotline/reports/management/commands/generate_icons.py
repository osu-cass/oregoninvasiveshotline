from django.core.management.base import BaseCommand

from ...utils import clean_icons, generate_icons


class Command(BaseCommand):

    help = 'Generate map-style icons'
    # empty list disables system checks (preferred over False in Django 6); type stubs still expect a bool
    requires_system_checks = [] # pyright: ignore[reportAssignmentType]

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean', action='store_true', default=False, help='Remove existing icons first')
        parser.add_argument(
            '--force', action='store_true', default=False, help='Force regeneration')
        parser.add_argument(
            '--no-input', action='store_false', dest='interactive', default=True,
            help='Don\'t ask the user for confirmation')
        parser.add_argument(
            '--quiet', action='store_true', default=False, help='Squelch command output')

    def handle(self, *args, **options):
        self.clean = options.get('clean', False)
        self.force = options.get('force', False)
        self.interactive = options.get('interactive', True)
        self.quiet = options.get('quiet', False)

        if self.interactive:
            prompt = 'Clean and generate icons?' if self.clean else 'Generate icons?'
            prompt = '{prompt} [y/N] '.format(prompt=prompt)
            answer = input(prompt).strip().lower()
            abort = answer not in ('y', 'yes')
            if abort:
                print('Aborted')
                return

        if self.clean:
            self.print('Cleaning up existing icons first...')
            removed_icons = clean_icons()
            self.print('Removed {n} icons'.format(n=len(removed_icons)))

        self.print('Generating icons...')
        generated_icons = generate_icons(self.force)
        self.print('Generated {n} icons'.format(n=len(generated_icons)))

    def print(self, *args, **kwargs):
        if not self.quiet:
            self.stdout.write(*args, **kwargs)
            self.stdout.flush()
