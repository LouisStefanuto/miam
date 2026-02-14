# Determine filename
import uuid

from fastapi import UploadFile


def get_filename(image: UploadFile) -> str:
    """Determine a filename for the uploaded image.

    If the uploaded file has an original filename, use it. Otherwise, generate a unique filename based on the content type.
    """
    if image.filename:
        return image.filename

    if not image.content_type:
        raise ValueError(
            "Cannot determine filename: no original filename or content type provided"
        )

    # Get extension from content_type
    extension = image.content_type.split("/")[-1]
    # Generate a unique filename
    return f"{uuid.uuid4().hex}.{extension}"
