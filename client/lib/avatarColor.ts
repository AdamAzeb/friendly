const PALETTE = [
  "#3B82F6", // blue
  "#10B981", // green
  "#8B5CF6", // violet
  "#F59E0B", // amber
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#EF4444", // red
  "#F97316", // orange
];

/** Deterministic color from a name string */
export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/** Whether a URL looks like a usable image (http/https only) */
export function isValidImageUrl(url: string | undefined): boolean {
  return !!url && (url.startsWith("http://") || url.startsWith("https://"));
}
