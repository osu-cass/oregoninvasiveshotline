import logging
from functools import wraps

import django.conf
from django.http import HttpRequest, HttpResponse
from django.utils.module_loading import import_string

try:
    import rest_framework
    from rest_framework.request import Request as DRFRequest
except ImportError:
    rest_framework = None
    DRFRequest = None

from oregoninvasiveshotline.permissions.exc import DuplicatePermissionError, PermissionsError
from oregoninvasiveshotline.permissions.meta import PermissionsMeta
from oregoninvasiveshotline.permissions.registry.defaults import DEFAULT_SETTINGS, NO_VALUE, _default
from oregoninvasiveshotline.permissions.registry.entry import Entry
from oregoninvasiveshotline.permissions.registry.view_decorators import PermissionViewDecoratorMixin
from oregoninvasiveshotline.permissions.templatetags.permissions import register


log = logging.getLogger(__name__)


class PermissionsRegistry(PermissionViewDecoratorMixin):
    """A registry of permissions.

    Args:

        - allow_staff: Allow staff to access all views by default. If
          this is set and the user is a staff member, the permission
          logic will not be invoked. [False]

        - allow_superuser: Allow superusers to access all views by
          default. If this is set and the user is a superuser, the
          permission logic will not be invoked. [False]

        - allow_anonymous: Allow anonymous users. Note: this is
          different from the two options above in that it doesn't
          grant permission by default but instead just gives anonymous
          users a chance to access a view--the permission logic is still
          invoked. [False]

        - unauthenticated_handler: A function that handles unpermitted
          requests by anonymous users. It's called when a view doesn't
          allow anonymous users and also when anonymous users are
          allowed but the permission check fails. It takes the current
          request as its only arg; it should return a response object.
          [Default behavior is to redirect to the login page]

        - request_types: A list of the types of request objects used by
          your project. In a typical Django project, including projects
          that use Django REST Framework, this won't need to be set.
          [(django.http.HttpRequest, rest_framework.request.Request)]

          .. note:: You never need to add Django's request class to the
              ``request_types`` list; it will be added automatically if
              it's not present. Likewise for DRF's request class, except
              that it will only be added if DRF is installed.

        If an option's value isn't passed to the constructor, it will
        be pulled from your project's settings or fall back to the
        defaults noted above in brackets.

        All options can be overridden on a per-permission basis by
        passing the corresponding argument to :meth:`register`.

    Create a registry somewhere in your project::

        # my/project/perms.py
        from permissions import PermissionsRegistry

        permissions = PermissionsRegistry()

    Then register permissions for an app like so::

        # my/project/app/perms.py
        from my.project.perms import permissions

        @permissions.register
        def can_do_stuff(user):
            ...

        @permissions.register(model=MyModel)
        def can_do_things(user, instance):
            ...

    Then require permissions on views like this::

        # my/project/app/views.py
        from my.project.perms import permissions

        @permissions.require('can_do_stuff')
        def my_view(request):
            ...

    TODO: Write more documentation.

    """

    def __init__(self, allow_staff=None, allow_superuser=None, allow_anonymous=None,
                 unauthenticated_handler=None, request_types=None):
        self._registry = dict()

        settings = DEFAULT_SETTINGS.copy()
        if hasattr(django.conf.settings, 'PERMISSIONS'):
            settings.update(django.conf.settings.PERMISSIONS)

        self._allow_staff = _default(allow_staff, settings['allow_staff'])
        self._allow_superuser = _default(allow_superuser, settings['allow_superuser'])
        self._allow_anonymous = _default(allow_anonymous, settings['allow_anonymous'])

        unauthenticated_handler = _default(
            unauthenticated_handler, settings['unauthenticated_handler'])

        if unauthenticated_handler is None:
            # Set up the default handler for unauthenticated requests.

            # Putting this import here is a hack-around for testing.
            # Merely importing login_required causes
            # django.conf.settings to be accessed in some other module,
            # which causes ImproperlyConfigured to be raised during the
            # import phase of test discovery.
            from django.contrib.auth.decorators import login_required

            # A fake view that, when called with the current request,
            # triggers Django's redirect-to-login functionality.
            force_login_view = login_required(lambda _: HttpResponse())
            def default_unauthenticated_handler(request):
                return force_login_view(request)
            unauthenticated_handler = default_unauthenticated_handler
        else:
            if isinstance(unauthenticated_handler, str):
                unauthenticated_handler = import_string(unauthenticated_handler)
        self._unauthenticated_handler = unauthenticated_handler

        request_types = _default(request_types, settings['request_types'])
        request_types = tuple(import_string(t) for t in request_types if isinstance(t, str))
        if rest_framework and DRFRequest not in request_types:
            request_types = (DRFRequest,) + request_types
        if HttpRequest not in request_types:
            request_types = (HttpRequest,) + request_types
        self._request_types = request_types

    @property
    def metaclass(self):
        """Get a metaclass configured to use this registry."""
        if '_metaclass' not in self.__dict__:
            self._metaclass = type('PermissionsMeta', (PermissionsMeta,), {'registry': self})
        return self._metaclass

    def register(self, perm_func=None, model=None, allow_staff=None, allow_superuser=None,
                 allow_anonymous=None, unauthenticated_handler=None, request_types=None, name=None,
                 replace=False, _return_entry=False):
        """Register permission function & return the original function.

        This is typically used as a decorator::

            permissions = PermissionsRegistry()
            @permissions.register
            def can_do_something(user):
                ...

        For internal use only: you can pass ``_return_entry=True`` to
        have the registry :class:`.Entry` returned instead of
        ``perm_func``.

        """
        allow_staff = _default(allow_staff, self._allow_staff)
        allow_superuser = _default(allow_superuser, self._allow_superuser)
        allow_anonymous = _default(allow_anonymous, self._allow_anonymous)
        unauthenticated_handler = _default(unauthenticated_handler, self._unauthenticated_handler)
        request_types = _default(request_types, self._request_types)

        if perm_func is None:
            return (
                lambda perm_func_:
                    self.register(
                        perm_func_, model, allow_staff, allow_superuser, allow_anonymous,
                        unauthenticated_handler, request_types, name, replace, _return_entry)
            )

        name = _default(name, perm_func.__name__)
        if name == 'register':
            raise PermissionsError('register cannot be used as a permission name')
        elif name in self._registry and not replace:
            raise DuplicatePermissionError(name)

        view_decorator = self._make_view_decorator(
            name, perm_func, model, allow_staff, allow_superuser, allow_anonymous,
            unauthenticated_handler, request_types)
        entry = Entry(
            name, perm_func, view_decorator, model, allow_staff, allow_superuser, allow_anonymous,
            unauthenticated_handler, request_types, set())
        self._registry[name] = entry

        @wraps(perm_func)
        def wrapped_func(user, instance=NO_VALUE):
            if user is None:
                return False
            if not allow_anonymous and user.is_anonymous:
                return False
            def test():
                return perm_func(user) if instance is NO_VALUE else perm_func(user, instance)
            return (
                allow_staff and user.is_staff or
                allow_superuser and user.is_superuser or
                test()
            )

        register.filter(name, wrapped_func)

        log.debug('Registered permission: {0}'.format(name))
        return entry if _return_entry else wrapped_func

    __call__ = register
