from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.flatpages.models import FlatPage
from django.shortcuts import get_object_or_404, redirect, render

from oregoninvasiveshotline.utils.urls import safe_redirect

from . import HIDDEN_PAGE_PREFIX
from .forms import FlatterPageForm


@staff_member_required
def list_(request):
    pages = FlatPage.objects.exclude(url__startswith=HIDDEN_PAGE_PREFIX)
    return render(request, "pages/list.html", {
        'pages': pages,
    })


@staff_member_required
def edit(request, page_id=None):
    if page_id is None:
        page = None
    else:
        page = get_object_or_404(FlatPage, pk=page_id)

    if request.method == "POST":
        form = FlatterPageForm(request.POST, instance=page)
        if form.is_valid():
            form.save()
            messages.success(request, "Saved")
            return safe_redirect(
                request,
                request.GET.get("next"),
                fallback_url_name='pages-list'
            )
    else:
        form = FlatterPageForm(instance=page)

    return render(request, "pages/edit.html", {
        'form': form,
        'page': page,
        'page_id': page_id,
    })


@staff_member_required
def delete(request, page_id):
    page = get_object_or_404(FlatPage, pk=page_id)
    if request.method == "POST":
        page.delete()
        messages.success(request, "Page deleted!")
        return redirect('pages-list')

    return render(request, "pages/delete.html", {
        "page": page,
    })
