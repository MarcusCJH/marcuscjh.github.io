/** Text helpers for the generated meta tags. */

/**
 * Shorten a description to a meta-tag friendly length, preferring a word
 * boundary and appending an ellipsis when it has to cut.
 */
export function truncateDescription(value: string, maxLength = 158): string {
  if (value.length <= maxLength) {
    return value;
  }
  const shortened = value.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > 100 ? lastSpace : maxLength).trim()}…`;
}
