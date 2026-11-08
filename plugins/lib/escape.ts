/** Escaping helpers for the generated XML/HTML/JSON-LD documents. */

/** Escape the five XML-significant characters (apostrophes are left alone). */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape a value for interpolation into HTML text or a quoted attribute. */
export function escapeHtml(value: string): string {
  return escapeXml(value).replace(/'/g, '&#39;');
}

/**
 * Serialise a JSON-LD document for an inline `<script>`: `<` is escaped so the
 * payload can never terminate the script element early.
 */
export function safeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
