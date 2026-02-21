import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images } = await req.json(); // array of { data: base64, mimeType: string }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build image content parts for the multimodal request
    const imageParts = images.map((img: { data: string; mimeType: string }) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:${img.mimeType};base64,${img.data}`,
      },
    }));

    const systemPrompt = `Tu es un assistant spécialisé dans l'extraction de recettes de cuisine à partir d'images (photos de livres, pages web, fiches recettes).

Pour chaque image ou ensemble d'images fourni, tu dois:

1. **Extraire le texte** (OCR) de toutes les parties textuelles
2. **Structurer les données** dans le format JSON suivant
3. **Détecter les photos du plat** : si l'image contient une photo du plat cuisiné (distincte du texte de la recette), décris sa position et son contenu dans le champ "dishImage"

Retourne UNIQUEMENT un JSON valide (pas de markdown, pas de commentaires) avec cette structure:
{
  "recipes": [
    {
      "title": "Nom de la recette",
      "type": "apéro|entrée|plat|dessert|boisson",
      "season": "printemps|été|automne|hiver",
      "difficulty": "facile|moyen|difficile",
      "servings": 4,
      "prepTime": 30,
      "cookTime": 45,
      "restTime": 0,
      "diets": ["végétarien", "vegan", "sans gluten", "sans lactose"],
      "tags": ["tag1", "tag2"],
      "ingredients": [
        {"name": "Nom", "quantity": "200", "unit": "g"}
      ],
      "steps": [
        {"text": "Description de l'étape"}
      ],
      "variants": "Variantes ou notes optionnelles",
      "dishImage": {
        "detected": true,
        "description": "Photo du plat dressé dans une assiette blanche",
        "position": "right|left|top|bottom|full",
        "cropHint": {"x": 0.5, "y": 0, "width": 0.5, "height": 1.0}
      }
    }
  ]
}

Règles:
- Si tu ne trouves pas une info, utilise une valeur par défaut raisonnable
- Pour les quantités, sépare bien le nombre de l'unité
- Déduis le type, la saison, la difficulté et les régimes alimentaires si non explicites
- Si plusieurs recettes sont sur les images, retourne-les toutes
- Pour dishImage.cropHint, indique les coordonnées normalisées (0-1) pour recadrer la photo du plat
- Si pas de photo de plat détectée, met dishImage.detected à false`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyse ces images et extrais toutes les recettes. Retourne uniquement le JSON structuré.",
                },
                ...imageParts,
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse the JSON from the AI response (strip potential markdown fences)
    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Impossible de parser la réponse IA", rawText: content }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ocr-recipe error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
