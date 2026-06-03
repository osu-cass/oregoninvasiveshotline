from .auth import LoginView, authenticate
from .avatars import avatar
from .detail import Detail
from .editing import create, delete, edit
from .home import home
from .listing import list_

__all__ = [
    "Detail",
    "LoginView",
    "authenticate",
    "avatar",
    "create",
    "delete",
    "edit",
    "home",
    "list_",
]
