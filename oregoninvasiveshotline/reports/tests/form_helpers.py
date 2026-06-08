import io

from django.core.files.uploadedfile import InMemoryUploadedFile

from model_bakery.baker import make
from PIL import Image as PILImage

from oregoninvasiveshotline.species.models import Category


def get_valid_new_report_form_data(**overrides: object) -> dict[str, object]:
    """Return valid report wizard form data."""
    category = make(Category)
    data = {
        "find_description": "Found near trail edge",
        "category": category.pk,
        "location_description": "Near mile marker 3",
        "latitude": 44.0481,
        "longitude": -123.0906,
        "email": "foo@example.com",
        "first_name": "Foo",
        "last_name": "Bar",
    }
    data.update(overrides)
    return data


def make_uploaded_image(
    file_name: str = "test.png",
    image_format: str = "PNG",
    mode: str = "RGB",
    color: tuple[int, ...] = (255, 0, 0),
) -> InMemoryUploadedFile:
    """Return an in-memory uploaded image."""
    image_data = io.BytesIO()
    PILImage.new(mode, (2, 2), color).save(image_data, format=image_format)
    image_size = image_data.tell()
    image_data.seek(0)
    return InMemoryUploadedFile(
        image_data,
        'image',
        file_name,
        f"image/{image_format.lower()}",
        image_size,
        None,
    )
