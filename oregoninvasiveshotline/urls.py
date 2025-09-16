from django.conf import settings
from django.urls import include, path, re_path
from django.conf.urls.static import static
from django.contrib import admin
from django.shortcuts import redirect

from .comments import views as comments
from .notifications import views as notifications
from .perms import permissions
from .reports import views as reports
from .species import views as species
from .users import views as users
from .views import HomeView, AdminPanelView

 
urlpatterns = [
    # Redirects for the old site
    re_path(r'^reports/(?P<report_id>\d+)/?$', lambda request, report_id: redirect('reports-detail', report_id)),
    re_path(r'^reports/new/?$', lambda request: redirect('reports-create')),
    re_path(r'^home/search.*$', lambda request: redirect('reports-list')),

    path('', HomeView.as_view(), name='home'),

    path('admin/', admin.site.urls),
    path('adminpanel/', AdminPanelView.as_view(), name='admin-panel'),

    re_path(r'^categories/create/?$', permissions.is_staff(species.CategoryCreateView.as_view()), name='categories-create'),
    re_path(r'^categories/delete/(?P<pk>\d+)/?$', permissions.is_staff(species.CategoryDeleteView.as_view()), name='categories-delete'),
    re_path(r'^categories/detail/(?P<pk>\d+)/?$', permissions.is_staff(species.CategoryDetailView.as_view()), name='categories-detail'),
    re_path(r'^categories/list/?$', permissions.is_staff(species.CategoryList.as_view()), name='categories-list'),

    re_path(r'^comments/delete/(?P<comment_id>\d+)/?$', comments.delete, name='comments-delete'),
    re_path(r'^comments/edit/(?P<comment_id>\d+)/?$', comments.edit, name='comments-edit'),

    re_path(r'^notifications/all/?$', notifications.admin_list, name='notifications-admin-list'),
    re_path(r'^notifications/create/?$', notifications.create, name='notifications-create'),
    re_path(r'^notifications/delete/(?P<subscription_id>\d+)/?$', notifications.delete, name='notifications-delete'),
    re_path(r'^notifications/edit/(?P<subscription_id>\d+)/?$', notifications.edit, name='notifications-edit'),
    re_path(r'^notifications/list/?$', notifications.list_, name='notifications-list'),

    re_path(r'^reports/claim/(?P<report_id>\d+)/?$', reports.claim, name='reports-claim'),
    re_path(r'^reports/create/?$', reports.create, name='reports-create'),
    re_path(r'^reports/delete/(?P<report_id>\d+)/?$', reports.delete, name='reports-delete'),
    re_path(r'^reports/detail/(?P<report_id>\d+)/?$', reports.detail, name='reports-detail'),
    re_path(r'^reports/help/?$', reports.help, name='reports-help'),
    re_path(r'^reports/list/?$', reports.list_, name='reports-list'),
    re_path(r'^reports/unclaim/(?P<report_id>\d+)/?$', reports.unclaim, name='reports-unclaim'),

    re_path(r'^severities/create/?$', permissions.is_staff(species.SeverityCreateView.as_view()), name='severities-create'),
    re_path(r'^severities/delete/(?P<pk>\d+)/?$', permissions.is_staff(species.SeverityDeleteView.as_view()), name='severities-delete'),
    re_path(r'^severities/detail/(?P<pk>\d+)/?$', permissions.is_staff(species.SeverityDetailView.as_view()), name='severities-detail'),
    re_path(r'^severities/list/?$', permissions.is_staff(species.SeverityList.as_view()), name='severities-list'),

    re_path(r'^species/create/?$', permissions.is_active(species.SpeciesCreateView.as_view()), name='species-create'),
    re_path(r'^species/delete/(?P<pk>\d+)/?$', permissions.is_active(species.SpeciesDeleteView.as_view()), name='species-delete'),
    re_path(r'^species/detail/(?P<pk>\d+)/?$', permissions.is_active(species.SpeciesDetailView.as_view()), name='species-detail'),
    re_path(r'^species/list/?$', species.list_, name='species-list'),

    re_path(r'^users/authenticate/?$', users.authenticate, name='users-authenticate'),
    re_path(r'^users/avatar/(?P<user_id>\d+)/?$', users.avatar, name='users-avatar'),
    re_path(r'^users/create/?$', users.create, name='users-create'),
    re_path(r'^users/delete/(?P<user_id>\d+)/?$', users.delete, name='users-delete'),
    re_path(r'^users/detail/(?P<pk>\d+)/?$', users.Detail.as_view(), name='users-detail'),
    re_path(r'^users/edit/(?P<user_id>\d+)/?$', users.edit, name='users-edit'),
    re_path(r'^users/home/?$', users.home, name='users-home'),
    re_path(r'^users/list/?$', users.list_, name='users-list'),

    # url(r'^login/?$', users.login, name='login'),
    re_path(r'^login/?$', users.LoginView.as_view(), name='login'),
    path('', include('django.contrib.auth.urls')),

    path('pages/', include('oregoninvasiveshotline.pages.urls')),
]


if settings.DEBUG:  # pragma: no cover
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static('htmlcov', document_root='htmlcov', show_indexes=True)


urlpatterns += [path('', include('django.contrib.flatpages.urls'))]