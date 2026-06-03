from django.conf import settings
from django.core.paginator import EmptyPage, PageNotAnInteger, Paginator
from django.shortcuts import render

from oregoninvasiveshotline.users.forms import UserSearchForm
from oregoninvasiveshotline.users.models import User
from oregoninvasiveshotline.users.perms import permissions


@permissions.can_list_users
def list_(request):
    """List all users in the system *or* search for users.

    If the user is *not* doing a search, all the users are loaded and
    ordered by the default User ordering.

    If the user is doing a search (indicated by the presence of certain
    query parameters), then we do a search and order the results by
    relevance (we just let Haystack/ES do its default ordering).

    """
    params = request.GET
    form = UserSearchForm(params)

    users = User.objects.all()
    if form.is_valid():
        users = form.search(users)

    active_page = params.get('page')
    paginator = Paginator(users, settings.ITEMS_PER_PAGE)

    # if not only_dupes:  # XXX: Temporary (remove this line & dedent block)
    try:
        users = paginator.page(active_page)
    except PageNotAnInteger:
        users = paginator.page(1)
    except EmptyPage:
        users = paginator.page(paginator.num_pages)

    return render(request, 'users/list.html', {
        'users': users,
        'form': form,
    })
