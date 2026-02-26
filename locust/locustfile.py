"""Locust load test for the Miam recipe management API."""

from uuid import UUID

from helpers.factories import (
    TINY_PNG,
    build_list_params,
    build_recipe_payload,
    build_search_params,
    build_update_payload,
)
from helpers.shared_state import shared_state

from locust import HttpUser, between, task


class MiamUser(HttpUser):
    """Simulated user interacting with the Miam recipe API.

    Traffic distribution: ~79% reads, ~15% writes, ~6% deletes + exports.
    Create:delete ratio is 5:1 so the data pool grows over time.
    """

    wait_time = between(1, 3)

    def on_start(self) -> None:
        """Seed initial recipes when a user spawns."""
        for _ in range(3):
            payload = build_recipe_payload()
            with self.client.post(
                "/api/recipes",
                json=payload,
                catch_response=True,
                name="POST /api/recipes [seed]",
            ) as resp:
                if resp.status_code == 201:
                    recipe_id = UUID(resp.json()["id"])
                    shared_state.add_recipe_id(recipe_id)
                else:
                    resp.failure(f"Seed failed: {resp.status_code}")

    # --- Read-heavy tasks ---

    @task(20)
    def list_recipes(self) -> None:
        params = build_list_params()
        self.client.get("/api/recipes", params=params, name="GET /api/recipes")

    @task(15)
    def search_recipes(self) -> None:
        params = build_search_params()
        self.client.get(
            "/api/recipes/search", params=params, name="GET /api/recipes/search"
        )

    @task(10)
    def get_recipe(self) -> None:
        recipe_id = shared_state.get_random_recipe_id()
        if recipe_id is None:
            return
        with self.client.get(
            f"/api/recipes/{recipe_id}",
            catch_response=True,
            name="GET /api/recipes/{id}",
        ) as resp:
            if resp.status_code == 404:
                resp.success()  # Deleted by another user concurrently

    @task(5)
    def health_check(self) -> None:
        self.client.get("/", name="GET /")

    # --- Write tasks ---

    @task(5)
    def create_recipe(self) -> None:
        payload = build_recipe_payload()
        with self.client.post(
            "/api/recipes", json=payload, catch_response=True, name="POST /api/recipes"
        ) as resp:
            if resp.status_code == 201:
                recipe_id = UUID(resp.json()["id"])
                shared_state.add_recipe_id(recipe_id)
            else:
                resp.failure(f"Create failed: {resp.status_code} {resp.text}")

    @task(2)
    def update_recipe(self) -> None:
        recipe_id = shared_state.get_random_recipe_id()
        if recipe_id is None:
            return
        payload = build_update_payload()
        with self.client.put(
            f"/api/recipes/{recipe_id}",
            json=payload,
            catch_response=True,
            name="PUT /api/recipes/{id}",
        ) as resp:
            if resp.status_code == 404:
                resp.success()

    @task(1)
    def delete_recipe(self) -> None:
        recipe_id = shared_state.pop_random_recipe_id()
        if recipe_id is None:
            return
        with self.client.delete(
            f"/api/recipes/{recipe_id}",
            catch_response=True,
            name="DELETE /api/recipes/{id}",
        ) as resp:
            if resp.status_code in (204, 404):
                resp.success()

    # # --- Image tasks ---

    @task(3)
    def upload_image(self) -> None:
        recipe_id = shared_state.get_random_recipe_id()
        if recipe_id is None:
            return
        with self.client.post(
            "/api/images",
            data={"recipe_id": str(recipe_id)},
            files={"image": ("test.png", TINY_PNG, "image/png")},
            catch_response=True,
            name="POST /api/images",
        ) as resp:
            if resp.status_code == 201:
                image_id = UUID(resp.json()["image_id"])
                shared_state.add_image_id(image_id)
            elif resp.status_code == 404:
                resp.success()  # Recipe was deleted

    @task(3)
    def get_image(self) -> None:
        image_id = shared_state.get_random_image_id()
        if image_id is None:
            return
        with self.client.get(
            f"/api/images/{image_id}",
            catch_response=True,
            name="GET /api/images/{id}",
        ) as resp:
            if resp.status_code == 404:
                resp.success()

    @task(1)
    def delete_image(self) -> None:
        image_id = shared_state.pop_random_image_id()
        if image_id is None:
            return
        with self.client.delete(
            f"/api/images/{image_id}",
            catch_response=True,
            name="DELETE /api/images/{id}",
        ) as resp:
            if resp.status_code in (204, 404):
                resp.success()

    # # --- Export tasks (rare, expensive) ---

    @task(1)
    def export_markdown(self) -> None:
        self.client.post("/api/export/markdown", name="POST /api/export/markdown")

    @task(1)
    def export_word(self) -> None:
        self.client.post("/api/export/word", name="POST /api/export/word")
