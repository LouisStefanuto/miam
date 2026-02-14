from pathlib import Path
from uuid import UUID, uuid4

from loguru import logger

from miam.domain.ports_secondary import ImageStoragePort


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

    def add_recipe_image(self, recipe_id: UUID, image: bytes, filename: str) -> UUID:
        """Save image to local filesystem under a folder named by recipe_id."""
        image_id = uuid4()

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
