import sanitizeHtml = require('sanitize-html');

/**
 * Keep the small formatting surface emitted by the report editor while removing
 * executable markup, embedded documents, inline CSS, event handlers and unsafe
 * URL schemes. This is applied before persistence, not only at render time.
 */
export function sanitizeStatusReportHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'h1',
      'h2',
      'h3',
      'h4',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'a',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {}),
        },
      }),
    },
    disallowedTagsMode: 'discard',
  }).trim();
}

export function hasReportText(value: string): boolean {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/gi, ' ')
    .trim().length > 0;
}
