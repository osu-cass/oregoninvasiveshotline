import logging
from PIL import Image, UnidentifiedImageError
from django.core.files.uploadedfile import UploadedFile

log = logging.getLogger(__name__)


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


def is_webp(image_file: UploadedFile):
    """Check whether an uploaded image file is a valid WebP image.

    Resets the file pointer before and after inspection so the file can still
    be read later by Django/storage.

    Args:
        image_file: Uploaded image file to inspect.

    Returns:
        bool: True if the file is a valid WebP image, otherwise False.
    """
    image_file.seek(0)
    
    try:
        with Image.open(image_file) as img:
            if img.format != "WEBP":
                return False
    except UnidentifiedImageError:
        return False
    finally:
        image_file.seek(0)
        
    return True