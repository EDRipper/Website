// Scroll-trail arrow geometry, shared by the home page and the /arrow-editor tool.

export type Pt = { x: number; y: number };

/**
 * One point on the arrow's path: its position plus the offsets of its in/out Bézier
 * handles, all in "trail space", where the tail (under the hero) is (1, 0) and the tip
 * (just left of the fun facts paragraph) is (0, 1). The layout moves those two anchors
 * and the path stretches with them. The first point is always pinned to the tail; the
 * last is where the arrow ends, usually at or near the tip.
 */
export type TrailNode = { x: number; y: number; ix: number; iy: number; ox: number; oy: number };

/** Where the tail and tip sit on the current layout, in document px. */
export type TrailFrame = { tail: Pt; tip: Pt; w: number; vh: number };

export const TRAIL_STUB = 56; // path length shown before any scroll (the resting arrow)
export const TRAIL_STEP = 3; // px between path samples

// Designed on /arrow-editor: paste its "Copy data" output over this.
// (designed at a 2233×1326 viewport)
export const TRAIL_PATH: TrailNode[] = [
	{ x: 1, y: 0, ix: 0, iy: 0, ox: 0.285, oy: 0.46 },
	{ x: 0.747, y: 0.321, ix: 0, iy: 0.301, ox: 0, oy: -0.373 },
	{ x: 1.014, y: 0.591, ix: 0.688, iy: -0.026, ox: -0.097, oy: 0.004 },
	{ x: 0.599, y: 0.666, ix: 0.14, iy: -0.07, ox: -0.16, oy: 0.08 },
	{ x: 0.383, y: 0.866, ix: 0.057, iy: -0.126, ox: 0, oy: 0 }
];

/** Document position ignoring transforms (the reveal animation nudges elements). */
export function docBox(el: HTMLElement) {
	let x = 0;
	let y = 0;
	for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
		x += n.offsetLeft;
		y += n.offsetTop;
	}
	return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/**
 * Tail: centred just under the hero text. Tip: just left of the fun facts paragraph.
 * No arrow on phones (the page's 700px breakpoint).
 */
export function measureTrail(heroBody: HTMLElement, factsText: HTMLElement): TrailFrame | null {
	const w = document.documentElement.clientWidth;
	if (w <= 700) return null;
	const body = docBox(heroBody);
	const text = docBox(factsText);
	const tail = { x: w / 2, y: body.y + body.h + 28 };
	const tip = { x: text.x - 12, y: text.y + Math.min(text.h / 2, 30) };
	if (tip.y - tail.y < TRAIL_STUB * 2) return null;
	return { tail, tip, w, vh: window.innerHeight };
}

const spanX = (f: TrailFrame) => Math.max(40, f.tail.x - f.tip.x);
const spanY = (f: TrailFrame) => f.tip.y - f.tail.y;

export const toPx = (f: TrailFrame, p: Pt): Pt => ({
	x: f.tip.x + p.x * spanX(f),
	y: f.tail.y + p.y * spanY(f)
});

export const toTrail = (f: TrailFrame, p: Pt): Pt => ({
	x: (p.x - f.tip.x) / spanX(f),
	y: (p.y - f.tail.y) / spanY(f)
});

/** Position of node `i` in trail space, with the first pinned to the tail. */
export function nodeAt(nodes: TrailNode[], i: number): Pt {
	if (i === 0) return { x: 1, y: 0 };
	return { x: nodes[i].x, y: nodes[i].y };
}

/** The path as cubic Béziers [start, control 1, control 2, end] in document px. */
export function trailBeziers(f: TrailFrame, nodes: TrailNode[]): [Pt, Pt, Pt, Pt][] {
	const out: [Pt, Pt, Pt, Pt][] = [];
	for (let i = 0; i + 1 < nodes.length; i++) {
		const a = nodeAt(nodes, i);
		const b = nodeAt(nodes, i + 1);
		out.push([
			toPx(f, a),
			toPx(f, { x: a.x + nodes[i].ox, y: a.y + nodes[i].oy }),
			toPx(f, { x: b.x + nodes[i + 1].ix, y: b.y + nodes[i + 1].iy }),
			toPx(f, b)
		]);
	}
	return out;
}

export function cubicAt(p0: Pt, c1: Pt, c2: Pt, p3: Pt, t: number): Pt {
	const u = 1 - t;
	const a = u * u * u;
	const b = 3 * u * u * t;
	const c = 3 * u * t * t;
	const d = t * t * t;
	return { x: a * p0.x + b * c1.x + c * c2.x + d * p3.x, y: a * p0.y + b * c1.y + c * c2.y + d * p3.y };
}

/** Sample the path evenly by arc length (TRAIL_STEP px apart) so scroll maps to distance. */
export function sampleTrail(f: TrailFrame, nodes: TrailNode[]): Pt[] {
	const raw: Pt[] = [];
	trailBeziers(f, nodes).forEach(([p0, c1, c2, p3], k) => {
		for (let i = k === 0 ? 0 : 1; i <= 40; i++) raw.push(cubicAt(p0, c1, c2, p3, i / 40));
	});
	if (raw.length < 2) return raw;
	const out: Pt[] = [raw[0]];
	let carried = 0; // distance since the last output sample
	for (let i = 1; i < raw.length; i++) {
		let a = raw[i - 1];
		const b = raw[i];
		let seg = Math.hypot(b.x - a.x, b.y - a.y);
		while (carried + seg >= TRAIL_STEP) {
			const k = (TRAIL_STEP - carried) / seg;
			a = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
			out.push(a);
			seg = Math.hypot(b.x - a.x, b.y - a.y);
			carried = 0;
		}
		carried += seg;
	}
	out.push(raw[raw.length - 1]);
	// Keep the stroke on screen on narrow layouts.
	return out.map((p) => ({ x: Math.min(f.w - 8, Math.max(8, p.x)), y: p.y }));
}

const stubIndex = (pts: Pt[]) => Math.min(pts.length - 1, Math.round(TRAIL_STUB / TRAIL_STEP));

/**
 * Scroll distance over which the head travels the path: at scroll speed, but always
 * arriving by the time the end of the arrow is just past halfway down the screen.
 */
export function trailFinish(f: TrailFrame, pts: Pt[]): number {
	const travel = (pts.length - 1 - stubIndex(pts)) * TRAIL_STEP;
	return Math.max(1, Math.min(travel, pts[pts.length - 1].y - f.vh * 0.55));
}

/** The drawn part of the path and the head's position/rotation for a scroll offset. */
export function trailHead(pts: Pt[], scrollY: number, finish: number) {
	const stubEnd = stubIndex(pts);
	const progress = Math.min(1, Math.max(0, scrollY / finish));
	const f = stubEnd + (pts.length - 1 - stubEnd) * progress;
	const i = Math.max(0, Math.min(pts.length - 2, Math.floor(f)));
	const k = f - i;
	const a = pts[i];
	const b = pts[i + 1];
	const hx = a.x + (b.x - a.x) * k;
	const hy = a.y + (b.y - a.y) * k;
	let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
	for (let j = 1; j <= i; j++) d += `L${pts[j].x.toFixed(1)} ${pts[j].y.toFixed(1)}`;
	d += `L${hx.toFixed(1)} ${hy.toFixed(1)}`;
	// Tangent from a few samples back so the head turns smoothly.
	const back = pts[Math.max(0, i - 3)];
	const angle = (Math.atan2(hy - back.y, hx - back.x) * 180) / Math.PI - 90;
	return { d, hx, hy, angle };
}
