import logging
from typing import Any

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import login as django_login
from django.contrib.auth.views import LoginView as DjangoLoginView
from django.core.signing import BadSignature
from django.db import transaction
from django.shortcuts import redirect

from oregoninvasiveshotline.reports.models import Invite, Report
from oregoninvasiveshotline.users.forms import PublicLoginForm
from oregoninvasiveshotline.users.models import User
from oregoninvasiveshotline.users.tasks import notify_public_user_for_login_link
from oregoninvasiveshotline.utils.urls import safe_redirect


logger = logging.getLogger(__name__)


class LoginView(DjangoLoginView):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['other_form'] = PublicLoginForm()
        return context

    def get_form_class(self) -> Any:
        if self.request.POST.get('form') == 'OTHER_LOGIN':
            return PublicLoginForm
        return super().get_form_class()

    def form_valid(self, form):
        if isinstance(form, PublicLoginForm):
            try:
                user = User.objects.get(email__iexact=form.cleaned_data.get('email'))
            except User.DoesNotExist:
                msg = "Could not find the account {} for public login"
                messages.warning(self.request, msg.format(form.cleaned_data.get('email')))
            else:
                if user.is_active:
                    msg = "You must log in with your username and password"
                    messages.info(self.request, msg)
                else:
                    msg = "Check your email! You have been sent the login link."
                    messages.success(self.request, msg)
                    transaction.on_commit(lambda: notify_public_user_for_login_link.delay(user.pk))

            next_url = self.request.get_full_path()
            return safe_redirect(self.request, next_url)

        return super().form_valid(form)


def authenticate(request):
    signature = request.GET.get('sig', '')
    user = None

    try:
        user = User.from_signature(signature)
    except BadSignature:
        msg = "Bad signature '{}' detected during authentication"
        logger.warning(msg.format(signature))
    finally:
        # Signature has expired
        if user is None:
            messages.error(request, 'Unable to login with that URL')
            return redirect('home')

    # Create authenticated session for active and/or invited users
    if user.is_active or Invite.objects.filter(user=user).exists():
        django_login(request, user)

    # Add user's reports to their session
    request.session['report_ids'] = list(
        Report.objects.filter(created_by=user).values_list('pk', flat=True)
    )

    return safe_redirect(
        request,
        request.GET.get('next'),
        settings.LOGIN_REDIRECT_URL
    )
