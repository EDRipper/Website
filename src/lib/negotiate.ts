// HTTP content negotiation on the Accept header, following acceptmarkdown.com:
// rank by q, break ties by specificity (exact > type/* > */*), never pick a
// q=0 type, and treat a missing header or */* as "serve the default".

export type MediaType = 'text/html' | 'text/markdown';

type Range = { type: string; subtype: string; q: number };

function parseAccept(header: string): Range[] {
	const ranges: Range[] = [];
	for (const part of header.split(',')) {
		const [range, ...params] = part.split(';').map((s) => s.trim());
		const [type, subtype] = range.toLowerCase().split('/');
		if (!type || !subtype) continue;
		let q = 1;
		for (const p of params) {
			const [k, v] = p.split('=').map((s) => s.trim());
			if (k.toLowerCase() !== 'q') continue;
			q = Number(v);
		}
		if (Number.isNaN(q) || q < 0 || q > 1) continue; // malformed q: ignore the range
		ranges.push({ type, subtype, q });
	}
	return ranges;
}

// q the client gives `mediaType`, from its most specific matching range (0 if none).
function qualityOf(mediaType: string, ranges: Range[]): number {
	const [type, subtype] = mediaType.split('/');
	let best = -1;
	let q = 0;
	for (const r of ranges) {
		const specificity =
			r.type === type && r.subtype === subtype
				? 2
				: r.type === type && r.subtype === '*'
					? 1
					: r.type === '*' && r.subtype === '*'
						? 0
						: -1;
		if (specificity > best) {
			best = specificity;
			q = r.q;
		}
	}
	return q;
}

/**
 * Pick the representation to serve. `offers` is in server preference order: the
 * first is the default, and wins ties. Returns null when nothing is acceptable
 * (the caller should answer 406).
 */
export function negotiate(accept: string | null, offers: readonly MediaType[]): MediaType | null {
	if (!accept?.trim()) return offers[0];
	const ranges = parseAccept(accept);
	if (!ranges.length) return offers[0];
	let choice: MediaType | null = null;
	let top = 0;
	for (const offer of offers) {
		const q = qualityOf(offer, ranges);
		if (q > top) {
			top = q;
			choice = offer;
		}
	}
	return choice;
}
