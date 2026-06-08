import logging
from io import BytesIO
from pathlib import Path

from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile
from PIL import Image, ImageOps, UnidentifiedImageError

log = logging.getLogger(__name__)
WEBP_FORMAT = "WEBP"


class ImageConversionError(Exception):
    """Raised when an uploaded image cannot be converted."""


def _get_webp_mode(img: Image.Image) -> str:
    """Return the image mode to use before saving as WebP."""
    return "RGBA" if "A" in img.getbands() or "transparency" in img.info else "RGB"


def generate_thumbnail(input_path, output_path, width, height):
    """Generate a thumbnail from the source image.

    If the input image is already smaller than ``width`` X ``height``,
    it will be returned as is.

    The aspect ratio will be preserved if the image has to be resized.

    If the input and output paths are the same, a ``ValueError`` will
    be raised.

    On successful thumbnail generation, ``True`` will be returned. If
    the thumbnail can't be generated for some reason, ``False`` will be
    returned.

    """
    if input_path == output_path:
        raise ValueError('Input path is identical to output path')

    try:
        img = Image.open(input_path)
    except FileNotFoundError:
        log.error('Could not find image at: %s', input_path)
        return False
    except IOError:
        log.exception('Error while opening image at: %s', input_path)
        return False

    try:
        img.thumbnail((width, height))
        img.save(output_path)
    except IOError:
        log.exception('Cannot resize image at: %s', input_path)
        return False

    return True


def get_webp_image(image_file: UploadedFile) -> UploadedFile | ContentFile:
    """Return an uploaded image as WebP, converting when necessary.

    Args:
        image_file: Uploaded image file to inspect and optionally convert.

    Returns:
        UploadedFile | ContentFile: Original WebP upload or converted WebP file.

    Raises:
        ImageConversionError: If the upload cannot be read or converted.
    """
    image_file.seek(0)

    try:
        with Image.open(image_file) as img:
            if img.format == WEBP_FORMAT:
                return image_file

            output = BytesIO()
            img = ImageOps.exif_transpose(img)
            img.convert(_get_webp_mode(img)).save(
                output,
                format=WEBP_FORMAT,
                quality=85,
            )
    except (OSError, UnidentifiedImageError, Image.DecompressionBombError) as error:
        raise ImageConversionError("Image could not be converted to WebP.") from error
    finally:
        image_file.seek(0)

    return ContentFile(
        output.getvalue(),
        name=f"{Path(image_file.name).stem or 'image'}.webp",
    )
