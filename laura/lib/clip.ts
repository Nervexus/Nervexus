/** A notched-corner clip-path, the brand motif carried from the CTA button
 * on the Home hero into every primary button and icon tile in the app. */
export function notch(size = 10): string {
  return `polygon(${size}px 0, 100% 0, 100% calc(100% - ${size}px), calc(100% - ${size}px) 100%, 0 100%, 0 ${size}px)`;
}
