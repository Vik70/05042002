export type IngredientId =
  | "moonpetal"
  | "spiritDew"
  | "foxglove"
  | "emberLeaf"
  | "silverMoss"
  | "nightPearl"
  | "dawnMint"
  | "starAnther"
  | "echoRoot"
  | "mistBerry";

export interface IngredientDefinition {
  id: IngredientId;
  name: string;
  tint: number;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  ingredients: IngredientId[];
  difficulty: number;
}

export const INGREDIENTS: IngredientDefinition[] = [
  { id: "moonpetal", name: "Moonpetal", tint: 0xf8b4c8 },
  { id: "spiritDew", name: "Spirit Dew", tint: 0x6ec6ff },
  { id: "foxglove", name: "Foxglove", tint: 0xc56cf0 },
  { id: "emberLeaf", name: "Ember Leaf", tint: 0xf5a623 },
  { id: "silverMoss", name: "Silver Moss", tint: 0xdfe6e9 },
  { id: "nightPearl", name: "Night Pearl", tint: 0x7f8cff },
  { id: "dawnMint", name: "Dawn Mint", tint: 0x8ce99a },
  { id: "starAnther", name: "Star Anther", tint: 0xf7f1a7 },
  { id: "echoRoot", name: "Echo Root", tint: 0xb08968 },
  { id: "mistBerry", name: "Mist Berry", tint: 0x74b9ff },
];

export const RECIPES: RecipeDefinition[] = [
  {
    id: "moonpetal-salve",
    name: "Memory of Moonpetal",
    ingredients: ["moonpetal", "spiritDew"],
    difficulty: 1,
  },
  {
    id: "lantern-elixir",
    name: "Lantern's Recollection",
    ingredients: ["emberLeaf", "silverMoss"],
    difficulty: 1,
  },
  {
    id: "foxfire-tonic",
    name: "Foxfire Remembrance",
    ingredients: ["moonpetal", "foxglove", "nightPearl"],
    difficulty: 2,
  },
  {
    id: "stillwater-cure",
    name: "Stillwater Recall",
    ingredients: ["spiritDew", "dawnMint", "mistBerry"],
    difficulty: 2,
  },
  {
    id: "whisper-balm",
    name: "Whispered Keepsake",
    ingredients: ["echoRoot", "silverMoss", "moonpetal"],
    difficulty: 2,
  },
  {
    id: "starlit-remedy",
    name: "Starlit Recollection",
    ingredients: ["starAnther", "spiritDew", "nightPearl", "foxglove"],
    difficulty: 3,
  },
  {
    id: "sacred-revival",
    name: "Sacred Recall",
    ingredients: ["emberLeaf", "moonpetal", "dawnMint", "mistBerry"],
    difficulty: 3,
  },
  {
    id: "guardian-incense",
    name: "Guardian's Memory",
    ingredients: ["silverMoss", "echoRoot", "starAnther", "nightPearl"],
    difficulty: 3,
  },
  {
    id: "celestial-restoration",
    name: "Celestial Remembering",
    ingredients: ["moonpetal", "spiritDew", "starAnther", "dawnMint", "mistBerry"],
    difficulty: 4,
  },
  {
    id: "champions-brew",
    name: "Champion's Echo",
    ingredients: ["foxglove", "nightPearl", "echoRoot", "spiritDew", "emberLeaf"],
    difficulty: 4,
  },
];
