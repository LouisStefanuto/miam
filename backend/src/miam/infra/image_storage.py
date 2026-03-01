"""Handles storing images (local or remote file storage)."""

import mimetypes
from pathlib import Path
from uuid import UUID

from loguru import logger

from miam.domain.ports_secondary import ImageStoragePort
from miam.domain.schemas import ImageResponse


class LocalImageStorage(ImageStoragePort):
    def __init__(self, base_folder: str) -> None:
        """Initialize local storage with a base folder. Creates folder if needed."""
        self.base_folder = Path(base_folder)

        try:
            self.base_folder.mkdir(parents=True, exist_ok=True)
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error(
                f"Failed to create image storage folder {self.base_folder}: {exc}"
            )
            raise

    def add_recipe_image(
        self,
        recipe_id: UUID,
        image: bytes,
        filename: str,
        image_id: UUID,
    ) -> UUID:
        """Save image to local filesystem using predictable path {image_id}{ext}."""
        try:
            self.base_folder.mkdir(parents=True, exist_ok=True)
            ext = Path(filename).suffix
            image_path = self.base_folder / f"{image_id}{ext}"
            with open(image_path, "wb") as f:
                f.write(image)
            logger.info(f"Saved image for recipe {recipe_id} at {image_path}")
            return image_id
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error(
                f"Failed to save image for recipe {recipe_id} at {image_path}: {exc}"
            )
            raise

    def _find_image(self, image_id: UUID) -> Path | None:
        """Find image file by ID using glob instead of full directory scan."""
        matches = list(self.base_folder.glob(f"{image_id}.*"))
        if matches:
            return matches[0]
        # Fallback: file with no extension
        exact = self.base_folder / str(image_id)
        if exact.is_file():
            return exact
        return None

    def get_recipe_image(self, image_id: UUID) -> ImageResponse | None:
        """Retrieve image bytes from storage by image ID."""
        file = self._find_image(image_id)
        if file is None:
            logger.warning(f"Image with ID {image_id} not found in storage")
            return None
        media_type = mimetypes.guess_type(file.name)[0]
        if not media_type:
            logger.warning(
                f"Could not determine media type for image {file.name}, defaulting to application/octet-stream"
            )
            media_type = "application/octet-stream"
        with open(file, "rb") as f:
            return ImageResponse(content=f.read(), media_type=media_type)

    def delete_image(self, image_id: UUID) -> bool:
        """Delete an image file from local storage by image ID."""
        file = self._find_image(image_id)
        if file is None:
            logger.warning(f"Image file with ID {image_id} not found for deletion")
            return False
        file.unlink()
        logger.info(f"Deleted image file {file.name}")
        return True
