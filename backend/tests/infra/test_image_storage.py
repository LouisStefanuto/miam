"""Tests for LocalImageStorage against real filesystem using tmp_path."""

from pathlib import Path
from uuid import uuid4

from miam.infra.image_storage import LocalImageStorage

# ---------------------------------------------------------------------------
# Init
# ---------------------------------------------------------------------------


class TestInit:
    def test_creates_base_folder(self, tmp_path: Path) -> None:
        folder = tmp_path / "new_images"
        assert not folder.exists()
        LocalImageStorage(str(folder))
        assert folder.is_dir()

    def test_existing_folder_ok(self, tmp_path: Path) -> None:
        folder = tmp_path / "existing"
        folder.mkdir()
        storage = LocalImageStorage(str(folder))
        assert storage.base_folder == folder


# ---------------------------------------------------------------------------
# Add image
# ---------------------------------------------------------------------------


class TestAddImage:
    def test_creates_file(self, tmp_path: Path) -> None:
        storage = LocalImageStorage(str(tmp_path))
        recipe_id = uuid4()
        image_id = uuid4()
        storage.add_recipe_image(recipe_id, b"jpeg-data", "photo.jpg", image_id)

        expected = tmp_path / f"{image_id}.jpg"
        assert expected.is_file()

    def test_correct_content(self, tmp_path: Path) -> None:
        storage = LocalImageStorage(str(tmp_path))
        image_id = uuid4()
        content = b"\x89PNG-fake-image-data"
        storage.add_recipe_image(uuid4(), content, "pic.png", image_id)

        saved = tmp_path / f"{image_id}.png"
        assert saved.read_bytes() == content

    def test_preserves_extension(self, tmp_path: Path) -> None:
        storage = LocalImageStorage(str(tmp_path))
        image_id = uuid4()
        storage.add_recipe_image(uuid4(), b"data", "image.webp", image_id)

        assert (tmp_path / f"{image_id}.webp").is_file()


# ---------------------------------------------------------------------------
# Get image
# ---------------------------------------------------------------------------


class TestGetImage:
    def test_existing_jpeg(self, tmp_path: Path) -> None:
        storage = LocalImageStorage(str(tmp_path))
        image_id = uuid4()
        storage.add_recipe_image(uuid4(), b"jpeg-bytes", "photo.jpg", image_id)

        response = storage.get_recipe_image(image_id)

        assert response is not None
        assert response.content == b"jpeg-bytes"
        assert response.media_type == "image/jpeg"

    def test_existing_png(self, tmp_path: Path) -> None:
        storage = LocalImageStorage(str(tmp_path))
        image_id = uuid4()
        storage.add_recipe_image(uuid4(), b"png-bytes", "photo.png", image_id)

        response = storage.get_recipe_image(image_id)

        assert response is not None
        assert response.media_type == "image/png"

    def test_not_found(self, tmp_path: Path) -> None:
        storage = LocalImageStorage(str(tmp_path))
        assert storage.get_recipe_image(uuid4()) is None

    def test_no_extension_fallback(self, tmp_path: Path) -> None:
        storage = LocalImageStorage(str(tmp_path))
        image_id = uuid4()
        # Write a file with no extension directly
        (tmp_path / str(image_id)).write_bytes(b"raw-data")

        response = storage.get_recipe_image(image_id)

        assert response is not None
        assert response.content == b"raw-data"
        assert response.media_type == "application/octet-stream"


# ---------------------------------------------------------------------------
# Delete image
# ---------------------------------------------------------------------------


class TestDeleteImage:
    def test_existing(self, tmp_path: Path) -> None:
        storage = LocalImageStorage(str(tmp_path))
        image_id = uuid4()
        storage.add_recipe_image(uuid4(), b"data", "photo.jpg", image_id)

        assert storage.delete_image(image_id) is True
        assert not (tmp_path / f"{image_id}.jpg").exists()

    def test_not_found(self, tmp_path: Path) -> None:
        storage = LocalImageStorage(str(tmp_path))
        assert storage.delete_image(uuid4()) is False

    def test_delete_then_get_returns_none(self, tmp_path: Path) -> None:
        storage = LocalImageStorage(str(tmp_path))
        image_id = uuid4()
        storage.add_recipe_image(uuid4(), b"data", "pic.jpg", image_id)

        storage.delete_image(image_id)
        assert storage.get_recipe_image(image_id) is None
