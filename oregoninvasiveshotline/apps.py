from django.apps import AppConfig


class MainAppConfig(AppConfig):

    name = 'oregoninvasiveshotline'

    def ready(self):
        from django.contrib.auth import get_user_model
        from django.contrib.auth.forms import PasswordResetForm

        # Monkey patch the PasswordResetForm so it doesn't just silently ignore people
        # with unusable password. Anyone with an is_active account should be able to
        # reset their password
        def get_users(self, email):
            return get_user_model()._default_manager.filter(email__iexact=email, is_active=True).iterator()

        PasswordResetForm.get_users = get_users
