import { describe, it, expect } from 'vitest';
import { resolveUploadContentType } from './upload.js';

describe('resolveUploadContentType', () => {
  it('uses an explicit --content-type over inference', () => {
    expect(resolveUploadContentType('photo.png', 'image/webp')).toBe('image/webp');
  });

  it('infers from the file extension when no flag is given', () => {
    expect(resolveUploadContentType('photo.png')).toBe('image/png');
    expect(resolveUploadContentType('/tmp/report.pdf')).toBe('application/pdf');
  });

  it('treats an empty or whitespace flag as not provided', () => {
    expect(resolveUploadContentType('photo.png', '')).toBe('image/png');
    expect(resolveUploadContentType('photo.png', '   ')).toBe('image/png');
  });

  it('falls back to octet-stream for an unknown extension', () => {
    expect(resolveUploadContentType('archive.unknownext')).toBe('application/octet-stream');
    expect(resolveUploadContentType('noext')).toBe('application/octet-stream');
  });
});
