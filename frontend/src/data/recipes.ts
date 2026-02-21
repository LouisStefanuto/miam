export type Season = 'printemps' | 'été' | 'automne' | 'hiver';
export type RecipeType = 'apéro' | 'entrée' | 'plat' | 'pâtes' | 'dessert' | 'boisson';
export type Difficulty = 'facile' | 'moyen' | 'difficile';
export type Diet = 'végétarien';

export interface Ingredient {
  name: string;
  quantity: number | string;
  unit: string;
}

export interface Step {
  text: string;
}

export interface Recipe {
  id: string;
  title: string;
  image?: string;
  type: RecipeType;
  season: Season;
  tags: string[];
  rating: number;
  difficulty: Difficulty;
  servings: number;
  prepTime: number; // minutes
  cookTime: number; // minutes
  restTime?: number;
  diets: Diet[];
  ingredients: Ingredient[];
  steps: Step[];
  variants?: string;
  tested: boolean;
  createdAt: string;
  updatedAt: string;
}

export const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Ratatouille Provençale',
    image: 'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=600&h=400&fit=crop',
    type: 'plat',
    season: 'été',
    tags: ['provençal', 'légumes'],
    rating: 5,
    difficulty: 'moyen',
    servings: 4,
    prepTime: 30,
    cookTime: 45,
    diets: ['végétarien'],
    tested: true,
    ingredients: [
      { name: 'Aubergine', quantity: 2, unit: 'pièces' },
      { name: 'Courgette', quantity: 3, unit: 'pièces' },
      { name: 'Poivron rouge', quantity: 2, unit: 'pièces' },
      { name: 'Tomates', quantity: 4, unit: 'pièces' },
      { name: 'Oignon', quantity: 1, unit: 'pièce' },
      { name: "Huile d'olive", quantity: 4, unit: 'c. à soupe' },
      { name: 'Herbes de Provence', quantity: 2, unit: 'c. à café' },
    ],
    steps: [
      { text: 'Coupez tous les légumes en dés réguliers.' },
      { text: "Faites revenir l'oignon dans l'huile d'olive." },
      { text: 'Ajoutez les aubergines et les poivrons, laissez cuire 10 min.' },
      { text: 'Ajoutez les courgettes et les tomates.' },
      { text: 'Assaisonnez avec les herbes de Provence, sel et poivre.' },
      { text: 'Laissez mijoter à feu doux pendant 45 minutes.' },
    ],
    createdAt: '2025-06-15',
    updatedAt: '2025-06-15',
  },
  {
    id: '2',
    title: 'Tarte aux Pommes Caramélisées',
    image: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=600&h=400&fit=crop',
    type: 'dessert',
    season: 'automne',
    tags: ['tarte', 'pommes', 'caramel'],
    rating: 4,
    difficulty: 'moyen',
    servings: 8,
    prepTime: 40,
    cookTime: 35,
    diets: ['végétarien'],
    tested: true,
    ingredients: [
      { name: 'Pâte feuilletée', quantity: 1, unit: 'rouleau' },
      { name: 'Pommes Golden', quantity: 6, unit: 'pièces' },
      { name: 'Beurre', quantity: 80, unit: 'g' },
      { name: 'Sucre', quantity: 150, unit: 'g' },
      { name: 'Cannelle', quantity: 1, unit: 'c. à café' },
    ],
    steps: [
      { text: 'Préchauffez le four à 200°C.' },
      { text: 'Pelez et coupez les pommes en quartiers.' },
      { text: 'Faites un caramel avec le beurre et le sucre.' },
      { text: 'Disposez les pommes dans le caramel.' },
      { text: 'Recouvrez de pâte feuilletée et enfournez 35 min.' },
      { text: 'Retournez la tarte à la sortie du four.' },
    ],
    createdAt: '2025-09-20',
    updatedAt: '2025-10-01',
  },
  {
    id: '3',
    title: 'Soupe de Potimarron',
    image: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&h=400&fit=crop',
    type: 'entrée',
    season: 'automne',
    tags: ['soupe', 'réconfort'],
    rating: 4,
    difficulty: 'facile',
    servings: 6,
    prepTime: 15,
    cookTime: 30,
    diets: ['végétarien'],
    tested: false,
    ingredients: [
      { name: 'Potimarron', quantity: 1, unit: 'kg' },
      { name: 'Oignon', quantity: 1, unit: 'pièce' },
      { name: 'Crème de coco', quantity: 200, unit: 'ml' },
      { name: 'Bouillon de légumes', quantity: 500, unit: 'ml' },
      { name: 'Gingembre', quantity: 1, unit: 'c. à café' },
    ],
    steps: [
      { text: 'Épluchez et coupez le potimarron en morceaux.' },
      { text: "Faites revenir l'oignon émincé." },
      { text: 'Ajoutez le potimarron et le bouillon.' },
      { text: 'Laissez cuire 30 minutes.' },
      { text: 'Mixez et ajoutez la crème de coco et le gingembre.' },
    ],
    createdAt: '2025-10-05',
    updatedAt: '2025-10-05',
  },
  {
    id: '4',
    title: 'Mojito Classique',
    image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=400&fit=crop',
    type: 'boisson',
    season: 'été',
    tags: ['cocktail', 'rhum', 'menthe'],
    rating: 5,
    difficulty: 'facile',
    servings: 1,
    prepTime: 5,
    cookTime: 0,
    diets: [],
    tested: true,
    ingredients: [
      { name: 'Rhum blanc', quantity: 6, unit: 'cl' },
      { name: 'Citron vert', quantity: 1, unit: 'pièce' },
      { name: 'Menthe fraîche', quantity: 10, unit: 'feuilles' },
      { name: 'Sucre de canne', quantity: 2, unit: 'c. à café' },
      { name: 'Eau gazeuse', quantity: 10, unit: 'cl' },
    ],
    steps: [
      { text: 'Coupez le citron vert en quartiers.' },
      { text: 'Pilez les feuilles de menthe avec le sucre et le citron.' },
      { text: 'Ajoutez le rhum et les glaçons.' },
      { text: "Complétez avec l'eau gazeuse." },
    ],
    createdAt: '2025-07-10',
    updatedAt: '2025-07-10',
  },
  {
    id: '5',
    title: 'Blanquette de Veau',
    image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=600&h=400&fit=crop',
    type: 'plat',
    season: 'hiver',
    tags: ['tradition', 'mijoté'],
    rating: 5,
    difficulty: 'difficile',
    servings: 6,
    prepTime: 30,
    cookTime: 90,
    diets: [],
    tested: true,
    ingredients: [
      { name: 'Épaule de veau', quantity: 1, unit: 'kg' },
      { name: 'Carottes', quantity: 4, unit: 'pièces' },
      { name: 'Champignons', quantity: 250, unit: 'g' },
      { name: 'Crème fraîche', quantity: 200, unit: 'ml' },
      { name: 'Jaune d\'œuf', quantity: 2, unit: 'pièces' },
      { name: 'Bouquet garni', quantity: 1, unit: 'pièce' },
    ],
    steps: [
      { text: 'Coupez le veau en morceaux et faites blanchir.' },
      { text: 'Ajoutez les carottes et le bouquet garni.' },
      { text: 'Laissez mijoter 1h30.' },
      { text: 'Préparez la sauce avec la crème et les jaunes d\'œufs.' },
      { text: 'Nappez la viande de sauce.' },
    ],
    createdAt: '2025-01-15',
    updatedAt: '2025-02-01',
  },
  {
    id: '6',
    title: 'Bruschetta Tomate-Basilic',
    image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&h=400&fit=crop',
    type: 'apéro',
    season: 'été',
    tags: ['italien', 'apéritif'],
    rating: 4,
    difficulty: 'facile',
    servings: 4,
    prepTime: 15,
    cookTime: 5,
    diets: ['végétarien'],
    tested: false,
    ingredients: [
      { name: 'Pain de campagne', quantity: 8, unit: 'tranches' },
      { name: 'Tomates', quantity: 4, unit: 'pièces' },
      { name: 'Basilic frais', quantity: 1, unit: 'bouquet' },
      { name: "Huile d'olive", quantity: 3, unit: 'c. à soupe' },
      { name: 'Ail', quantity: 2, unit: 'gousses' },
    ],
    steps: [
      { text: 'Grillez les tranches de pain.' },
      { text: "Frottez avec l'ail." },
      { text: 'Coupez les tomates en dés.' },
      { text: "Mélangez avec l'huile d'olive et le basilic." },
      { text: 'Garnissez les tranches de pain.' },
    ],
    createdAt: '2025-07-01',
    updatedAt: '2025-07-01',
  },
  {
    id: '7',
    title: 'Salade de Quinoa Printanière',
    image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&h=400&fit=crop',
    type: 'entrée',
    season: 'printemps',
    tags: ['salade', 'healthy'],
    rating: 4,
    difficulty: 'facile',
    servings: 4,
    prepTime: 20,
    cookTime: 15,
    diets: ['végétarien'],
    tested: true,
    ingredients: [
      { name: 'Quinoa', quantity: 200, unit: 'g' },
      { name: 'Petits pois', quantity: 150, unit: 'g' },
      { name: 'Radis', quantity: 6, unit: 'pièces' },
      { name: 'Menthe', quantity: 1, unit: 'bouquet' },
      { name: 'Citron', quantity: 1, unit: 'pièce' },
    ],
    steps: [
      { text: 'Cuisez le quinoa selon les instructions.' },
      { text: 'Faites blanchir les petits pois.' },
      { text: 'Coupez les radis en rondelles.' },
      { text: 'Mélangez le tout avec la menthe ciselée.' },
      { text: 'Assaisonnez avec le jus de citron et l\'huile d\'olive.' },
    ],
    createdAt: '2025-04-10',
    updatedAt: '2025-04-10',
  },
  {
    id: '8',
    title: 'Chocolat Chaud Épicé',
    image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&h=400&fit=crop',
    type: 'boisson',
    season: 'hiver',
    tags: ['chocolat', 'réconfort'],
    rating: 5,
    difficulty: 'facile',
    servings: 2,
    prepTime: 5,
    cookTime: 10,
    diets: ['végétarien'],
    tested: false,
    ingredients: [
      { name: 'Chocolat noir 70%', quantity: 100, unit: 'g' },
      { name: 'Lait entier', quantity: 400, unit: 'ml' },
      { name: 'Cannelle', quantity: 1, unit: 'bâton' },
      { name: 'Piment d\'Espelette', quantity: 1, unit: 'pincée' },
      { name: 'Chantilly', quantity: '', unit: 'pour servir' },
    ],
    steps: [
      { text: 'Faites chauffer le lait avec la cannelle.' },
      { text: 'Ajoutez le chocolat cassé en morceaux.' },
      { text: 'Fouettez jusqu\'à obtenir un mélange lisse.' },
      { text: 'Ajoutez le piment d\'Espelette.' },
      { text: 'Servez avec de la chantilly.' },
    ],
    createdAt: '2025-12-01',
    updatedAt: '2025-12-01',
  },
];
