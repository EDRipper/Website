import { describe, expect, it } from 'vitest';
import { negotiate } from './negotiate';

const PAGE = ['text/html', 'text/markdown'] as const;

describe('negotiate', () => {
	it.each([
		[null, 'text/html'],
		['', 'text/html'],
		['*/*', 'text/html'],
		['text/*', 'text/html'],
		['text/markdown', 'text/markdown'],
		['text/html', 'text/html'],
		['text/markdown, text/html', 'text/html'], // equal q → server default
		['text/markdown, text/html;q=0.9', 'text/markdown'],
		['text/html;q=0.5, text/markdown;q=0.8', 'text/markdown'],
		['text/markdown, */*;q=0.1', 'text/markdown'],
		['text/*;q=0.5, text/markdown', 'text/markdown'], // specificity beats wildcard
		['text/markdown;q=0, */*', 'text/html'], // q=0 on the exact type wins over */*
		['TEXT/MARKDOWN', 'text/markdown'],
		// A typical browser.
		['text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'text/html'],
		// Googlebot.
		['text/html,application/xhtml+xml,application/signed-exchange;v=b3,application/xml;q=0.9,*/*;q=0.8', 'text/html']
	])('Accept %j → %s', (accept, expected) => {
		expect(negotiate(accept, PAGE)).toBe(expected);
	});

	it('returns null when nothing is acceptable', () => {
		expect(negotiate('application/pdf', PAGE)).toBeNull();
		expect(negotiate('text/html;q=0, text/markdown;q=0', PAGE)).toBeNull();
		expect(negotiate('*/*;q=0', PAGE)).toBeNull();
	});

	it('uses the first offer as the default on ties', () => {
		expect(negotiate('*/*', ['text/markdown', 'text/html'])).toBe('text/markdown');
		expect(negotiate(null, ['text/markdown', 'text/html'])).toBe('text/markdown');
	});

	it('ignores ranges with malformed q values', () => {
		expect(negotiate('text/markdown;q=abc, text/html;q=0.2', PAGE)).toBe('text/html');
		expect(negotiate('garbage', PAGE)).toBe('text/html');
	});
});
