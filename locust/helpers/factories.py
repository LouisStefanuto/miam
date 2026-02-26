"""Realistic payload generators for Miam API load testing."""

import random

# Values accepted by Pydantic schemas (enum values, used for create/update payloads)
CATEGORIES = ["apero", "entree", "plat", "dessert", "boisson", "gouter", "pâtes"]
# Values stored in PostgreSQL enum (enum member names, used for search query params)
CATEGORIES_DB = ["apero", "entree", "plat", "dessert", "boisson", "gouter", "pates"]
SEASONS = ["winter", "spring", "summer", "autumn"]
SOURCE_TYPES = ["manual", "instagram", "url", "photo"]

# Realistic French recipe data
RECIPE_TITLES = [
    "Tarte aux pommes",
    "Ratatouille",
    "Quiche lorraine",
    "Croque-monsieur",
    "Salade nicoise",
    "Bouillabaisse",
    "Crepes suzette",
    "Coq au vin",
    "Gratin dauphinois",
    "Mousse au chocolat",
    "Soupe a l'oignon",
    "Gateau basque",
    "Pissaladiere",
    "Flamiche",
    "Clafoutis",
    "Blanquette de veau",
    "Pot-au-feu",
    "Cassoulet",
    "Boeuf bourguignon",
    "Souffle au fromage",
]

INGREDIENTS = [
    ("Farine", "g", 100, 500),
    ("Beurre", "g", 10, 200),
    ("Oeufs", None, 1, 6),
    ("Lait", "ml", 100, 500),
    ("Sel", "pincee", 1, 3),
    ("Poivre", "pincee", 1, 2),
    ("Sucre", "g", 10, 200),
    ("Huile d'olive", "cl", 1, 10),
    ("Oignon", None, 1, 4),
    ("Ail", "gousse", 1, 5),
    ("Tomate", None, 1, 6),
    ("Pomme de terre", None, 2, 8),
    ("Carotte", None, 1, 5),
    ("Courgette", None, 1, 4),
    ("Creme fraiche", "cl", 5, 30),
    ("Fromage rape", "g", 50, 200),
]

PREPARATION_STEPS = [
    "Prechauffer le four a 180 degres.",
    "Melanger les ingredients secs.",
    "Incorporer les oeufs un a un.",
    "Ajouter le lait progressivement.",
    "Faire revenir les oignons dans l'huile.",
    "Assaisonner avec sel et poivre.",
    "Enfourner pendant 30 minutes.",
    "Laisser reposer 10 minutes avant de servir.",
    "Couper les legumes en des.",
    "Faire fondre le beurre a feu doux.",
]

TAGS = [
    "facile",
    "rapide",
    "familial",
    "traditionnel",
    "leger",
    "gourmand",
    "veggie",
    "fete",
]


def build_recipe_payload() -> dict:
    """Generate a realistic recipe creation payload."""
    num_ingredients = random.randint(3, 8)
    ingredients = []
    for i, (name, unit, qty_min, qty_max) in enumerate(
        random.sample(INGREDIENTS, num_ingredients)
    ):
        ing: dict = {"name": name, "display_order": i}
        if unit:
            ing["unit"] = unit
        ing["quantity"] = random.randint(qty_min, qty_max)
        ingredients.append(ing)

    num_steps = random.randint(3, 6)
    preparation = random.sample(PREPARATION_STEPS, num_steps)
    num_tags = random.randint(0, 3)
    tags = random.sample(TAGS, num_tags)

    season = random.choice(SEASONS + [None])

    return {
        "title": f"{random.choice(RECIPE_TITLES)} #{random.randint(1, 9999)}",
        "description": "Une delicieuse recette.",
        "category": random.choice(CATEGORIES),
        "season": season,
        "is_veggie": random.choice([True, False]),
        "difficulty": random.randint(1, 3),
        "prep_time_minutes": random.choice([10, 15, 20, 30, 45, 60]),
        "cook_time_minutes": random.choice([None, 10, 20, 30, 45, 60, 90]),
        "rest_time_minutes": random.choice([None, 0, 10, 30, 60]),
        "number_of_people": random.choice([None, 2, 4, 6, 8]),
        "rate": random.choice([None, 1, 2, 3, 4, 5]),
        "tested": random.choice([True, False]),
        "tags": tags,
        "preparation": preparation,
        "ingredients": ingredients,
        "sources": _build_sources(),
        "images": [],
    }


def _build_sources() -> list[dict]:
    """Generate 0-2 random sources."""
    count = random.randint(0, 2)
    sources = []
    for _ in range(count):
        source_type = random.choice(SOURCE_TYPES)
        if source_type == "url":
            raw = f"https://example.com/recipe/{random.randint(1, 1000)}"
        elif source_type == "instagram":
            raw = f"@chef_{random.choice(['marie', 'pierre', 'jean', 'claire'])}"
        else:
            raw = "Recette de famille"
        sources.append({"type": source_type, "raw_content": raw})
    return sources


def build_update_payload() -> dict:
    """Generate a recipe update payload (same as create, minus images)."""
    payload = build_recipe_payload()
    del payload["images"]
    return payload


def build_search_params() -> dict:
    """Generate random search filter combinations."""
    params: dict = {}
    if random.random() < 0.3:
        params["title"] = random.choice(RECIPE_TITLES).split()[0]
    if random.random() < 0.4:
        params["category"] = random.choice(CATEGORIES_DB)
    if random.random() < 0.3:
        params["is_veggie"] = random.choice([True, False])
    if random.random() < 0.3:
        params["season"] = random.choice(SEASONS)
    params["limit"] = random.choice([10, 20, 50])
    params["offset"] = random.choice([0, 0, 0, 10, 20])
    return params


def build_list_params() -> dict:
    """Generate random pagination parameters."""
    return {
        "limit": random.choice([10, 20, 50, 100]),
        "offset": random.choice([0, 0, 0, 0, 10, 20, 50]),
    }


# Minimal valid 1x1 pixel red PNG (no file I/O needed for image upload tests)
TINY_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00"
    b"\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00"
    b"\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
)
