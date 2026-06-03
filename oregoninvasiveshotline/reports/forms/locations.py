from django.contrib.gis.geos import Point

from oregoninvasiveshotline.counties.models import County


ALLOWED_REPORT_STATES = ("Oregon", "Washington")

def get_county(point: Point):
    """Return the first county polygon that intersects a point.

    Args:
        point: Geographic point to test for county intersection.

    Returns:
        County | None: First matching county, if any.
    """
    return County.objects.filter(
        the_geom__intersects=point,
    ).first()
