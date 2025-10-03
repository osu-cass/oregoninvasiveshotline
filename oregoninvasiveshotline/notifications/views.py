from django.shortcuts import get_object_or_404, redirect, render
from django.contrib import messages
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http import HttpResponseRedirect
from django.db import transaction
from django.conf import settings
from django.urls import reverse

from oregoninvasiveshotline.utils.db import will_be_deleted_with
from oregoninvasiveshotline.perms import permissions
from oregoninvasiveshotline.users.utils import get_tab_counts

from .forms import UserNotificationQueryForm, UserSubscriptionAdminForm, UserSubscriptionDeleteForm
from .models import UserNotificationQuery
from .tasks import notify_new_subscription_owner


@permissions.is_active
def create(request):
    user = request.user
    query = request.GET.copy()
    query.pop('tabs', None)
    query = query.urlencode()
    instance = UserNotificationQuery(user=user, query=query)
    if request.method == 'POST':
        form = UserNotificationQueryForm(request.POST, instance=instance, current_user=user)
        if form.is_valid():
            instance = form.save()
            messages.success(request, 'New search subscription "{0.name}" added'.format(instance))
            return HttpResponseRedirect(reverse('reports-list') + '?' + request.GET.urlencode())
    else:
        form = UserNotificationQueryForm(instance=instance, current_user=user)
    return render(request, 'notifications/create.html', {
        'form': form,
    })


@permissions.is_staff
def edit(request, subscription_id):
    subscription = UserNotificationQuery.objects.get(pk=subscription_id)
    if request.method == 'POST':
        form = UserSubscriptionAdminForm(request.POST, instance=subscription)
        old_owner = subscription.user
        if form.is_valid():
            instance = form.save()
            new_owner = instance.user
            if new_owner != old_owner:
                # If the owner has changed, send the new owner an email updating
                # them of their newly assigned subscription
                transaction.on_commit(lambda: notify_new_subscription_owner.delay(instance.pk, request.user.pk))
                messages.success(request, 'Subscription updated. {0.full_name} has been notified'.format(new_owner))
            else:
                messages.success(request, 'Subscription updated')
            return redirect('notifications-admin-list')
    else:
        form = UserSubscriptionAdminForm(instance=subscription)
    return render(request, 'notifications/edit.html', {
        'form': form,
    })


@permissions.is_active
def list_(request):
    """List of current user's subscriptions."""
    user = request.user
    report_ids = request.session.get('report_ids', [])
    tab_context = get_tab_counts(user, report_ids)
    if request.method == 'POST':
        form = UserSubscriptionDeleteForm(request.POST, user=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Saved')
            return redirect('notifications-list')
    else:
        form = UserSubscriptionDeleteForm(user=request.user)
    context = {'form': form}
    context.update(tab_context)  # pyright: ignore
    return render(request, 'notifications/list.html', context)


@permissions.is_staff
def admin_list(request):
    """List of all subscriptions that only admins can access."""
    # XXX: Not sure if this should be sorted by subscription name or
    # XXX: user. We should probably make these searchable.
    subscriptions = UserNotificationQuery.objects.all().order_by('name')

    active_page = request.GET.get('page')
    paginator = Paginator(subscriptions, settings.ITEMS_PER_PAGE)

    try:
        subscriptions = paginator.page(active_page)
    except PageNotAnInteger:
        subscriptions = paginator.page(1)
    except EmptyPage:
        subscriptions = paginator.page(paginator.num_pages)

    return render(request, 'notifications/admin_list.html', {
        'subscriptions': subscriptions,
    })


@permissions.is_staff()
def delete(request, subscription_id):
    subscription = get_object_or_404(UserNotificationQuery, pk=subscription_id)
    if request.method == 'POST':
        subscription.delete()
        messages.success(request, 'Subscription deleted!')
        return redirect('notifications-admin-list')

    related_objects = list(will_be_deleted_with(subscription))

    return render(request, 'delete.html', {
        'object': subscription,
        'will_be_deleted_with': related_objects,
    })
