"""Thread-safe shared state for tracking created resource IDs across Locust users."""

import random
import threading
from uuid import UUID


class SharedState:
    """Thread-safe shared state for tracking created resource IDs across users."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._recipe_ids: list[UUID] = []
        self._image_ids: list[UUID] = []

    def add_recipe_id(self, recipe_id: UUID) -> None:
        with self._lock:
            self._recipe_ids.append(recipe_id)

    def get_random_recipe_id(self) -> UUID | None:
        with self._lock:
            if not self._recipe_ids:
                return None
            return random.choice(self._recipe_ids)

    def pop_random_recipe_id(self) -> UUID | None:
        """Remove and return a random recipe ID (for delete operations)."""
        with self._lock:
            if not self._recipe_ids:
                return None
            idx = random.randrange(len(self._recipe_ids))
            return self._recipe_ids.pop(idx)

    def add_image_id(self, image_id: UUID) -> None:
        with self._lock:
            self._image_ids.append(image_id)

    def get_random_image_id(self) -> UUID | None:
        with self._lock:
            if not self._image_ids:
                return None
            return random.choice(self._image_ids)

    def pop_random_image_id(self) -> UUID | None:
        """Remove and return a random image ID (for delete operations)."""
        with self._lock:
            if not self._image_ids:
                return None
            idx = random.randrange(len(self._image_ids))
            return self._image_ids.pop(idx)


# Module-level singleton, shared across all User instances in one worker
shared_state = SharedState()
