from django.conf import settings
from django.contrib.messages.views import SuccessMessageMixin
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.views.generic import CreateView, DeleteView, ListView, UpdateView
from django.urls import reverse, reverse_lazy
from django.shortcuts import render

from oregoninvasiveshotline.utils.db import will_be_deleted_with
from oregoninvasiveshotline.perms import permissions
from oregoninvasiveshotline.species.forms import SpeciesSearchForm
from oregoninvasiveshotline.species.models import Category, Severity, Species


@permissions.is_active
def list_(request):
    """List all species in the system *or* search for species.

    If the user is *not* doing a search, all the species are loaded.

    If the user *is* doing a search (indicated by the presence of
    certain query parameters), then we load the species that match the
    search criteria.

    In either case, the species are then ordered by as indicated by
    the `order_by` and `order` query parameters.

    """
    params = request.GET
    form = SpeciesSearchForm(params)

    species = Species.objects.all()
    if form.is_valid():
        species = form.search(species)

    active_page = params.get('page')
    paginator = Paginator(species, settings.ITEMS_PER_PAGE)

    try:
        species = paginator.page(active_page)
    except PageNotAnInteger:
        species = paginator.page(1)
    except EmptyPage:
        species = paginator.page(paginator.num_pages)

    return render(request, 'species/list.html', {
        'all_species': species,
        'form': form,
    })


class SpeciesCreateView(SuccessMessageMixin, CreateView):
    model = Species
    fields = ['name', 'scientific_name', 'remedy', 'resources', 'is_confidential', 'category', 'severity']
    success_message = "Species created successfully."
    template_name_suffix = '_detail_form'

    def get_success_url(self):
        return reverse("species-list")


class SpeciesDetailView(SuccessMessageMixin, UpdateView):
    model = Species
    fields = ['name', 'scientific_name', 'remedy', 'resources', 'is_confidential', 'category', 'severity', 'identification_image', 'identification_image_alt', 'identification_external_resource_link']
    success_message = "Species updated successfully."
    template_name_suffix = '_detail_form'

    def get_success_url(self):
        success_url = self.request.get_full_path()
        return success_url


class SpeciesDeleteView(SuccessMessageMixin, DeleteView):
    model = Species
    success_message = "Species deleted successfully."
    success_url = reverse_lazy('species-list')

    template_name = "delete.html"
    template_name_suffix = ""

    def get_context_data(self, **kwargs):
        obj = super(DeleteView, self).get_object()
        context = super(SpeciesDeleteView, self).get_context_data(**kwargs)
        context['will_be_deleted_with'] = will_be_deleted_with(obj)

        return context


class CategoryList(ListView):
    model = Category


class CategoryCreateView(SuccessMessageMixin, CreateView):
    model = Category
    fields = ['name', 'icon']
    template_name_suffix = '_detail_form'
    success_message = "Category created successfully."

    def get_success_url(self):
        return reverse("categories-list")


class CategoryDeleteView(SuccessMessageMixin, DeleteView):
    model = Category
    success_message = "Category deleted successfully."
    success_url = reverse_lazy('categories-list')

    template_name = "delete.html"
    template_name_suffix = ""

    def get_context_data(self, **kwargs):
        obj = super(DeleteView, self).get_object()
        context = super(CategoryDeleteView, self).get_context_data(**kwargs)
        context['will_be_deleted_with'] = will_be_deleted_with(obj)

        return context


class CategoryDetailView(SuccessMessageMixin, UpdateView):
    model = Category
    fields = ['name', 'icon']
    success_message = "Category updated successfully."
    template_name_suffix = '_detail_form'

    def get_success_url(self):
        return reverse("categories-list")


class SeverityList(ListView):
    model = Severity


class SeverityCreateView(SuccessMessageMixin, CreateView):
    model = Severity
    fields = ['name', 'color']
    success_message = "Severity created successfully."
    template_name_suffix = '_detail_form'

    def get_success_url(self):
        return reverse("severities-list")


class SeverityDeleteView(SuccessMessageMixin, DeleteView):
    model = Severity
    success_url = reverse_lazy('severities-list')
    success_message = "Severity deleted successfully."

    template_name = "delete.html"
    template_name_suffix = ""

    def get_context_data(self, **kwargs):
        obj = super(DeleteView, self).get_object()
        context = super(SeverityDeleteView, self).get_context_data(**kwargs)
        context['will_be_deleted_with'] = will_be_deleted_with(obj)

        return context


class SeverityDetailView(SuccessMessageMixin, UpdateView):
    model = Severity
    fields = ['name', 'color']
    success_message = "Severity updated successfully."
    template_name_suffix = '_detail_form'

    def get_success_url(self):
        return reverse("severities-list")
