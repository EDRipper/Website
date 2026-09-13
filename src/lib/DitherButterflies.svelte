<script lang="ts">
	// Animated ordered-dither (Bayer) plasma with butterflies drawn into the
	// same brightness field, so they're rendered by the dither itself.
	import { onMount } from 'svelte';

	let {
		dark = true, // white dots for a dark ground, black dots for a light one
		opacity = 0.08,
		count = 9,
		size = 16, // wingspan-ish, in dither cells
		speed = 1,
		flapRate = 1,
		halo = 0.45, // plasma bends toward each butterfly
		trail = 0.5, // fading wake left behind
		invert = false, // butterflies light instead of dark
		clearEls = [], // elements to keep the dither off (re-measured when they resize)
		clearPad = 40, // px of plain ground around each of those elements
		clearRadius = 0, // px; corner rounding of those plain areas
		clearFloor = 0, // 0..1; dither left inside the plain areas (0 = fully clear)
		perchEls = [], // elements whose top edge butterflies can land on
		intro = 0, // ms for the dither to close in from the screen edges on load; 0 = none
		onready, // called once that intro has finished (straight away if there isn't one)
		clearWidth = 0, // px; with no clearEls, a plain column down the middle, 0 = none
		fade = 200, // px; dithered fade from the plain areas out to full dither
		push = 0.6, // strength of the cursor's wake, a clearing that trails its path; 0 = off
		pushRadius = 180, // px; how far each side of the path the wake spreads at full speed
		plasma = true // false: skip the dithered plasma and draw only the butterflies
	}: {
		dark?: boolean;
		opacity?: number;
		count?: number;
		size?: number;
		speed?: number;
		flapRate?: number;
		halo?: number;
		trail?: number;
		invert?: boolean;
		clearEls?: (Element | null | undefined)[];
		clearPad?: number;
		clearRadius?: number;
		clearFloor?: number;
		perchEls?: (Element | null | undefined)[];
		intro?: number;
		onready?: () => void;
		clearWidth?: number;
		fade?: number;
		push?: number;
		pushRadius?: number;
		plasma?: boolean;
	} = $props();

	type Butterfly = {
		x: number;
		y: number;
		heading: number; // radians
		turn: number; // current turn rate, random-walks
		flapPhase: number;
		flapF: number; // full wing cycles per second
		glide: number; // seconds of gliding left
		scale: number;
		light: boolean; // drawn as light gaps in the dither rather than dark ink (see isLight)
		speed: number; // cruise speed, cells per second
		fright: number; // 0..1, startled by the cursor; fades back to calm
		z: number; // depth, 0 (far) .. 1 (near); drifts slowly
		dz: number;
		mode: 'fly' | 'land' | 'perch';
		perchIdx: number; // which perch it's heading for / sitting on
		perchU: number; // 0..1 along that perch's top edge
		perchT: number; // seconds left perched (or to reach the perch)
		landCooldown: number; // seconds before it will think about landing again
		side: number; // 0 = seen from above (flying) .. 1 = side-on (perched)
		face: 1 | -1; // which way it faces when side-on: 1 = right
		overEdge: boolean; // has been above its perch's top edge on this approach
	};

	// A plain (undithered) area, in cells, with corner radius `rad`. Edges may be ±Infinity.
	type Rect = { x0: number; y0: number; x1: number; y1: number; rad: number };

	let wrap!: HTMLDivElement;
	let bg!: HTMLCanvasElement;

	// Redraw straight away (rather than on the next animation frame) when the look changes,
	// so a theme switch's crossfade captures the new dots, not the old ones.
	let redrawNow: (() => void) | undefined;
	$effect(() => {
		void dark;
		void invert;
		void plasma;
		redrawNow?.();
	});

	onMount(() => {
		const ctx = bg.getContext('2d')!;
		const PIXEL = 4; // on-screen size of each dither cell
		const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
		const TAU = Math.PI * 2;

		let cols = 0;
		let rows = 0; // canvas rows: the screen plus overscan above and below
		let img: ImageData;
		let field: Float32Array; // brightness 0..1 before dithering
		let wake: Float32Array; // butterfly trail strength 0..1
		let mask: Float32Array; // per-cell dither visibility 0..1 (page-anchored, cached)
		let plasmaBase: Float32Array; // the plasma alone (page-anchored, refreshed every few frames)
		let rects: Rect[] = []; // plain areas, in screen cells
		let perches: Rect[] = []; // perch elements, in screen cells
		let docRects: Rect[] = []; // the same two in page cells, which scrolling doesn't change
		let docPerches: Rect[] = [];
		let bfMask: Uint8Array; // cells covered by a butterfly this frame

		// Cursor wake: the pointer's recent path, smoothed through a centripetal
		// Catmull-Rom spline, is stamped into a coarse grid as a clearing that opens
		// just behind the cursor, spreads outward with age like a boat's wake, and
		// heals slowly. Ink banks up a little along its outer edges.
		const G = 2; // wake grid spacing, in cells
		const WAKE_LIFE = 3.5; // seconds a point of the path lasts
		// Cells, seconds, cells/s; brk = starts a new stroke (don't join to the previous point).
		type PathPt = { x: number; y: number; t: number; v: number; brk: boolean };
		const path: PathPt[] = [];
		let gw = 0;
		let gh = 0;
		let clearing: Float32Array; // 0..1, how much ink the wake has pushed away
		let bank: Float32Array; // 0..1, ink piled up along the wake's edges
		let wakeLive = false; // anything in those grids to draw
		let ptrX = 0; // pointer, in cells
		let ptrY = 0;
		let ptrIn = false;
		let ptrBreak = true; // the next path point starts a new stroke

		// Scrolling: the canvas sits in the page rather than being fixed to the screen, so the
		// browser scrolls it along with the content with no lag. It's only re-anchored (by
		// whole cells) as the view moves, with OVER spare rows either side so native scrolling
		// never outruns it between frames. Canvas row r is page row wy0 + r. Butterflies, rects
		// and the pointer are in screen cells; drawing adds oy (screen row → canvas row).
		const OVER = 24;
		let vpRows = 0; // rows on screen
		let scrollCells = 0;
		let wy0 = 0;
		let oy = 0;
		// Where the pointer was (screen cells) when the wake last recorded a point, and how
		// far the page has scrolled since: scrolling alone must not count as movement.
		let recX = 0;
		let recY = 0;
		let scrolledSinceRec = 0;
		let raf = 0;
		const start = performance.now();
		let last = start;

		const flock: Butterfly[] = [];
		let seeded = false; // whether the opening perched butterflies have been placed

		// What needs recomputing.
		let measureDirty = true; // element positions
		let maskDirty = true; // the plain-area mask
		let plasmaFull = true; // a full plasma pass now (otherwise every third frame)
		let maskKey = ''; // the clear* settings the mask was built with
		let frameCount = 0;

		// Intro: the dither closes in from the screen edges, then onready fires.
		let introT0 = -1;
		let readyFired = false;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		// Plasma: summed sines, plus slow, larger patches of stronger and weaker intensity
		// so the field isn't uniform. Evaluated from these per-column tables (rebuilt on
		// resize) and per-row terms, so each cell is just arithmetic.
		let colA: Float32Array; // sin(x·0.025 + t·0.4)
		let colS16: Float32Array; // sin/cos(x·0.016)
		let colC16: Float32Array;
		let colS9: Float32Array; // sin/cos(x·0.009)
		let colC9: Float32Array;
		let colS3: Float32Array; // sin/cos(x·0.003)
		let colC3: Float32Array;

		const smooth = (e0: number, e1: number, x: number) => {
			const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
			return t * t * (3 - 2 * t);
		};

		const wrapAngle = (a: number) => (((a + Math.PI) % TAU) + TAU) % TAU - Math.PI;
		const turnToward = (h: number, target: number, k: number) => h + wrapAngle(target - h) * k;

		// Distance (cells) from a point to a rounded rect; 0 inside.
		const rectDist = (r: Rect, x: number, y: number) =>
			Math.max(
				0,
				Math.hypot(
					Math.max(r.x0 + r.rad - x, 0, x - r.x1 + r.rad),
					Math.max(r.y0 + r.rad - y, 0, y - r.y1 + r.rad)
				) - r.rad
			);

		// The wrapper spans the whole page so the canvas can sit anywhere in it; it clips,
		// so the canvas's overscan never makes the page longer.
		function sizeWrap() {
			wrap.style.height = `${Math.max(document.body.offsetHeight, window.innerHeight)}px`;
		}

		// Element rects in page cells. Scrolling doesn't change these, so they're only
		// re-measured when something resizes (or occasionally, as a fallback).
		function measure() {
			const before = JSON.stringify(docRects);
			const top = window.scrollY;
			docPerches = [];
			for (const el of perchEls) {
				if (!el) continue;
				const b = el.getBoundingClientRect();
				docPerches.push({
					x0: b.left / PIXEL,
					y0: (b.top + top) / PIXEL,
					x1: b.right / PIXEL,
					y1: (b.bottom + top) / PIXEL,
					rad: 0
				});
			}
			docRects = [];
			const els = clearEls.filter((el): el is Element => !!el);
			if (els.length) {
				for (const el of els) {
					const b = el.getBoundingClientRect();
					if (b.width === 0 && b.height === 0) continue;
					const w = b.width + clearPad * 2;
					const h = b.height + clearPad * 2;
					docRects.push({
						x0: (b.left - clearPad) / PIXEL,
						y0: (b.top + top - clearPad) / PIXEL,
						x1: (b.right + clearPad) / PIXEL,
						y1: (b.bottom + top + clearPad) / PIXEL,
						rad: Math.min(clearRadius, w / 2, h / 2) / PIXEL
					});
				}
			} else if (clearWidth > 0) {
				// Centred on the content, not the canvas, which runs under the scrollbar.
				const cx = document.documentElement.clientWidth / 2;
				docRects.push({
					x0: (cx - clearWidth / 2) / PIXEL,
					y0: -Infinity,
					x1: (cx + clearWidth / 2) / PIXEL,
					y1: Infinity,
					rad: 0
				});
			}
			measureDirty = false;
			// Only rebuild the mask when the plain areas actually moved; the periodic
			// fallback re-measure usually finds nothing changed.
			if (JSON.stringify(docRects) !== before) maskDirty = true;
		}

		// Screen-cell copies of the page rects, for the butterflies (which live on the screen).
		function toScreen() {
			const s = scrollCells;
			rects = docRects.map((r) => ({ ...r, y0: r.y0 - s, y1: r.y1 - s }));
			perches = docPerches.map((r) => ({ ...r, y0: r.y0 - s, y1: r.y1 - s }));
		}

		// Re-measure whenever the page body or any watched element changes size.
		const ro = new ResizeObserver(() => {
			measureDirty = true;
			sizeWrap();
		});
		ro.observe(document.body);
		let observed: Element[] = [];
		function syncObserved() {
			const els = [...clearEls, ...perchEls].filter((el): el is Element => !!el);
			if (els.length === observed.length && els.every((el, i) => el === observed[i])) return;
			for (const el of observed) ro.unobserve(el);
			for (const el of els) ro.observe(el);
			observed = els;
			measureDirty = true;
		}

		// Size multiplier including depth: further butterflies look a little smaller.
		const depthScale = (bf: Butterfly) => bf.scale * (0.8 + 0.4 * bf.z);
		// Whether this butterfly is drawn light. `invert` flips the whole flock; without the
		// plasma (phones) a light butterfly would have nothing to show against, so all go dark.
		const isLight = (bf: Butterfly) => invert !== (bf.light && plasma);

		// A perch's top edge is usable while it's on screen and wide enough to sit on.
		const perchOk = (p: Rect | undefined, S: number): p is Rect =>
			!!p && p.x1 - p.x0 > S * 3 && p.y0 > S && p.y0 < vpRows - S;

		// Where a butterfly sits on a perch: somewhere along the top edge, standing on it.
		const perchSpot = (bf: Butterfly, p: Rect, S: number): [number, number] => [
			p.x0 + S * 0.9 + bf.perchU * (p.x1 - p.x0 - S * 1.8),
			p.y0 - S * 0.12
		];

		function takeOff(bf: Butterfly, startled: boolean) {
			bf.mode = 'fly';
			bf.heading = -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
			bf.turn = 0;
			bf.fright = startled ? 1 : 0.4;
			bf.landCooldown = 8 + Math.random() * 12;
		}

		// A random on-screen spot clear of the plain areas, if one turns up quickly.
		function randomPoint(S: number): [number, number] {
			let x = 0;
			let y = 0;
			for (let n = 0; n < 16; n++) {
				x = Math.random() * cols;
				y = Math.random() * vpRows;
				if (rects.every((r) => rectDist(r, x, y) > S * 2)) break;
			}
			return [x, y];
		}

		function spawn(onScreen: boolean): Butterfly {
			const scale = 0.85 + Math.random() * 0.3; // depth adds the rest of the size range
			const m = size * scale * 1.5;
			let [x, y] = randomPoint(size * scale);
			let heading = Math.random() * TAU;
			if (!onScreen) {
				// Enter from a random edge, pointed inward.
				const edge = Math.floor(Math.random() * 4);
				if (edge === 0) (x = -m), (heading = 0);
				else if (edge === 1) (x = cols + m), (heading = Math.PI);
				else if (edge === 2) (y = -m), (heading = Math.PI / 2);
				else (y = vpRows + m), (heading = -Math.PI / 2);
			}
			return {
				x,
				y,
				heading,
				light: flock.length % 2 === 1, // alternate, so the flock is always a mix of both kinds
				turn: 0,
				flapPhase: Math.random() * TAU,
				flapF: 0.35 + Math.random() * 0.25,
				glide: 0,
				fright: 0,
				z: Math.random(),
				dz: 0,
				mode: 'fly',
				perchIdx: -1,
				perchU: 0,
				perchT: 0,
				landCooldown: 3 + Math.random() * 6,
				side: 0,
				face: 1,
				overEdge: false,
				scale,
				speed: 12 + Math.random() * 12
			};
		}

		function resize() {
			cols = Math.max(1, Math.ceil(window.innerWidth / PIXEL));
			vpRows = Math.max(1, Math.ceil(window.innerHeight / PIXEL));
			rows = vpRows + OVER * 2 + 1;
			bg.width = cols;
			bg.height = rows;
			bg.style.width = `${cols * PIXEL}px`;
			bg.style.height = `${rows * PIXEL}px`;
			sizeWrap();
			colA = new Float32Array(cols);
			colS16 = new Float32Array(cols);
			colC16 = new Float32Array(cols);
			colS9 = new Float32Array(cols);
			colC9 = new Float32Array(cols);
			colS3 = new Float32Array(cols);
			colC3 = new Float32Array(cols);
			for (let x = 0; x < cols; x++) {
				colS16[x] = Math.sin(x * 0.016);
				colC16[x] = Math.cos(x * 0.016);
				colS9[x] = Math.sin(x * 0.009);
				colC9[x] = Math.cos(x * 0.009);
				colS3[x] = Math.sin(x * 0.003);
				colC3[x] = Math.cos(x * 0.003);
			}
			img = ctx.createImageData(cols, rows);
			field = new Float32Array(cols * rows);
			wake = new Float32Array(cols * rows);
			mask = new Float32Array(cols * rows);
			plasmaBase = new Float32Array(cols * rows);
			bfMask = new Uint8Array(cols * rows);
			// +2 so bilinear sampling at the last cell still has a neighbour.
			gw = Math.ceil(cols / G) + 2;
			gh = Math.ceil(rows / G) + 2;
			clearing = new Float32Array(gw * gh);
			bank = new Float32Array(gw * gh);
			measureDirty = true;
			maskDirty = true;
			plasmaFull = true;
		}

		// Plain areas for canvas rows r0..r1: 0 inside, fading up to full dither over `fade`
		// beyond them (rounded-rect distance). Each rect's vertical distance is worked out
		// once per row, and rows no rect reaches are filled in one go.
		function maskRows(r0: number, r1: number) {
			const fc = Math.max(1, fade / PIXEL);
			const floor = clearFloor;
			const nr = docRects.length;
			const rowDy = new Float64Array(nr);
			for (let y = r0; y < r1; y++) {
				const py = wy0 + y + 0.5; // page cells
				const base = y * cols;
				let active = false;
				for (let k = 0; k < nr; k++) {
					const r = docRects[k];
					const dy = Math.max(r.y0 + r.rad - py, 0, py - r.y1 + r.rad);
					rowDy[k] = dy - r.rad < fc ? dy : -1; // -1: too far away to matter on this row
					if (rowDy[k] >= 0) active = true;
				}
				if (!active) {
					mask.fill(1, base, base + cols);
					continue;
				}
				for (let x = 0; x < cols; x++) {
					const px = x + 0.5;
					let vis = 1;
					for (let k = 0; k < nr; k++) {
						const dy = rowDy[k];
						if (dy < 0) continue;
						const r = docRects[k];
						const dx = Math.max(r.x0 + r.rad - px, 0, px - r.x1 + r.rad);
						const d = Math.sqrt(dx * dx + dy * dy) - r.rad;
						if (d < fc) vis = Math.min(vis, smooth(0, fc, d));
					}
					// clearFloor keeps a gentle scattering of the dither inside the plain areas.
					mask[base + x] = floor + (1 - floor) * vis;
				}
			}
		}

		// The plasma for canvas rows r0..r1 at time t. Each sine is split into column and row
		// parts (sin(a+b) = sin a·cos b + cos a·sin b).
		function plasmaRows(r0: number, r1: number, t: number) {
			for (let x = 0; x < cols; x++) colA[x] = Math.sin(x * 0.025 + t * 0.4);
			for (let y = r0; y < r1; y++) {
				const yw = wy0 + y; // page row, so the pattern scrolls with the page
				const rB = Math.sin(yw * 0.022 - t * 0.3);
				const p16 = yw * 0.016 + t * 0.2;
				const rS16 = Math.sin(p16);
				const rC16 = Math.cos(p16);
				const g = Math.sin(yw * 0.006 + t * 0.05) * 2.2;
				const rSg = Math.sin(g);
				const rCg = Math.cos(g);
				const Y = yw * 0.011 - t * 0.04;
				const rSY = Math.sin(Y);
				const rCY = Math.cos(Y);
				const row = y * cols;
				for (let x = 0; x < cols; x++) {
					// base: sin(x·.025+t·.4) + sin(y·.022−t·.3) + sin((x+y)·.016+t·.2), over 3.
					// patch: sin(x·.009 + 2.2·sin(y·.006+t·.05)) · cos(y·.011 − x·.003 − t·.04).
					const base = (colA[x] + rB + colS16[x] * rC16 + colC16[x] * rS16) / 3;
					const patch = (colS9[x] * rCg + colC9[x] * rSg) * (rCY * colC3[x] + rSY * colS3[x]);
					const v = 0.5 + base * 0.42 + patch * 0.3;
					plasmaBase[row + x] = v < 0 ? 0 : v > 1 ? 1 : v;
				}
			}
		}

		// Move a per-cell buffer up by k rows (down if negative), clearing what's exposed.
		function shiftRows(buf: Float32Array, k: number) {
			if (!k) return;
			if (Math.abs(k) >= rows) {
				buf.fill(0);
			} else if (k > 0) {
				buf.copyWithin(0, k * cols);
				buf.fill(0, (rows - k) * cols);
			} else {
				buf.copyWithin(-k * cols, 0, (rows + k) * cols);
				buf.fill(0, 0, -k * cols);
			}
		}

		// The canvas rows a shift of k brings in.
		const exposed = (k: number): [number, number] =>
			k > 0 ? [Math.max(0, rows - k), rows] : [0, Math.min(rows, -k)];

		// Reflect b through a, for a virtual spline neighbour at the end of a stroke.
		const mirror = (a: PathPt, b: PathPt): PathPt => ({
			x: 2 * a.x - b.x,
			y: 2 * a.y - b.y,
			t: a.t,
			v: a.v,
			brk: false
		});

		// Point at u ∈ [0, 1] on the centripetal Catmull-Rom segment p1→p2. The
		// centripetal parameterisation keeps fast, sharp turns from looping or overshooting.
		function spline(p0: PathPt, p1: PathPt, p2: PathPt, p3: PathPt, u: number): [number, number] {
			const k01 = Math.sqrt(Math.hypot(p1.x - p0.x, p1.y - p0.y)) || 1e-4;
			const k12 = Math.sqrt(Math.hypot(p2.x - p1.x, p2.y - p1.y)) || 1e-4;
			const k23 = Math.sqrt(Math.hypot(p3.x - p2.x, p3.y - p2.y)) || 1e-4;
			const axis = (a: number, b: number, c: number, d: number) => {
				const m1 = k12 * ((b - a) / k01 - (c - a) / (k01 + k12) + (c - b) / k12);
				const m2 = k12 * ((c - b) / k12 - (d - b) / (k12 + k23) + (d - c) / k23);
				const A = 2 * (b - c) + m1 + m2;
				const B = -3 * (b - c) - 2 * m1 - m2;
				return ((A * u + B) * u + m1) * u + b;
			};
			return [axis(p0.x, p1.x, p2.x, p3.x), axis(p0.y, p1.y, p2.y, p3.y)];
		}

		// Wake half-width (cells) at a point of the path `age` seconds old that the
		// cursor passed at `v` cells/s: narrow at the cursor, spreading out behind it
		// to a width in proportion to how fast the cursor was moving (full width
		// from ~220 cells/s).
		const wakeRadius = (age: number, v: number) =>
			Math.max(
				1,
				(pushRadius / PIXEL) * Math.min(1, 0.15 + v / 220) * (0.3 + 0.7 * smooth(0, 1.4, age))
			);
		// Wake depth there, for a cursor that passed at `v` cells/s.
		const wakeStrength = (age: number, v: number) =>
			smooth(0, 0.15, age) * // opens just behind the cursor, not under it
			(1 - smooth(WAKE_LIFE * 0.3, WAKE_LIFE, age)) * // holds, then heals slowly
			Math.min(1, 0.25 + v / 120) * // faster strokes cut a deeper wake
			push;

		function stampWake(x: number, y: number, age: number, v: number) {
			const s = Math.min(1, wakeStrength(age, v));
			if (s < 0.01) return;
			const r = wakeRadius(age, v);
			const reach = r * 1.3;
			const gx0 = Math.max(0, Math.floor((x - reach) / G));
			const gx1 = Math.min(gw - 1, Math.ceil((x + reach) / G));
			const gy0 = Math.max(0, Math.floor((y - reach) / G));
			const gy1 = Math.min(gh - 1, Math.ceil((y + reach) / G));
			for (let gy = gy0; gy <= gy1; gy++) {
				for (let gx = gx0; gx <= gx1; gx++) {
					const dx = gx * G - x;
					const dy = gy * G - y;
					const d = Math.sqrt(dx * dx + dy * dy) / r;
					if (d >= 1.3) continue;
					const i = gy * gw + gx;
					const c = s * smooth(1, 0.45, d);
					if (c > clearing[i]) clearing[i] = c;
					const e = s * Math.max(0, 1 - Math.abs(d - 1.05) / 0.25);
					if (e > bank[i]) bank[i] = e;
				}
			}
		}

		// Record where the pointer has been, then redraw the wake along that path.
		function buildWake(t: number) {
			// Only the pointer moving across the screen draws a wake, not the page scrolling
			// under a still pointer: movement is measured from where the pointer was when the
			// last point was recorded (those path points themselves get carried by the scroll),
			// and a scroll since then starts a fresh stroke rather than joining up.
			if (push > 0 && ptrIn) {
				const lastPt = path[path.length - 1];
				const d = lastPt ? Math.hypot(ptrX - recX, ptrY - recY) : Infinity;
				let recorded = false;
				if (ptrBreak || !lastPt || d > 120 || (d >= 1.5 && scrolledSinceRec > 0.5)) {
					path.push({ x: ptrX, y: ptrY, t, v: 0, brk: true });
					ptrBreak = false;
					recorded = true;
				} else if (d >= 1.5) {
					const raw = d / Math.max(t - lastPt.t, 1 / 240);
					path.push({ x: ptrX, y: ptrY, t, v: lastPt.v * 0.5 + raw * 0.5, brk: false });
					recorded = true;
				}
				if (recorded) {
					recX = ptrX;
					recY = ptrY;
					scrolledSinceRec = 0;
				}
			}
			while (path.length && t - path[0].t > WAKE_LIFE) path.shift();
			if (path.length) path[0].brk = true;
			if (!wakeLive && path.length < 2) return;

			clearing.fill(0);
			bank.fill(0);
			let any = false;
			for (let k = 1; k < path.length; k++) {
				const p1 = path[k - 1];
				const p2 = path[k];
				if (p2.brk) continue;
				const p0 = p1.brk ? mirror(p1, p2) : path[k - 2];
				const p3 = k + 1 < path.length && !path[k + 1].brk ? path[k + 1] : mirror(p2, p1);
				// Sample finely where the wake is narrow (near the cursor), coarser behind.
				const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
				const n = Math.max(1, Math.ceil(len / Math.max(1, wakeRadius(t - p2.t, p2.v) * 0.3)));
				for (let j = 0; j < n; j++) {
					const u = j / n;
					const [x, y] = spline(p0, p1, p2, p3, u);
					stampWake(x, y + oy, t - (p1.t + (p2.t - p1.t) * u), p1.v + (p2.v - p1.v) * u);
					any = true;
				}
			}
			wakeLive = any;
		}

		// Visit every cell within radius r of (cx, cy) with its 0..1 distance.
		function disc(cx: number, cy: number, r: number, fn: (i: number, d: number) => void) {
			const x0 = Math.max(0, Math.floor(cx - r));
			const x1 = Math.min(cols - 1, Math.ceil(cx + r));
			const y0 = Math.max(0, Math.floor(cy - r));
			const y1 = Math.min(rows - 1, Math.ceil(cy + r));
			for (let y = y0; y <= y1; y++) {
				for (let x = x0; x <= x1; x++) {
					const dx = x - cx;
					const dy = y - cy;
					const d = Math.sqrt(dx * dx + dy * dy) / r;
					if (d < 1) fn(y * cols + x, d);
				}
			}
		}

		// Normalised ellipse distance: <1 inside, 1 on the edge.
		function ell(a: number, b: number, ca: number, cb: number, ra: number, rb: number, rot: number) {
			const da = a - ca;
			const db = b - cb;
			const c = Math.cos(rot);
			const s = Math.sin(rot);
			const u = (da * c + db * s) / ra;
			const v = (-da * s + db * c) / rb;
			return Math.sqrt(u * u + v * v);
		}

		// Distance from (px, py) to the segment (ax, ay)–(bx, by).
		function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
			const vx = bx - ax;
			const vy = by - ay;
			const k = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
			return Math.hypot(px - ax - vx * k, py - ay - vy * k);
		}

		// Signed distance from (px, py) to the triangle a-b-c: negative inside.
		function sdTri(px: number, py: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
			const e0x = bx - ax, e0y = by - ay, e1x = cx - bx, e1y = cy - by, e2x = ax - cx, e2y = ay - cy;
			const v0x = px - ax, v0y = py - ay, v1x = px - bx, v1y = py - by, v2x = px - cx, v2y = py - cy;
			const k0 = Math.max(0, Math.min(1, (v0x * e0x + v0y * e0y) / (e0x * e0x + e0y * e0y)));
			const k1 = Math.max(0, Math.min(1, (v1x * e1x + v1y * e1y) / (e1x * e1x + e1y * e1y)));
			const k2 = Math.max(0, Math.min(1, (v2x * e2x + v2y * e2y) / (e2x * e2x + e2y * e2y)));
			const s = Math.sign(e0x * e2y - e0y * e2x);
			const d = Math.min(
				(v0x - e0x * k0) ** 2 + (v0y - e0y * k0) ** 2,
				(v1x - e1x * k1) ** 2 + (v1y - e1y * k1) ** 2,
				(v2x - e2x * k2) ** 2 + (v2y - e2y * k2) ** 2
			);
			const side = Math.min(
				s * (v0x * e0y - v0y * e0x),
				s * (v1x * e1y - v1y * e1x),
				s * (v2x * e2y - v2y * e2x)
			);
			return -Math.sqrt(d) * Math.sign(side);
		}

		// A perched butterfly seen side-on: body along the edge, wings folded up above
		// it (flattening as they open, since we then see them edge-on), antennae forward.
		function stampSide(bf: Butterfly) {
			const S = size * depthScale(bf);
			const open = Math.abs(Math.cos(bf.flapPhase));
			const hgt = 0.55 + 0.45 * (1 - open);

			const by = bf.y + oy; // canvas row
			const inv = isLight(bf); // this butterfly's kind, read once rather than per cell
			const R = Math.ceil(S * 1.1);
			const x0 = Math.max(0, Math.floor(bf.x - R));
			const x1 = Math.min(cols - 1, Math.ceil(bf.x + R));
			const y0 = Math.max(0, Math.floor(by - R));
			const y1 = Math.min(rows - 1, Math.ceil(by + R));

			for (let y = y0; y <= y1; y++) {
				for (let x = x0; x <= x1; x++) {
					const a = ((x - bf.x) * bf.face) / S; // forward
					const u = -(y - by) / S; // up
					const wu = u / hgt;

					// Folded wings: a triangular forewing rising to a point up and forward of
					// the body (distances in S units, rounded by 0.05), the rounder hindwing
					// lower and behind it.
					const foreSd = sdTri(a, wu, 0.24, 0.06, 0.2, 0.95, -0.34, 0.12) - 0.05;
					const hind = ell(a, wu, -0.26, 0.26, 0.26, 0.23, 0.15);
					const body = Math.min(
						ell(a, u, -0.06, 0.06, 0.3, 0.06, 0), // abdomen + thorax
						ell(a, u, 0.28, 0.09, 0.065, 0.065, 0) // head
					);
					// Short antennae with clubbed tips, and legs down to the edge.
					const antenna = Math.min(
						segDist(a, u, 0.3, 0.14, 0.44, 0.4),
						segDist(a, u, 0.27, 0.14, 0.36, 0.42)
					);
					const club = Math.min(Math.hypot(a - 0.44, u - 0.4), Math.hypot(a - 0.36, u - 0.42));
					const legs = Math.min(
						segDist(a, u, 0.12, 0.02, 0.18, -0.1),
						segDist(a, u, -0.04, 0.02, -0.08, -0.1)
					);

					const foreCov = smooth(0.03, -0.03, foreSd);
					const hindCov = smooth(1.05, 0.8, hind);
					const wingCov = u > 0.02 ? Math.max(foreCov, hindCov) : 0;
					const bodyCov = Math.max(
						smooth(1.2, 0.7, body),
						smooth(0.045, 0.02, antenna),
						smooth(0.07, 0.04, club),
						smooth(0.03, 0.012, legs)
					);
					const cov = Math.max(wingCov, bodyCov);
					if (cov <= 0) continue;

					// Dark rim, lighter inside, a pale spot near the forewing tip.
					const inner = Math.max(smooth(0, 0.18, -foreSd), smooth(0.95, 0.35, hind));
					let tone = 0.04 + 0.34 * inner;
					tone = Math.max(tone, 0.55 * smooth(1, 0.4, ell(a, wu, 0.1, 0.7, 0.07, 0.07, 0)));
					tone += (1 - bf.z) * 0.08;
					if (bodyCov > wingCov) tone = 0;

					if (inv) tone = 1 - tone;
					const i = y * cols + x;
					field[i] = field[i] * (1 - cov) + tone * cov;
					if (cov > 0.35) bfMask[i] = 1;
				}
			}
		}

		// Stamp one butterfly into the brightness field.
		function stamp(bf: Butterfly) {
			if (bf.side >= 0.5) return stampSide(bf);
			const S = size * depthScale(bf);
			const hx = Math.cos(bf.heading);
			const hy = Math.sin(bf.heading);

			// Wing flap seen from above: span shrinks as wings rise/fall. Settling onto a
			// perch, the wings close up before it turns side-on.
			const flap = Math.cos(bf.flapPhase);
			const span = 0.15 + 0.85 * Math.abs(flap) * (1 - Math.min(1, bf.side * 2));
			const fold = 1 - span; // darker when folded (we see wing edge-on)

			const by = bf.y + oy; // canvas row
			const inv = isLight(bf); // this butterfly's kind, read once rather than per cell
			const R = Math.ceil(S * 1.1);
			const x0 = Math.max(0, Math.floor(bf.x - R));
			const x1 = Math.min(cols - 1, Math.ceil(bf.x + R));
			const y0 = Math.max(0, Math.floor(by - R));
			const y1 = Math.min(rows - 1, Math.ceil(by + R));

			for (let y = y0; y <= y1; y++) {
				for (let x = x0; x <= x1; x++) {
					const dx = x - bf.x;
					const dy = y - by;
					const a = (dx * hx + dy * hy) / S; // forward
					const bRaw = (-dx * hy + dy * hx) / S; // sideways
					const b = Math.abs(bRaw) / span;

					// Forewing (big, swept forward) + hindwing (rounder, trailing).
					const fore = ell(a, b, 0.14, 0.46, 0.3, 0.46, -0.55);
					const hind = ell(a, b, -0.24, 0.34, 0.26, 0.3, 0.35);
					const body = ell(a, Math.abs(bRaw), -0.02, 0, 0.42, 0.06, 0);

					const wingD = Math.min(fore, hind);
					const wingCov = smooth(1.05, 0.8, wingD);
					const bodyCov = smooth(1.2, 0.7, body);
					const cov = Math.max(wingCov, bodyCov);
					if (cov <= 0) continue;

					// Wing tone: dark rim, lighter middle, a pale spot on each forewing.
					let tone = 0.04 + 0.34 * smooth(0.95, 0.35, wingD);
					const spot = ell(a, b, 0.22, 0.58, 0.09, 0.09, 0);
					tone = Math.max(tone, 0.55 * smooth(1, 0.4, spot));
					tone *= 1 - 0.6 * fold;
					tone += (1 - bf.z) * 0.08; // further away, a touch fainter
					if (bodyCov > wingCov) tone = 0;

					if (inv) tone = 1 - tone;
					const i = y * cols + x;
					field[i] = field[i] * (1 - cov) + tone * cov;
					if (cov > 0.35) bfMask[i] = 1;
				}
			}
		}

		function move(bf: Butterfly, dt: number) {
			// Drift slowly nearer and further away; settle fairly near while on a perch.
			if (bf.mode === 'fly') {
				bf.dz += (Math.random() - 0.5) * dt * 0.6;
				bf.dz -= bf.dz * dt * 0.5;
				bf.dz = Math.max(-0.15, Math.min(0.15, bf.dz));
				bf.z += bf.dz * dt;
				if (bf.z < 0 || bf.z > 1) {
					bf.z = Math.max(0, Math.min(1, bf.z));
					bf.dz = -bf.dz;
				}
			} else {
				bf.z += (0.75 - bf.z) * Math.min(1, dt * 1.5);
			}
			const S = size * depthScale(bf);
			const perch = perches[bf.perchIdx];

			if (bf.mode === 'perch') {
				const startled = push > 0 && ptrIn && Math.hypot(bf.x - ptrX, bf.y - ptrY) < S * 3;
				bf.perchT -= dt;
				if (!perchOk(perch, S) || bf.perchT <= 0 || startled) {
					takeOff(bf, startled);
				} else {
					// Sit on the top edge (following it as the page scrolls) and turn side-on:
					// wings mostly folded shut, now and then slowly opening.
					[bf.x, bf.y] = perchSpot(bf, perch!, S);
					bf.heading = turnToward(bf.heading, -Math.PI / 2, Math.min(1, dt * 4));
					bf.side = Math.min(1, bf.side + dt * 2.5);
					// Rest with wings shut, then one slow open-and-close, then rest again.
					if (bf.glide > 0) {
						bf.glide -= dt;
					} else {
						const half = Math.floor((bf.flapPhase - Math.PI / 2) / Math.PI);
						bf.flapPhase += dt * 0.3 * flapRate * TAU;
						if (Math.floor((bf.flapPhase - Math.PI / 2) / Math.PI) !== half) {
							bf.flapPhase = Math.PI / 2 + (half + 1) * Math.PI; // shut again
							bf.glide = 3 + Math.random() * 4;
						}
					}
					return;
				}
			}

			bf.side = Math.max(0, bf.side - dt * 4); // back to the top-down view in flight

			// Free wandering: the turn rate itself drifts randomly.
			bf.turn += (Math.random() - 0.5) * dt * 8;
			bf.turn -= bf.turn * dt * 0.7;
			bf.turn = Math.max(-2.2, Math.min(2.2, bf.turn));
			let h = bf.heading + bf.turn * dt;
			let approach = 1; // speed factor: a little brisker while heading for a perch

			if (bf.mode === 'land') {
				bf.perchT -= dt;
				if (!perchOk(perch, S) || bf.perchT <= 0) {
					bf.mode = 'fly';
					bf.landCooldown = 6;
				}
			}

			if (bf.mode === 'land' && perchOk(perch, S)) {
				const [tx, ty] = perchSpot(bf, perch, S);
				// Come in from above or the sides, never up from behind the element: from
				// below its top edge, first slip out past its nearer side, then climb up
				// beside it. Once above the edge, head straight for the spot.
				let gx = tx;
				let gy = ty;
				// Once it's been clearly above the edge, keep coming straight in, even if the
				// final descent dips a touch below the edge line.
				if (bf.y < perch.y0 - S * 0.8) bf.overEdge = true;
				if (!bf.overEdge && bf.y > perch.y0 - S * 0.05) {
					const beside = bf.x < perch.x0 - S * 2 || bf.x > perch.x1 + S * 2;
					gx = bf.x < (perch.x0 + perch.x1) / 2 ? perch.x0 - S * 3 : perch.x1 + S * 3;
					gy = beside ? perch.y0 - S * 4 : Math.max(bf.y, perch.y1 + S * 2);
				}
				const d = Math.hypot(tx - bf.x, ty - bf.y);
				if (gx === tx && d < S * 1.5) {
					// Final glide: ease straight onto the spot (never crawling), then settle
					// facing the way it came in.
					const ang = Math.atan2(ty - bf.y, tx - bf.x);
					const step = Math.min(d, Math.max(S * 0.6, d * 2.5) * speed * dt);
					bf.x += Math.cos(ang) * step;
					bf.y += Math.sin(ang) * step;
					bf.heading = turnToward(bf.heading, ang, Math.min(1, dt * 6));
					bf.flapPhase += dt * bf.flapF * flapRate * TAU;
					if (d - step < 0.5) {
						bf.x = tx;
						bf.y = ty;
						bf.mode = 'perch';
						bf.face = Math.cos(bf.heading) >= 0 ? 1 : -1;
						bf.perchT = 4 + Math.random() * 8;
						bf.flapPhase = Math.PI / 2; // wings shut
						bf.glide = 2 + Math.random() * 3; // rest a moment before any opening
					}
					return;
				}
				const dg = Math.hypot(gx - bf.x, gy - bf.y);
				h = turnToward(h, Math.atan2(gy - bf.y, gx - bf.x), Math.min(1, dt * (dg < S * 4 ? 8 : 3)));
				approach = 1.3;
			} else {
				// Near a screen edge, curve back toward the middle.
				const m = S * 4;
				const depth = Math.max(
					(m - bf.x) / m,
					(bf.x - (cols - m)) / m,
					(m - bf.y) / m,
					(bf.y - (vpRows - m)) / m
				);
				if (depth > 0) {
					const toCenter = Math.atan2(vpRows / 2 - bf.y, cols / 2 - bf.x);
					h = turnToward(h, toCenter, Math.min(1, depth * dt * 3));
				}

				// Keep out of the plain areas: veer off when close, head for the nearest
				// edge when inside (e.g. content scrolled over them, or just took off).
				for (const r of rects) {
					const margin = S * 2;
					let dx = bf.x - Math.max(r.x0, Math.min(bf.x, r.x1));
					let dy = bf.y - Math.max(r.y0, Math.min(bf.y, r.y1));
					const d = Math.hypot(dx, dy);
					let k: number;
					if (d === 0) {
						const edges = [bf.x - r.x0, r.x1 - bf.x, bf.y - r.y0, r.y1 - bf.y];
						const e = edges.indexOf(Math.min(...edges));
						dx = e === 0 ? -1 : e === 1 ? 1 : 0;
						dy = e === 2 ? -1 : e === 3 ? 1 : 0;
						k = 1;
					} else if (d < margin) {
						k = 1 - d / margin;
					} else {
						continue;
					}
					h = turnToward(h, Math.atan2(dy, dx), Math.min(1, k * dt * 4));
				}

				// Startle away from the cursor.
				if (push > 0 && ptrIn) {
					const dx = bf.x - ptrX;
					const dy = bf.y - ptrY;
					const d = Math.hypot(dx, dy);
					const reach = pushRadius / PIXEL + S * 2;
					if (d < reach) {
						h = turnToward(h, Math.atan2(dy, dx), Math.min(1, (1 - d / reach) * dt * 8));
						bf.fright = 1;
					}
				}

				// Now and then, head for a perch (at most two butterflies at a time).
				bf.landCooldown -= dt;
				if (bf.landCooldown <= 0 && perches.length && Math.random() < dt * 0.08) {
					const idx = Math.floor(Math.random() * perches.length);
					const busy = flock.filter((o) => o.mode !== 'fly').length;
					if (busy < 2 && perchOk(perches[idx], S)) {
						bf.mode = 'land';
						bf.perchIdx = idx;
						bf.perchT = 25; // give up if it can't get there in time
						bf.overEdge = false;
						bf.perchU = Math.random();
						// Keep clear of anyone already on, or heading for, that edge.
						for (const o of flock) {
							if (o !== bf && o.mode !== 'fly' && o.perchIdx === idx && Math.abs(o.perchU - bf.perchU) < 0.3) {
								bf.perchU = (bf.perchU + 0.5) % 1;
							}
						}
					} else {
						bf.landCooldown = 3;
					}
				}
			}
			bf.fright = Math.max(0, bf.fright - dt * 0.8);

			// Only veer off when actually about to collide; no flocking.
			for (const o of flock) {
				if (o === bf) continue;
				const dx = bf.x - o.x;
				const dy = bf.y - o.y;
				const d = Math.hypot(dx, dy);
				const minD = (S + size * depthScale(o)) * 0.9;
				if (d < minD) h = turnToward(h, Math.atan2(dy, dx), Math.min(1, (1 - d / minD) * dt * 4));
			}
			bf.heading = h;

			// Every so often, stop flapping and glide with wings open.
			if (bf.glide > 0) bf.glide -= dt;
			else if (Math.random() < dt * 0.12) bf.glide = 0.6 + Math.random() * 1.4;
			const holding = bf.glide > 0 && Math.abs(Math.cos(bf.flapPhase)) > 0.96;
			if (!holding) bf.flapPhase += dt * bf.flapF * flapRate * TAU;

			// Nearer butterflies also cover ground a little faster.
			const beat = Math.max(0, Math.sin(bf.flapPhase * 2));
			const sp =
				bf.speed *
				(holding ? 0.8 : 0.6 + 0.6 * beat) *
				(1 + 1.5 * bf.fright) *
				(0.85 + 0.3 * bf.z) *
				approach;
			bf.x += Math.cos(h) * sp * speed * dt;
			bf.y += (Math.sin(h) * sp - beat * 5 * Math.min(1, approach)) * speed * dt;

			// Leave a wake.
			disc(bf.x, bf.y + oy, S * 0.9, (i, d) => {
				const w = smooth(1, 0, d) * 0.7;
				if (w > wake[i]) wake[i] = w;
			});
		}

		function frame(now: number) {
			frameCount++;
			const t = (now - start) / 1000;
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			const showPlasma = plasma; // read the prop once per frame, not per cell

			// Intro progress, 0..1.
			if (introT0 < 0) introT0 = now;
			const introK = intro > 0 && !reduceMotion ? Math.min(1, (now - introT0) / intro) : 1;

			// Element positions: re-measure when something resized, the clear settings changed,
			// or (a fallback for other layout shifts) every 90 frames.
			syncObserved();
			const key = `${clearPad}|${clearRadius}|${clearWidth}|${clearFloor}|${fade}`;
			if (key !== maskKey) {
				maskKey = key;
				measureDirty = true;
				maskDirty = true; // fade/floor changes need a rebuild even if nothing moved
			}
			if (measureDirty || frameCount % 90 === 0) measure();

			// Scroll. Between frames the canvas scrolls natively with the page; here it's
			// re-anchored by whole cells, the page-anchored buffers are shifted to match, and
			// only the rows that come into it are computed. Flying butterflies and the cursor's
			// path live on the screen, so they're carried along; one pushed far off-screen comes
			// back in at the other edge.
			const nextScroll = window.scrollY / PIXEL;
			const dScroll = nextScroll - scrollCells;
			scrollCells = nextScroll;
			const nextWy0 = Math.floor(scrollCells) - OVER;
			const k = nextWy0 - wy0;
			if (k) {
				wy0 = nextWy0;
				shiftRows(wake, k);
				shiftRows(mask, k);
				shiftRows(plasmaBase, k);
				bg.style.transform = `translateY(${wy0 * PIXEL}px)`;
			}
			oy = scrollCells - wy0;
			toScreen();
			if (dScroll) {
				for (const bf of flock) {
					if (bf.mode === 'perch') continue;
					bf.y -= dScroll;
					const S = size * depthScale(bf);
					if (bf.y < -S * 3) bf.y = vpRows + S;
					else if (bf.y > vpRows + S * 3) bf.y = -S;
				}
				for (const p of path) p.y -= dScroll;
				scrolledSinceRec += Math.abs(dScroll);
			}

			if (maskDirty) {
				maskRows(0, rows);
				maskDirty = false;
			} else if (k) {
				const [r0, r1] = exposed(k);
				maskRows(r0, r1);
			}
			// The plasma drifts slowly, so a full pass every third frame is plenty.
			if (!showPlasma) {
				plasmaFull = true; // not drawn: skip it, and recompute it all if it comes back
			} else if (plasmaFull || frameCount % 3 === 0) {
				plasmaRows(0, rows, t);
				plasmaFull = false;
			} else if (k) {
				const [r0, r1] = exposed(k);
				plasmaRows(r0, r1, t);
			}

			// Keep flock size in sync with `count`.
			const first = flock.length === 0;
			while (flock.length < count) flock.push(spawn(first));
			if (flock.length > count) flock.length = count;

			// Open with a couple already perched, facing each other, so visitors notice
			// they can land. Wait (briefly) for the perch element to be laid out.
			if (!seeded && t > 3) seeded = true;
			if (!seeded && perchOk(perches[0], size * 1.2)) {
				seeded = true;
				const p = perches[0];
				flock.slice(0, 2).forEach((bf, k) => {
					bf.mode = 'perch';
					bf.perchIdx = 0;
					bf.perchU = k === 0 ? 0.22 : 0.78;
					bf.perchT = 12 + Math.random() * 6; // long enough to be noticed
					bf.side = 1;
					bf.z = 0.75;
					bf.face = k === 0 ? 1 : -1;
					bf.flapPhase = Math.PI / 2; // wings shut
					bf.glide = 2 + Math.random() * 3; // rest a moment before any opening
					bf.heading = -Math.PI / 2;
					[bf.x, bf.y] = perchSpot(bf, p, size * depthScale(bf));
				});
			}

			for (const bf of flock) move(bf, dt);
			buildWake(t);

			// Assemble the field: the cached plasma, cleared along the cursor's wake, plus
			// butterfly trails.
			const contrast = invert ? 0 : 1;
			const trailK = trail;
			const decay = Math.exp(-dt * 1.2);
			for (let y = 0; y < rows; y++) {
				const fy = y / G;
				const iy = fy | 0;
				const ty = fy - iy;
				for (let x = 0; x < cols; x++) {
					const i = y * cols + x;
					let v = showPlasma ? plasmaBase[i] : 1; // 1 = no ink, so only butterflies mark it
					if (wakeLive) {
						const fx = x / G;
						const ix = fx | 0;
						const tx = fx - ix;
						const a = iy * gw + ix;
						const b = a + gw;
						const c =
							(clearing[a] * (1 - tx) + clearing[a + 1] * tx) * (1 - ty) +
							(clearing[b] * (1 - tx) + clearing[b + 1] * tx) * ty;
						const e =
							(bank[a] * (1 - tx) + bank[a + 1] * tx) * (1 - ty) +
							(bank[b] * (1 - tx) + bank[b + 1] * tx) * ty;
						// Low values are ink: lift them inside the wake, deepen them on its banks.
						v += (1 - v) * c * 0.9;
						v -= v * e * (1 - c) * 0.4;
					}
					wake[i] *= decay;
					v += (contrast - v) * wake[i] * trailK;
					field[i] = v;
				}
			}

			// Far butterflies first, so nearer ones are drawn over them. Halos go before
			// any wings so one butterfly's halo never paints over another's.
			const byDepth = [...flock].sort((a, b) => a.z - b.z);
			bfMask.fill(0);
			const haloK = halo;
			if (haloK > 0) {
				for (const bf of byDepth) {
					const c = isLight(bf) ? 0 : 1; // bend toward this butterfly's own kind
					disc(bf.x, bf.y + oy, size * depthScale(bf) * 3, (i, d) => {
						field[i] += (c - field[i]) * smooth(1, 0, d) * haloK;
					});
				}
			}
			for (const bf of byDepth) stamp(bf);

			// Ordered dither. Low values are the "ink" in both themes:
			// black dots on the light ground, white dots on the dark ground.
			// Cells drop out (transparent) through a second, offset Bayer pass, so
			// the edges of the plain areas dissolve in the same dot pattern. Butterflies
			// always show, even over plain areas, so they can perch on content.
			// During the intro, everything inside a shrinking oval (centred on the screen)
			// drops out the same way, so the dither closes in from the edges.
			const introOn = introK < 1;
			const ease = introK * introK * (3 - 2 * introK); // in and out, so the whole sweep reads
			const revealR = 1.6 - ease * 2.1;
			const hcx = cols / 2;
			const hcy = vpRows / 2;
			const data = img.data;
			const inkWhite = dark;
			for (let y = 0; y < rows; y++) {
				const wy = wy0 + y; // page row, keeps the dot screen fixed to the page
				const ny = (y + 0.5 - oy - hcy) / hcy;
				const ny2 = ny * ny;
				for (let x = 0; x < cols; x++) {
					const p = y * cols + x;
					const i = p * 4;
					let vis = bfMask[p] ? 1 : showPlasma ? mask[p] : 0;
					if (introOn) {
						const nx = (x + 0.5 - hcx) / hcx;
						vis *= smooth(revealR, revealR + 0.5, Math.sqrt(nx * nx + ny2));
					}
					if (vis < 1 && vis <= (bayer[((wy + 2) & 3) * 4 + ((x + 1) & 3)] + 0.5) / 16) {
						data[i + 3] = 0;
						continue;
					}
					const thr = (bayer[(wy & 3) * 4 + (x & 3)] + 0.5) / 16;
					const on = field[p] > thr !== inkWhite ? 255 : 0;
					data[i] = data[i + 1] = data[i + 2] = on;
					data[i + 3] = 255;
				}
			}
			ctx.putImageData(img, 0, 0);

			if (introK >= 1 && !readyFired) {
				readyFired = true;
				onready?.();
			}
			raf = requestAnimationFrame(frame);
		}

		// The canvas ignores pointer events, so watch the pointer on the window.
		const onPointerMove = (e: PointerEvent) => {
			ptrX = e.clientX / PIXEL;
			ptrY = e.clientY / PIXEL;
			ptrIn = true;
		};
		const onPointerLeave = () => {
			ptrIn = false;
			ptrBreak = true;
		};
		const onFonts = () => {
			measureDirty = true;
			sizeWrap();
		};

		resize();
		// Start anchored where the page already is.
		scrollCells = window.scrollY / PIXEL;
		wy0 = Math.floor(scrollCells) - OVER;
		bg.style.transform = `translateY(${wy0 * PIXEL}px)`;
		window.addEventListener('resize', resize);
		window.addEventListener('pointermove', onPointerMove, { passive: true });
		document.documentElement.addEventListener('pointerleave', onPointerLeave);
		window.addEventListener('blur', onPointerLeave);
		document.fonts?.ready.then(onFonts);
		raf = requestAnimationFrame(frame);
		redrawNow = () => {
			cancelAnimationFrame(raf); // frame() schedules the next one itself
			frame(performance.now());
		};

		return () => {
			redrawNow = undefined;
			cancelAnimationFrame(raf);
			ro.disconnect();
			window.removeEventListener('resize', resize);
			window.removeEventListener('pointermove', onPointerMove);
			document.documentElement.removeEventListener('pointerleave', onPointerLeave);
			window.removeEventListener('blur', onPointerLeave);
		};
	});
</script>

<div class="bg-wrap" bind:this={wrap} aria-hidden="true">
	<canvas class="bg" style:opacity bind:this={bg}></canvas>
</div>

<style>
	/* Spans the whole page (height set in sizeWrap) so the canvas can sit in the page and
	   scroll natively with it; clips, so the canvas's overscan never lengthens the page. */
	.bg-wrap {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		overflow: hidden;
		pointer-events: none;
		z-index: -1;
	}
	/* Light theme: multiply so only the dark dots mark the page, like ink on paper (the
	   white cells drop out instead of washing the ground out). On the wrapper, since it's
	   the layer that meets the page; blending the canvas inside it would reach nothing. */
	:global(body:not(.dark)) .bg-wrap {
		mix-blend-mode: multiply;
	}
	/* Sized in resize(); re-anchored within the page in frame(). */
	.bg {
		display: block;
		image-rendering: pixelated;
		will-change: transform;
	}
</style>
