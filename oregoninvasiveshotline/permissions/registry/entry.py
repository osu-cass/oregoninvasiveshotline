from typing import Any


class Entry:
    def __init__(self, name, perm_func, view_decorator, model, allow_staff, allow_superuser,
                 allow_anonymous, unauthenticated_handler, request_types, views):
        self.name = name
        self.perm_func = perm_func
        self.view_decorator = view_decorator
        self.model = model
        self.allow_staff = allow_staff
        self.allow_superuser = allow_superuser
        self.allow_anonymous = allow_anonymous
        self.unauthenticated_handler = unauthenticated_handler
        self.request_types = request_types
        self.views = views

    def __call__(self, *args: Any, **kwargs: Any) -> Any:
        return self.perm_func(*args, **kwargs)
