import json
from collections import defaultdict

from django.core.validators import RegexValidator
from django.db import models


def category_id_to_species_id_json():
    species = (
        Species.objects
            .select_related('category')
            .order_by('category__pk')
            .values_list('category__pk', 'pk')
    )
    category_id_to_species_id = defaultdict(list)
    for category_id, species_id in species:
        category_id_to_species_id[category_id].append(species_id)
    return json.dumps(category_id_to_species_id)


class Category(models.Model):

    """A container for species."""

    class Meta:
        db_table = 'category'
        ordering = ['name']

    category_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    icon = models.ImageField(
        upload_to='icons',
        null=True,
        blank=True,
        help_text=(
            'It is expected that the icon came from http://mapicons.mapsmarker.com/ and that it '
            'has a transparent background with a white foreground'
        )
    )

    species: models.Manager["Species"]

    def __str__(self):
        return self.name


class Severity(models.Model):

    class Meta:
        db_table = 'severity'
        ordering = ['name']

    severity_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    color = models.CharField(
        max_length=7,
        help_text='An HTML color of the form "#rrggbb"',
        validators=[
            RegexValidator(r"#[0-9A-Fa-f]{6}")
        ]
    )

    def __str__(self):
        return self.name


class Species(models.Model):

    class Meta:
        db_table = 'species'
        ordering = ['name']

    species_id = models.AutoField(primary_key=True)
    category = models.ForeignKey(Category, related_name="species", on_delete=models.CASCADE)
    is_confidential = models.BooleanField(
        default=False,
        help_text=(
            'A species can be marked as confidential if making a report about it public would '
            'cause harm'
        )
    )
    name = models.CharField(max_length=255)
    remedy = models.TextField(blank=True)
    resources = models.TextField(blank=True)
    scientific_name = models.CharField(max_length=255, blank=True)
    severity = models.ForeignKey(Severity, on_delete=models.CASCADE)

    identification_image = models.ImageField(upload_to='identification_images/', null=True, blank=True)
    identification_image_alt = models.CharField(null=True, blank=True)
    # Admins can add link that will allow a user to learn more about identification
    identification_external_resource_link = models.URLField(null=True, blank=True)

    @property
    def title(self):
        if self.scientific_name:
            return '{0.name} ({0.scientific_name})'.format(self)
        return self.name

    def __str__(self):
        return self.title
