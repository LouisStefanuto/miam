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
        """Save image to local filesystem under a folder named by recipe_id."""
        try:
            self.base_folder.mkdir(parents=True, exist_ok=True)
            image_path = self.base_folder / f"{image_id}_{filename}"
            with open(image_path, "wb") as f:
                f.write(image)
            logger.info(f"Saved image for recipe {recipe_id} at {image_path}")
            return image_id
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error(
                f"Failed to save image for recipe {recipe_id} at {image_path}: {exc}"
            )
            raise

    def get_recipe_image(self, image_id: UUID) -> ImageResponse | None:
        """Retrieve image bytes from storage by image ID."""
        for file in self.base_folder.iterdir():
            if file.name.startswith(f"{image_id}_"):
                media_type = mimetypes.guess_type(file.name)[0]
                if not media_type:
                    logger.warning(
                        f"Could not determine media type for image {file.name}, defaulting to application/octet-stream"
                    )
                    media_type = "application/octet-stream"
                with open(file, "rb") as f:
                    return ImageResponse(content=f.read(), media_type=media_type)

        logger.warning(f"Image with ID {image_id} not found in storage")
        return None
