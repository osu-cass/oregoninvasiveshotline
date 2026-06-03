import inspect
from functools import wraps

from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404

from oregoninvasiveshotline.permissions.exc import NoSuchPermissionError, PermissionsError


class PermissionViewDecoratorMixin:
    def require(self, perm_name, **kwargs):
        """Use as a decorator on a view to require a permission.

        Optional args:

            - ``field`` The name of the model field to use for lookup
              (this is only relevant when requiring a permission that
              was registered with ``model=SomeModelClass``)

        Examples::

            @registry.require('can_do_stuff')
            def view(request):
                ...

            @registry.require('can_do_stuff_with_model', field='alt_id')
            def view_model(request, model_id):
                ...

        """
        view_decorator = self._get_entry(perm_name).view_decorator
        return view_decorator(**kwargs) if kwargs else view_decorator

    def __getattr__(self, name):
        return self.require(name)

    def _get_entry(self, perm_name):
        """Get registry entry for permission."""
        try:
            return self._registry[perm_name]
        except KeyError:
            raise NoSuchPermissionError(perm_name)

    def _get_view_name(self, view):
        """Get fully-qualified name for ``view``."""
        if hasattr(view, '__qualname__'):
            return view.__qualname__
        return '{0.__module__}.{0.__name__}'.format(view)

    def _make_view_decorator(self, perm_name, perm_func, model, allow_staff, allow_superuser,
                             allow_anonymous, unauthenticated_handler, request_types):

        def view_decorator(view=None, field='pk'):
            if view is None:
                return lambda view_: view_decorator(view_, field)
            elif not callable(view):
                raise PermissionsError('Bad call to permissions decorator')

            entry = self._get_entry(perm_name)
            entry.views.add(self._get_view_name(view))

            # When a permission is applied to a class, which is presumed
            # to be a class-based view, instead apply the permission to
            # the class's dispatch() method. This will effectively
            # require the permission for all of the class's view methods:
            # get(), post(), etc. The class is returned as is.
            #
            # @permissions.require('can_do_stuff')
            # class MyView(View):
            #
            #     def get(request):
            #         ...
            #
            # In this example, the call to require() returns this
            # instance of view_decorator. When view_decorator is
            # called (via @), MyView is passed in. When the lines
            # below are reached, we decorate MyView.dispatch() and
            # then return MyView.
            if isinstance(view, type):
                view.dispatch = view_decorator(view.dispatch, field)
                return view

            # This contains the names of all of the view's args
            # (positional and keyword). This is used to find the field
            # value for permissions that operate on a model.
            view_args_spec = inspect.getfullargspec(view)
            view_arg_names = view_args_spec.args
            perm_func_arg_spec = inspect.getfullargspec(perm_func)
            perm_func_arg_names = perm_func_arg_spec.args

            @wraps(view)
            def wrapper(*args, **kwargs):
                # The following allows permissions decorators to work on
                # view functions and class-based view methods. Either
                # the first or the second arg must be the request. In
                # the latter case, the first arg will be an instance of
                # a class-based view).
                if isinstance(args[0], request_types):
                    request_index = 0
                elif isinstance(args[1], request_types):
                    request_index = 1
                else:
                    raise PermissionsError('Could not find request in args passed to view')

                request = args[request_index]
                user = request.user

                if not allow_anonymous and user.is_anonymous:
                    return unauthenticated_handler(request)

                def test():
                    # All this stuff is in this closure because it won't
                    # be needed if the permission check is bypassed. In
                    # particular, we want to avoid fetching the model
                    # instance if possible.
                    perm_func_args = [user]
                    perm_func_kwargs = {}

                    args_index = request_index + 1
                    remaining_args = args[args_index:]  # Args after request
                    remaining_arg_names = view_arg_names[args_index:]

                    view_args = kwargs.copy()
                    view_args['request'] = request
                    view_args.update(zip(remaining_arg_names, remaining_args))

                    if model is not None:
                        if remaining_args:
                            # Assume the 1st positional arg after the
                            # request passed to the view contains the
                            # field value...
                            field_val = remaining_args[0]
                        else:
                            # ...unless there are no positional args
                            # after the request; in that case, use the
                            # value of the first keyword arg.
                            field_val = kwargs[remaining_arg_names[0]]
                        instance = self._get_model_instance(model, **{field: field_val})
                        perm_func_args.append(instance)

                    # Starting after the perm func's required args
                    # (either user or user & instance), map view args
                    # to perm func args.
                    for n in perm_func_arg_names[len(perm_func_args):]:
                        if n in view_args:
                            perm_func_kwargs[n] = view_args[n]

                    return perm_func(*perm_func_args, **perm_func_kwargs)

                has_permission = (
                    allow_staff and user.is_staff or
                    allow_superuser and user.is_superuser or
                    test()
                )

                if has_permission:
                    return view(*args, **kwargs)
                elif user.is_anonymous:
                    return unauthenticated_handler(request)
                else:
                    # Tack on the permission name to the request for
                    # better error handling since Django doesn't
                    # give you access to the PermissionDenied
                    # exception object.
                    request.permission_name = perm_name
                    raise PermissionDenied(
                        'The "{0}" permission is required to access this resource'
                        .format(perm_name))

            return wrapper
        return view_decorator

    def entry_for_view(self, view, perm_name):
        """Get registry entry for permission if ``view`` requires it.

        In other words, if ``view`` requires the permission specified by
        ``perm_name``, return the :class:`Entry` associated with the
        permission. If ``view`` doesn't require the permission, return
        ``None`` instead.

        """
        view_name = self._get_view_name(view)
        entry = self._get_entry(perm_name)
        if view_name in entry.views:
            return entry
        return None

    def _get_user_model(self):
        return get_user_model()

    def _get_anonymous_user_model(self):
        from django.contrib.auth.models import AnonymousUser
        return AnonymousUser

    def _get_model_instance(self, model, **kwargs):  # pragma: no cover
        return get_object_or_404(model, **kwargs)
