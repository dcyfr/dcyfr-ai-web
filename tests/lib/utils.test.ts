import { describe, it, expect } from 'vitest';
import { cn, slugify, formatDate, truncate } from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('merges class names', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    it('handles conditional classes', () => {
      const result = cn('base', false && 'hidden', 'extra');
      expect(result).toBe('base extra');
    });
  });

  describe('slugify', () => {
    it('converts text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('handles special characters', () => {
      expect(slugify('Hello & World! 2024')).toBe('hello-world-2024');
    });

    it('handles multiple spaces', () => {
      expect(slugify('  Hello   World  ')).toBe('hello-world');
    });
  });

  describe('formatDate', () => {
    it('formats a date string', () => {
      const result = formatDate('2026-01-15T12:00:00Z');
      expect(result).toContain('January');
      expect(result).toContain('2026');
    });

    it('formats a Date object', () => {
      const result = formatDate(new Date('2026-06-01'));
      expect(result).toContain('2026');
    });
  });

  describe('truncate', () => {
    it('truncates long text', () => {
      const result = truncate('This is a long text that should be truncated', 20);
      expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(result).toContain('...');
    });

    it('does not truncate short text', () => {
      expect(truncate('Short', 10)).toBe('Short');
    });
  });
});
