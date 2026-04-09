export type SnowMakingCoverage = "none" | "low" | "medium" | "high";
export type Aspect = "north" | "north-east" | "east" | "south-east" | "south" | "south-west" | "west" | "north-west" | "mixed";

export interface Resort {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  baseAltitude: number;   // lowest point of the ski area (m)
  topAltitude: number;    // highest point of the ski area (m)
  primaryAltitude: number; // altitude used for scoring calculations (m)
  aspect: Aspect;
  snowMakingCoverage: SnowMakingCoverage;
  description: string;
}

export const resorts: Resort[] = [
  {
    id: "val-thorens",
    name: "Val Thorens",
    region: "Savoie",
    latitude: 45.2981,
    longitude: 6.5800,
    baseAltitude: 2300,
    topAltitude: 3230,
    primaryAltitude: 2600,
    aspect: "north",
    snowMakingCoverage: "high",
    description: "Highest resort in Europe, snow-sure"
  },
  {
    id: "courchevel",
    name: "Courchevel",
    region: "Savoie",
    latitude: 45.4153,
    longitude: 6.6347,
    baseAltitude: 1300,
    topAltitude: 2740,
    primaryAltitude: 1850,
    aspect: "north-east",
    snowMakingCoverage: "high",
    description: "Luxury resort, part of Les 3 Vallées"
  },
  {
    id: "meribel",
    name: "Méribel",
    region: "Savoie",
    latitude: 45.3967,
    longitude: 6.5656,
    baseAltitude: 1450,
    topAltitude: 2952,
    primaryAltitude: 1800,
    aspect: "mixed",
    snowMakingCoverage: "medium",
    description: "Central hub of Les 3 Vallées"
  },
  {
    id: "la-plagne",
    name: "La Plagne",
    region: "Savoie",
    latitude: 45.5069,
    longitude: 6.6775,
    baseAltitude: 1250,
    topAltitude: 3250,
    primaryAltitude: 2000,
    aspect: "north-west",
    snowMakingCoverage: "medium",
    description: "Large area with glacier skiing"
  },
  {
    id: "les-arcs",
    name: "Les Arcs",
    region: "Savoie",
    latitude: 45.5733,
    longitude: 6.7950,
    baseAltitude: 1200,
    topAltitude: 3226,
    primaryAltitude: 1950,
    aspect: "west",
    snowMakingCoverage: "medium",
    description: "Linked with La Plagne via Paradiski"
  },
  {
    id: "tignes",
    name: "Tignes",
    region: "Savoie",
    latitude: 45.4686,
    longitude: 6.9067,
    baseAltitude: 1550,
    topAltitude: 3456,
    primaryAltitude: 2100,
    aspect: "north",
    snowMakingCoverage: "medium",
    description: "High altitude, snow-sure, glacier access"
  },
  {
    id: "val-disere",
    name: "Val d'Isère",
    region: "Savoie",
    latitude: 45.4481,
    longitude: 6.9806,
    baseAltitude: 1785,
    topAltitude: 3456,
    primaryAltitude: 2200,
    aspect: "north-east",
    snowMakingCoverage: "medium",
    description: "World-class resort, linked with Tignes"
  },
  {
    id: "alpe-dhuez",
    name: "Alpe d'Huez",
    region: "Isère",
    latitude: 45.0919,
    longitude: 6.0681,
    baseAltitude: 1860,
    topAltitude: 3330,
    primaryAltitude: 2100,
    aspect: "south-west",
    snowMakingCoverage: "high",
    description: "Sunny resort with south-facing slopes"
  },
  {
    id: "les-deux-alpes",
    name: "Les 2 Alpes",
    region: "Isère",
    latitude: 45.0167,
    longitude: 6.1222,
    baseAltitude: 1300,
    topAltitude: 3600,
    primaryAltitude: 1800,
    aspect: "north-west",
    snowMakingCoverage: "medium",
    description: "Glacier skiing, good for freestyle"
  },
  {
    id: "chamonix",
    name: "Chamonix Mont-Blanc",
    region: "Haute-Savoie",
    latitude: 45.9237,
    longitude: 6.8694,
    baseAltitude: 1035,
    topAltitude: 3842,
    primaryAltitude: 1900,
    aspect: "north",
    snowMakingCoverage: "low",
    description: "Legendary freeride destination at the foot of Mont Blanc"
  }
];

export function getResortById(id: string): Resort | undefined {
  return resorts.find(r => r.id === id);
}
