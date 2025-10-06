import logging

from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django import forms

logger = logging.getLogger(__name__)


class SearchForm(forms.Form):
    q = forms.CharField(
        required=False,
        label="Search",
        widget=forms.TextInput(attrs={
            "type": "search",
            "placeholder": "Enter a keyword, then click \'Search\'"
        }),
    )

    def get_search_fields(self):
        raise NotImplementedError

    def search(self, queryset):
        if not self.is_valid() or not self.cleaned_data.get('q'):
            logger.debug("No query given to 'SearchForm.search', returning queryset.")
            return queryset

        query = str(self.cleaned_data.get('q'))
        search_vector = SearchVector(*self.get_search_fields())
        search_query = SearchQuery(query, search_type='phrase')
        queryset = queryset.annotate(
            search=search_vector
        ).filter(search=query)

        return queryset.annotate(
            rank=SearchRank(search_vector, search_query)
        ).order_by('-rank')
