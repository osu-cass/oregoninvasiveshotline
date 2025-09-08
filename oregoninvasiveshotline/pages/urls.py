from django.urls import include, path, re_path

from . import views


urlpatterns = [
    path('list/', views.list_, name='pages-list'),
    path('create/', views.edit, name='pages-create'),
    re_path(r'^edit/(?P<page_id>\d+)?$', views.edit, name='pages-edit'),
    re_path(r'^delete/(?P<page_id>\d+)?$', views.delete, name='pages-delete'),
]