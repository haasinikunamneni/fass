export interface NavItem {
  label: string;
  href: string;
}

export const primaryNav: NavItem[] = [
  { label: "Collections", href: "#collections" },
  { label: "The Gemstones", href: "#gemstones" },
  { label: "Our Story", href: "#story" },
];

export const searchSuggestions = ["Emerald", "Sapphire", "Ruby", "Diamond"];
