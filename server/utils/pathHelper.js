// utils.js (ES Module)

export function ensureTrailingSlash(path) {
  if (typeof path !== "string") {
    throw new TypeError("Expected a string");
  }

  // Trim spaces first (optional, good for safety)
  path = path.trim();

  // Check and append slash if not present
  if (!path.endsWith("/")) {
    path += "/";
  }

  return path;
}



export function ensureCleanStartingSlash(path) {
  if (typeof path !== "string") {
    throw new TypeError("Expected a string");
  }

  // Trim spaces first (optional, good for safety)
  path = path.trim();

  // Check and append slash if not present
  if (!path.startsWith("/")) {
    return path
    // path = "/" + path;
  }
  path = path.slice(1);

  return path;
}
