export interface PalettePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

export interface FontPair {
  id: string;
  heading: string;
  body: string;
  label: string;
}

export const PALETTE_PRESETS: PalettePreset[] = [
  { id: "ocean", name: "Ocean", primary: "#0077B6", secondary: "#00B4D8", accent: "#90E0EF", bg: "#03045E", text: "#CAF0F8" },
  { id: "sunset", name: "Sunset", primary: "#FF6B35", secondary: "#F7C59F", accent: "#EFEFD0", bg: "#1A1423", text: "#F0E6D3" },
  { id: "forest", name: "Forest", primary: "#2D6A4F", secondary: "#52B788", accent: "#95D5B2", bg: "#1B2A1B", text: "#D8F3DC" },
  { id: "midnight", name: "Midnight", primary: "#6366F1", secondary: "#818CF8", accent: "#A5B4FC", bg: "#0F172A", text: "#E2E8F0" },
  { id: "warmEarth", name: "Warm Earth", primary: "#BC6C25", secondary: "#DDA15E", accent: "#FEFAE0", bg: "#283618", text: "#FEFAE0" },
  { id: "neon", name: "Neon", primary: "#F72585", secondary: "#7209B7", accent: "#4CC9F0", bg: "#10002B", text: "#E0AAFF" },
  { id: "pastel", name: "Pastel", primary: "#FFB5A7", secondary: "#FCD5CE", accent: "#F8EDEB", bg: "#1E1E2E", text: "#FFF1E6" },
  { id: "mono", name: "Monochrome", primary: "#F8F9FA", secondary: "#ADB5BD", accent: "#6C757D", bg: "#212529", text: "#E9ECEF" },
];

export const FONT_PAIRS: FontPair[] = [
  { id: "inter", heading: "Inter", body: "Inter", label: "Inter (Clean Modern)" },
  { id: "playfair-source", heading: "Playfair Display", body: "Source Sans 3", label: "Playfair + Source Sans (Elegant)" },
  { id: "space-dm", heading: "Space Grotesk", body: "DM Sans", label: "Space Grotesk + DM Sans (Tech)" },
  { id: "poppins", heading: "Poppins", body: "Poppins", label: "Poppins (Friendly)" },
  { id: "montserrat-open", heading: "Montserrat", body: "Open Sans", label: "Montserrat + Open Sans (Professional)" },
  { id: "raleway-lato", heading: "Raleway", body: "Lato", label: "Raleway + Lato (Sophisticated)" },
  { id: "bricolage-inter", heading: "Bricolage Grotesque", body: "Inter", label: "Bricolage + Inter (Bold)" },
  { id: "merriweather-roboto", heading: "Merriweather", body: "Roboto", label: "Merriweather + Roboto (Editorial)" },
];

export const SITE_SECTIONS = [
  "hero",
  "about",
  "services",
  "gallery",
  "testimonials",
  "cta",
  "footer",
  "other",
] as const;

export type SiteSection = (typeof SITE_SECTIONS)[number];
