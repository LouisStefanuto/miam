import { describe, it, expect } from "vitest";
import { aggregateIngredients, generateShoppingListText, mergeIngredients, servingsFor } from "@/lib/shopping-list";
import type { Recipe } from "@/data/recipes";

function makeRecipe(id: string, servings: number, ingredients: Recipe["ingredients"]): Recipe {
  return {
    id,
    title: `Recette ${id}`,
    description: "",
    type: "plat",
    season: null,
    tags: [],
    rating: 0,
    difficulty: "facile",
    servings,
    prepTime: 0,
    cookTime: 0,
    diets: [],
    ingredients,
    steps: [],
    tested: false,
    createdAt: "",
    updatedAt: "",
  };
}

describe("servingsFor", () => {
  it("falls back to the recipe's own servings", () => {
    const recipe = makeRecipe("a", 4, []);
    expect(servingsFor(recipe, {})).toBe(4);
    expect(servingsFor(recipe, { a: 6 })).toBe(6);
  });
});

describe("aggregateIngredients", () => {
  const recipe = makeRecipe("a", 4, [
    { name: "Beurre", quantity: 200, unit: "g" },
    { name: "Oeufs", quantity: 3, unit: "" },
  ]);

  it("keeps quantities untouched at the recipe's own servings", () => {
    const [beurre, oeufs] = aggregateIngredients([recipe], {});
    expect(beurre.details).toBe("200 g");
    expect(oeufs.details).toBe("3");
  });

  it("scales quantities to the chosen servings", () => {
    const [beurre] = aggregateIngredients([recipe], { a: 6 });
    expect(beurre.details).toBe("300 g");
  });

  it("rounds to two decimals instead of leaking float noise", () => {
    const [beurre] = aggregateIngredients([recipe], { a: 3 });
    expect(beurre.details).toBe("150 g");

    const third = aggregateIngredients([makeRecipe("b", 3, [{ name: "Farine", quantity: 100, unit: "g" }])], { b: 1 });
    expect(third[0].details).toBe("33.33 g");
  });

  it("sums the same ingredient across recipes, each at its own scale", () => {
    const other = makeRecipe("b", 2, [{ name: "beurre", quantity: 50, unit: "g" }]);
    const [beurre] = aggregateIngredients([recipe, other], { a: 8, b: 4 });
    // 200 g doubled + 50 g doubled
    expect(beurre.details).toBe("500 g");
  });

  it("keeps units apart and pluralizes them", () => {
    const withUnits = makeRecipe("c", 1, [
      { name: "Lait", quantity: 1, unit: "L" },
      { name: "Lait", quantity: 2, unit: "tasse" },
    ]);
    const [lait] = aggregateIngredients([withUnits], {});
    expect(lait.details).toBe("1 L + 2 tasses");
  });

  it("keeps ingredients without a quantity", () => {
    const vague = makeRecipe("d", 4, [{ name: "Sel", quantity: "", unit: "" }]);
    const [sel] = aggregateIngredients([vague], { d: 8 });
    expect(sel.name).toBe("Sel");
    expect(sel.details).toBe("");
  });
});

describe("generateShoppingListText", () => {
  const recipe = makeRecipe("a", 4, [{ name: "Beurre", quantity: 200, unit: "g" }]);

  it("reports the chosen servings and the checked state", () => {
    const ingredients = aggregateIngredients([recipe], { a: 6 });
    const text = generateShoppingListText(recipe ? [recipe] : [], ingredients, new Set(["beurre"]), { a: 6 });
    expect(text).toContain("- Recette a (6 pers.)");
    expect(text).toContain("[x] 300 g Beurre");
  });

  it("skips the recipe block for a hand-written list", () => {
    const text = generateShoppingListText([], [{ id: "manual:1", name: "Sacs poubelle", details: "" }], new Set());
    expect(text).not.toContain("Recettes");
    expect(text).toContain("[ ] Sacs poubelle");
  });
});

describe("mergeIngredients", () => {
  const ing = (id: string, name = id, details = "") => ({ id, name, details });

  it("keeps the user's order and appends the new ingredients", () => {
    const previous = [ing("beurre"), ing("farine")];
    const raw = [ing("farine"), ing("beurre"), ing("oeuf")];
    expect(mergeIngredients(previous, raw, new Set()).map((i) => i.id)).toEqual([
      "beurre",
      "farine",
      "oeuf",
    ]);
  });

  it("refreshes the name and quantities of the ingredients already listed", () => {
    const previous = [ing("beurre", "Beurre", "200 g")];
    const raw = [ing("beurre", "Beurre", "300 g")];
    expect(mergeIngredients(previous, raw, new Set())[0].details).toBe("300 g");
  });

  it("does not bring back an ingredient the user removed", () => {
    const raw = [ing("beurre"), ing("farine")];
    const merged = mergeIngredients([ing("farine")], raw, new Set(["beurre"]));
    expect(merged.map((i) => i.id)).toEqual(["farine"]);
  });

  it("drops the ingredients no recipe provides anymore", () => {
    const merged = mergeIngredients([ing("beurre"), ing("farine")], [ing("farine")], new Set());
    expect(merged.map((i) => i.id)).toEqual(["farine"]);
  });
});

describe("mergeIngredients referential stability", () => {
  it("returns the same array when nothing changed", () => {
    const previous = [{ id: "beurre", name: "Beurre", details: "200 g" }];
    const raw = [{ id: "beurre", name: "Beurre", details: "200 g" }];
    expect(mergeIngredients(previous, raw, new Set())).toBe(previous);
  });
});
