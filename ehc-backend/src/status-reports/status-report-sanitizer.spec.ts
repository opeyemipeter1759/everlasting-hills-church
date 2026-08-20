import { hasReportText, sanitizeStatusReportHtml } from './status-report-sanitizer';

describe('sanitizeStatusReportHtml', () => {
  it('removes scripts, event handlers, embedded content and javascript URLs', () => {
    const dirty = [
      '<p onclick="steal()">Weekly <strong>update</strong></p>',
      '<script>steal()</script>',
      '<iframe src="https://evil.test"></iframe>',
      '<a href="javascript:steal()">bad link</a>',
      '<img src=x onerror=steal()>',
    ].join('');

    const clean = sanitizeStatusReportHtml(dirty);

    expect(clean).toContain('<p>Weekly <strong>update</strong></p>');
    expect(clean).not.toMatch(/script|iframe|onclick|onerror|javascript:|<img/i);
  });

  it('preserves safe editor formatting and hardens new-window links', () => {
    const clean = sanitizeStatusReportHtml(
      '<h2>Summary</h2><ul><li><em>One</em></li></ul><a href="https://example.com" target="_blank">Source</a>',
    );

    expect(clean).toContain('<h2>Summary</h2>');
    expect(clean).toContain('<ul><li><em>One</em></li></ul>');
    expect(clean).toContain('href="https://example.com"');
    expect(clean).toContain('rel="noopener noreferrer"');
  });

  it('detects markup with no meaningful report text', () => {
    expect(hasReportText('<p><br></p>')).toBe(false);
    expect(hasReportText('<script>alert(1)</script>')).toBe(false);
    expect(hasReportText('<p>Useful update</p>')).toBe(true);
  });
});
