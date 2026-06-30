import { sanitizeHtml, sanitizeUrl, trimAndClean } from './sanitize';

describe('sanitizeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('passes through safe strings', () => {
    expect(sanitizeHtml('Hello, world!')).toBe('Hello, world!');
  });

  it('escapes ampersands first', () => {
    expect(sanitizeHtml('A&B')).toBe('A&amp;B');
  });
});

describe('sanitizeUrl', () => {
  it('allows https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('rejects javascript URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('rejects invalid URLs', () => {
    expect(sanitizeUrl('not-a-url')).toBe('');
  });
});

describe('trimAndClean', () => {
  it('trims whitespace', () => {
    expect(trimAndClean('  hello  ')).toBe('hello');
  });

  it('collapses multiple spaces', () => {
    expect(trimAndClean('hello   world')).toBe('hello world');
  });
});
