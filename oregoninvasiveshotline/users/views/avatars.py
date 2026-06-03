import random

from django.shortcuts import get_object_or_404, render

from oregoninvasiveshotline.users.colors import AVATAR_COLORS
from oregoninvasiveshotline.users.models import User


def avatar(request, user_id, colors=AVATAR_COLORS):
    """
    Generates an SVG to use as the user's default avatar, using some random
    colors based on the user's PK
    """
    user = get_object_or_404(User, pk=user_id)
    background_color, text_color = random.Random(user.pk).sample(colors, 2)

    return render(request, "users/avatar.svg", {
        "user": user,
        "background_color": background_color,
        "text_color": text_color,
    }, content_type="image/svg+xml")
