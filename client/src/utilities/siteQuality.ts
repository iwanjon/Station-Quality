/**
 * utilities/siteQuality.ts
 * Shared constants and helper functions for Site Quality evaluation and badge styling.
 */

// Mapping dictionary for Site Quality from external API (English) to standardized Indonesian
export const SITE_QUALITY_MAP: Record<string, string> = {
  "Very Good": "Sangat Baik",
  "Good": "Baik",
  "Fair": "Cukup Baik",
  "Poor": "Buruk",
  "-": "-",
};

/**
 * Normalizes Site Quality value to standardized Indonesian.
 */
export const normalizeSiteQuality = (rawQuality?: string | null): string => {
  if (!rawQuality || rawQuality === "-" || rawQuality === "null") return "-";
  return SITE_QUALITY_MAP[rawQuality] || rawQuality;
};

/**
 * Returns consistent Tailwind style class for Site Quality badges matching StationQuality and StationDaily.
 */
export const getSiteQualityBadgeStyle = (quality: string): string => {
  switch (quality) {
    case "Sangat Baik":
      return "bg-emerald-100 text-emerald-800";
    case "Baik":
      return "bg-green-100 text-green-800";
    case "Cukup Baik":
      return "bg-orange-100 text-orange-800";
    case "Buruk":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
};
