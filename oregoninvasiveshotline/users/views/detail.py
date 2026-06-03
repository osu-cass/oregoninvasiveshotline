from django.views.generic import DetailView

from oregoninvasiveshotline.users.models import User


class Detail(DetailView):

    def get_queryset(self):
        queryset = User.objects.all()
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)

        return queryset

    def get_context_data(self, **kwargs):
        super(DetailView, self).get_object()
        context = super(Detail, self).get_context_data(**kwargs)
        context['current_user'] = self.request.user

        return context
