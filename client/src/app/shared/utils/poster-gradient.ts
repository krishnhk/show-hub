/** Placeholder poster fill. One colour pair for every film, taken from the theme so the grid reads as a single set. */
const POSTER_GRADIENT = 'linear-gradient(150deg, var(--poster-from), var(--poster-to))';

export function posterGradient(_title: string): string {
  return POSTER_GRADIENT;
}
