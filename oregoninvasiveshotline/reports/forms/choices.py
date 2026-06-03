from oregoninvasiveshotline.counties.models import County
from oregoninvasiveshotline.species.models import Category


def get_category_choices():
    categories = Category.objects.all().order_by('name')
    category_choices = []
    category_choices.extend((c.pk, c.name) for c in categories)
    return category_choices


def get_county_choices():
    county_choices = []
    for county in County.objects.all().order_by('state', 'name'):
        county_choices.append((county.pk, county.label))
    return county_choices
