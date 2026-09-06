export interface InitialAvatarOptions {
	size?: number;
	fontSize?: number;
	fontWeight?: string;
	fontFamily?: string;
}

/**
 * Extract initials from a name.
 * @example generateInitials("John Doe") // "JD"
 * @example generateInitials("pitok") // "P"
 */
export function generateInitials(name: string, max = 2): string {
	return name
		.split(/[\s._-]+/)
		.filter(Boolean)
		.slice(0, max)
		.map((w) => w[0]!.toUpperCase())
		.join("");
}

/**
 * Generate a consistent HSL color from any string.
 * Same input always returns the same color.
 * @example avatarColor("user-123") // { h: 245, s: 60, l: 50 }
 */
export function avatarColor(identifier: string): { h: number; s: number; l: number } {
	let hash = 0;
	for (const char of identifier) hash = char.charCodeAt(0) + ((hash << 5) - hash);
	const hue = Math.abs(hash) % 360;
	return { h: hue, s: 60, l: 50 };
}

/**
 * Generate an SVG avatar with initials on a colored circle.
 * Returns SVG string, ready to serve as image/svg+xml.
 * @example generateInitialAvatar("John Doe", "user-1")
 */
export function generateInitialAvatar(
	name: string,
	id: string,
	options?: InitialAvatarOptions,
): string {
	const { h, s, l } = avatarColor(id);
	const initials = generateInitials(name);

	const size = options?.size ?? 128;
	const fontSize = options?.fontSize ?? Math.round(size * 0.4);
	const fontWeight = options?.fontWeight ?? "600";
	const fontFamily = options?.fontFamily ?? "Arial,sans-serif";

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size / 2}" fill="hsl(${h}, ${s}%, ${l}%)"/>
  <text x="${size / 2}" y="${size / 2}" dy=".1em" fill="white" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="central">${initials}</text>
</svg>`;
}
