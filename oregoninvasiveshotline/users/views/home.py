from django.contrib import messages
from django.shortcuts import redirect, render

from oregoninvasiveshotline.users.utils import get_tab_counts


def home(request):
    """
    Just redirect to the detail view for the user. This page exists solely
    because settings.LOGIN_REDIRECT_URL needs to redirect to a "simple" URL
    (i.e. we can't use variables in the URL)
    """
    user = request.user
    if user.is_anonymous and not request.session.get('report_ids'):
        messages.error(request, "You are not allowed to be here")
        return redirect("home")

    tab_context = get_tab_counts(request.user, request.session.get("report_ids", []))

    return render(request, "users/home.html", dict({
        "user": user,
    }, **tab_context))
