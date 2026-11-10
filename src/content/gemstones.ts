import type { GemId } from "@/lib/gemShapes";

/**
 * Editable content for "The World of Gemstones".
 * Copy, facts and colours live here, not in components. Order = display order.
 */
export interface Gemstone {
  id: GemId;
  name: string;
  /** Mineral family, shown as the kicker */
  mineral: string;
  /** Cut shown in the exhibit (illustrative) */
  cut: string;
  /** Short editorial introduction */
  intro: string;
  /** Longer text for the discover panel */
  story: string[];
  facts: Array<{ label: string; value: string }>;
  theme: {
    /** Atmosphere glow and deep background (hex) */
    glow: string;
    deep: string;
    /** UI accent for this stone */
    accent: string;
    /** 3D key light and rim light colours */
    key: string;
    rim: string;
    /** Fallback SVG facet colouring (HSL ranges) */
    hue: number;
    sat: number;
    lMin: number;
    lMax: number;
  };
}

export const exhibit = {
  eyebrow: "Chapter II · The Exhibition",
  titleLead: "The World of",
  titleEmphasis: "Gemstones",
  discoverLabel: "Discover More",
};

export const GEMSTONES: Gemstone[] = [
  {
    id: "emerald",
    name: "Emerald",
    mineral: "Beryl",
    cut: "Emerald cut",
    intro:
      "Formed in the quiet depths of the earth, emerald carries the intensity of living green.",
    story: [
      "Emerald is the green variety of beryl, coloured by trace amounts of chromium and sometimes vanadium. It forms under rare geological conditions, which is part of why fine crystals are so scarce.",
      "Almost every emerald holds a fine interior landscape of inclusions, known as its jardin. Cutters read it carefully, and it is treated as the stone's signature rather than a flaw.",
    ],
    facts: [
      { label: "Mineral", value: "Beryl" },
      { label: "Hardness", value: "7.5 – 8 Mohs" },
      { label: "Refractive index", value: "1.57 – 1.58" },
      { label: "Classic sources", value: "Colombia, Zambia, Brazil" },
    ],
    theme: {
      glow: "#108c5e",
      deep: "#0a1f17",
      accent: "#3dd69b",
      key: "#3df0a2",
      rim: "#f2dcae",
      hue: 156,
      sat: 70,
      lMin: 13,
      lMax: 37,
    },
  },
  {
    id: "ruby",
    name: "Ruby",
    mineral: "Corundum",
    cut: "Oval cut",
    intro: "A rare expression of fire, colour and enduring fascination.",
    story: [
      "Ruby is the red variety of corundum, its colour owed to chromium. The same element that gives it colour also lets the finest stones glow with a warmth that seems to come from within.",
      "After diamond, corundum is the hardest of the natural gemstones, which is why a ruby can be worn daily for generations and still be passed on.",
    ],
    facts: [
      { label: "Mineral", value: "Corundum" },
      { label: "Hardness", value: "9 Mohs" },
      { label: "Refractive index", value: "1.76 – 1.77" },
      { label: "Classic sources", value: "Myanmar, Mozambique, Thailand" },
    ],
    theme: {
      glow: "#b5123a",
      deep: "#2a050d",
      accent: "#ff5a7d",
      key: "#ff3d6b",
      rim: "#ffd9b0",
      hue: 346,
      sat: 78,
      lMin: 12,
      lMax: 38,
    },
  },
  {
    id: "sapphire",
    name: "Sapphire",
    mineral: "Corundum",
    cut: "Pear cut",
    intro: "An extraordinary depth of blue, shaped by time and nature.",
    story: [
      "Sapphire is corundum in every colour except red. Its celebrated blue comes from traces of iron and titanium within the crystal, and the most admired stones are a deep, velvety blue.",
      "Its steady hardness and clarity make it as dependable as it is beautiful, a stone that holds its colour and its polish across a lifetime.",
    ],
    facts: [
      { label: "Mineral", value: "Corundum" },
      { label: "Hardness", value: "9 Mohs" },
      { label: "Refractive index", value: "1.76 – 1.77" },
      { label: "Classic sources", value: "Kashmir, Sri Lanka, Madagascar" },
    ],
    theme: {
      glow: "#1c3fb0",
      deep: "#060d2b",
      accent: "#6f94ff",
      key: "#4f7bff",
      rim: "#cfe0ff",
      hue: 224,
      sat: 72,
      lMin: 13,
      lMax: 40,
    },
  },
  {
    id: "diamond",
    name: "Diamond",
    mineral: "Carbon",
    cut: "Round brilliant",
    intro: "Light captured in its most extraordinary form.",
    story: [
      "Diamond is pure carbon, crystallised deep within the earth and carried to the surface long ago. It is the hardest natural material known.",
      "A brilliant cut is geometry in service of light: every facet is angled to return what enters the stone back to the eye as brightness, and to scatter the rest as flashes of colour.",
    ],
    facts: [
      { label: "Mineral", value: "Carbon" },
      { label: "Hardness", value: "10 Mohs" },
      { label: "Refractive index", value: "2.42" },
      { label: "Classic sources", value: "Botswana, Russia, Canada" },
    ],
    theme: {
      glow: "#8fb4c8",
      deep: "#0d1418",
      accent: "#e9f4fb",
      key: "#dff4ff",
      rim: "#fff6e0",
      hue: 200,
      sat: 28,
      lMin: 22,
      lMax: 70,
    },
  },
];
