/**
 * Auto-escaping HTML templates.
 *
 * Every value interpolated into a `markup` template is escaped, so a string
 * that reaches the DOM is text by default and never structure. This replaces
 * the per-call-site `esc()` that used to guard some interpolations and was
 * simply forgotten at others.
 *
 * Composition rules:
 * - a value produced by `markup` is already escaped and is spliced in as-is,
 *   so fragments nest without being escaped twice;
 * - an array is concatenated with no separator, which is what the
 *   `.map(...)` render loops want (no more `.join('')`);
 * - `null` and `undefined` render as nothing, so `${maybe}` is safe;
 * - numbers and booleans stringify, so `aria-pressed="${isFirst}"` still
 *   emits `true`/`false`.
 *
 * The only way to inject markup is `unsafeHtml()`, which has to be written at
 * the call site — there is no silent path.
 *
 * The tag is called `markup` rather than `html` on purpose: Prettier treats an
 * `html`-tagged template as embedded lit-html and reformats its contents,
 * which would rewrite the generated markup (`<br>` to `<br />`, attributes on
 * their own lines, whitespace inside inline elements). The rendered DOM is a
 * contract with the stylesheet, so the template text has to stay exactly as
 * written.
 */

/** Markup that is already safe to splice into a template. */
export class SafeHtml {
  private readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}

/** Anything accepted as an interpolated value in a `markup` template. */
export type HtmlValue =
  SafeHtml | string | number | boolean | null | undefined | readonly HtmlValue[];

const CHARACTER_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escape a value for HTML text or a quoted attribute. Single quotes are
 * included so single-quoted attributes are safe too.
 */
export function escapeHtml(value: string): string {
  // Every character the pattern matches has an entry, so the fallback is
  // unreachable; returning the character unchanged keeps it a no-op.
  return value.replace(/[&<>"']/g, character => CHARACTER_ENTITIES[character] ?? character);
}

function interpolate(value: HtmlValue): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof SafeHtml) {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return (value as readonly HtmlValue[]).map(interpolate).join('');
  }
  return escapeHtml(String(value));
}

/** Tagged template that escapes every interpolated value. */
export function markup(strings: TemplateStringsArray, ...values: HtmlValue[]): SafeHtml {
  // A tagged template always has one more string than it has values, so
  // every index read below is in range.
  let out = strings[0] ?? '';
  for (let index = 0; index < values.length; index += 1) {
    out += interpolate(values[index]) + (strings[index + 1] ?? '');
  }
  return new SafeHtml(out);
}

/**
 * Escape hatch for markup that is built in code and therefore already trusted
 * — in this app that means the inline SVG strings from `icon()`. It has to be
 * spelled out at the call site (`${unsafeHtml(icon('times'))}`) so every
 * un-escaped interpolation is visible in review. Never pass data through it.
 */
export function unsafeHtml(value: string): SafeHtml {
  return new SafeHtml(value);
}

/**
 * Replace an element's children with a fragment. Values that are not already
 * `SafeHtml` go through the same escaping as a template interpolation, so a
 * bare string cannot smuggle in markup this way either.
 */
export function setHtml(element: Element, content: HtmlValue): void {
  element.innerHTML = interpolate(content);
}
