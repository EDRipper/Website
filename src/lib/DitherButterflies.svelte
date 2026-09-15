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
		avoidEls = [], // elements butterflies never fly over (they bounce off them), without clearing the background there
		campEl = null, // an element whose foot holds a dithered tent and campfire, smoke billowing up from it
		intro = 0, // ms for the dither to close in from the screen edges on load; 0 = none
		onready, // called once that intro has finished (straight away if there isn't one)
		clearWidth = 0, // px; with no clearEls, a plain column down the middle, 0 = none
		fade = 200, // px; dithered fade from the plain areas out to full dither
		push = 0.6, // strength of the cursor's wake, a clearing that trails its path; 0 = off
		pushRadius = 20, // px; how far each side of the path the wake spreads at full speed
		plasma = true, // false: skip the dithered plasma and draw only the butterflies
		plasmaBg = true, // false: the plasma is never drawn as the background, only as a scene's mist
		// A moonlit landscape drawn into the dither, the plasma drifting through it as mist.
		// 'backdrop': it fills the screen in place of the plasma. 'footer': it rises out of the
		// plasma at the foot of the page, its layers trailing the scroll by depth. 'header': the
		// same on the page's first screen, sinking behind its own trees as the page scrolls.
		scene = '',
		sceneOpacity = 0.16, // like opacity, for the landscape's dots
		sceneEnd = null, // footer: the element whose bottom edge the landscape stands on (default: the page's end)
		mist = 0.45, // 0..1, how thick that mist gets in the valleys
		starSky = 0, // screens down the page that start as a night sky (the plasma faded out, shimmering stars), easing into the plasma; 0 = none
		starOpacity = 0.45, // like opacity, for the stars' dots
		bfOpacity = 0, // 0..1, how solid the butterflies' own coloured dots are; 0 = plain dither
		bfSaturation = 0.45, // 0..1, how strong their colour is
		bfLightness = 0.7 // 0..1; each one's hue comes from where it is on the page
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
		avoidEls?: (Element | null | undefined)[];
		campEl?: Element | null;
		intro?: number;
		onready?: () => void;
		clearWidth?: number;
		fade?: number;
		push?: number;
		pushRadius?: number;
		plasma?: boolean;
		plasmaBg?: boolean;
		scene?: '' | 'backdrop' | 'footer' | 'header';
		sceneOpacity?: number;
		sceneEnd?: Element | null;
		mist?: number;
		starSky?: number;
		starOpacity?: number;
		bfOpacity?: number;
		bfSaturation?: number;
		bfLightness?: number;
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
		show: number; // 0..1; faded out while up in the night sky (see starSky)
		bumps: number; // how hemmed in by avoidEls it's been lately (see move)
		esc: { x: number; y: number; t: number } | null; // a free spot it's making for after getting hemmed in (page cells; t = seconds left)
		front: boolean; // flies in front of the page's content, on the front canvas
	};

	// A plain (undithered) area, in cells, with corner radius `rad`. Edges may be ±Infinity.
	type Rect = { x0: number; y0: number; x1: number; y1: number; rad: number };

	let wrap!: HTMLDivElement;
	let bg!: HTMLCanvasElement;
	let frontWrap!: HTMLDivElement; // the same again, above the page's content, for front butterflies
	let fg!: HTMLCanvasElement;

	// Redraw straight away (rather than on the next animation frame) when the look changes,
	// so a theme switch's crossfade captures the new dots, not the old ones.
	let redrawNow: (() => void) | undefined;
	$effect(() => {
		void dark;
		void invert;
		void plasma;
		void plasmaBg;
		void scene;
		redrawNow?.();
	});

	onMount(() => {
		const ctx = bg.getContext('2d')!;
		const fctx = fg.getContext('2d')!;
		const PIXEL = 4; // on-screen size of each dither cell
		const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
		const TAU = Math.PI * 2;

		let cols = 0;
		let rows = 0; // canvas rows: the screen plus overscan above and below
		let img: ImageData;
		let fimg: ImageData; // the front canvas's pixels
		let frontField: Float32Array; // the front butterflies' brightness, 1 = nothing
		let frontMask: Uint8Array; // which front butterfly covers each cell (flock index + 1)
		let frontDrawn = false; // the front canvas has something on it to clear
		let field: Float32Array; // brightness 0..1 before dithering
		let wake: Float32Array; // butterfly trail strength 0..1
		let mask: Float32Array; // per-cell dither visibility 0..1 (page-anchored, cached)
		let plasmaBase: Float32Array; // the plasma alone (page-anchored, refreshed every few frames)
		let sceneBase: Float32Array; // the landscape with its mist (screen-anchored, see sceneRows)
		let sceneA: Uint8Array; // its dots' alpha: sceneOpacity, easing to opacity where it fades into the plasma
		let ridges: Float32Array[] = []; // each scene layer's ridge line, in screen rows per column
		let rects: Rect[] = []; // plain areas, in screen cells
		let perches: Rect[] = []; // perch elements, in screen cells
		let docRects: Rect[] = []; // the same two in page cells, which scrolling doesn't change
		let docPerches: Rect[] = [];
		let docAvoid: Rect[] = []; // avoidEls, in page cells
		let docCamp: Rect | null = null; // campEl, in page cells
		let avoid: Rect[] = []; // the same in screen cells
		let obstacles: Rect[] = []; // the plain areas and avoidEls together, for steering around
		let bfMask: Uint8Array; // which butterfly covers each cell this frame (flock index + 1; 0 = none)
		let stampId = 0; // the id stamp() writes into bfMask
		let starMask: Uint8Array; // cells a star covers this frame

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
		let scrollMax = 1; // px the page can scroll, for the scene's descent
		let sceneBottom = 0; // page px the footer's landscape stands on; 0 = the page's end
		function sizeWrap() {
			wrap.style.height = frontWrap.style.height = `${Math.max(document.body.offsetHeight, window.innerHeight)}px`;
			scrollMax = Math.max(1, document.body.offsetHeight - window.innerHeight);
			sceneDirty = true; // the footer's place on the page may have moved
		}

		// Element rects in page cells. Scrolling doesn't change these, so they're only
		// re-measured when something resizes (or occasionally, as a fallback).
		// What butterflies keep off inside avoidEls: the actual lines of text and visible boxes
		// (replaced elements, or anything with a border or background of its own), rather than
		// whole elements, which are often mostly empty space.
		const BOX_TAGS = new Set(['IMG', 'CANVAS', 'svg', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'VIDEO']);
		const range = document.createRange();
		function addAvoid(b: DOMRect, top: number, pad: number) {
			if (b.width === 0 || b.height === 0 || b.right < 0 || b.left > window.innerWidth) return;
			docAvoid.push({
				x0: (b.left - pad) / PIXEL,
				y0: (b.top + top - pad) / PIXEL,
				x1: (b.right + pad) / PIXEL,
				y1: (b.bottom + top + pad) / PIXEL,
				rad: 0
			});
		}
		function isBox(el: Element, cs: CSSStyleDeclaration) {
			if (BOX_TAGS.has(el.tagName)) return true;
			if (cs.backgroundImage !== 'none' || !/^(transparent|rgba\(.*,\s*0\))$/.test(cs.backgroundColor)) return true;
			const borders: [string, string][] = [
				[cs.borderTopWidth, cs.borderTopStyle],
				[cs.borderRightWidth, cs.borderRightStyle],
				[cs.borderBottomWidth, cs.borderBottomStyle],
				[cs.borderLeftWidth, cs.borderLeftStyle]
			];
			return borders.some(([w, s]) => parseFloat(w) > 0 && s !== 'none' && s !== 'hidden');
		}
		function collectAvoid(el: Element, top: number) {
			const cs = getComputedStyle(el);
			if (cs.display === 'none' || cs.visibility === 'hidden') return;
			if (isBox(el, cs)) {
				addAvoid(el.getBoundingClientRect(), top, 8);
				return; // whatever's inside is within it
			}
			const kids = el.childNodes;
			for (let k = 0; k < kids.length; k++) {
				const node = kids[k];
				if (node.nodeType === Node.TEXT_NODE) {
					if (!/\S/.test(node.textContent ?? '')) continue;
					range.selectNodeContents(node);
					const lines = range.getClientRects();
					for (let j = 0; j < lines.length; j++) addAvoid(lines[j], top, 6);
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					collectAvoid(node as Element, top);
				}
			}
		}

		// `full`: also re-walk avoidEls, which is slow-ish, so it's skipped for the periodic check.
		function measure(full = true) {
			const before = JSON.stringify(docRects);
			const top = window.scrollY;
			if (full) {
				docAvoid = [];
				for (const el of avoidEls) if (el) collectAvoid(el, top);
			}
			docCamp = null;
			if (campEl) {
				const b = campEl.getBoundingClientRect();
				if (b.width && b.height) {
					docCamp = {
						x0: b.left / PIXEL,
						y0: (b.top + top) / PIXEL,
						x1: b.right / PIXEL,
						y1: (b.bottom + top) / PIXEL,
						rad: 0
					};
				}
			}
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
			const endY = sceneEnd ? sceneEnd.getBoundingClientRect().bottom + top : 0;
			if (endY !== sceneBottom) {
				sceneBottom = endY;
				sceneDirty = true;
			}
			// Only rebuild the mask when the plain areas actually moved; the periodic
			// fallback re-measure usually finds nothing changed.
			if (JSON.stringify(docRects) !== before) maskDirty = true;
		}

		// Screen-cell copies of the page rects, for the butterflies (which live on the screen).
		function toScreen() {
			const s = scrollCells;
			rects = docRects.map((r) => ({ ...r, y0: r.y0 - s, y1: r.y1 - s }));
			perches = docPerches.map((r) => ({ ...r, y0: r.y0 - s, y1: r.y1 - s }));
			// Only what's on or near the screen: there can be hundreds of these down the page.
			avoid = [];
			for (const r of docAvoid) {
				if (r.y1 - s > -size * 4 && r.y0 - s < vpRows + size * 4) avoid.push({ ...r, y0: r.y0 - s, y1: r.y1 - s });
			}
			obstacles = avoid.length ? [...rects, ...avoid] : rects;
		}

		// Re-measure whenever the page body or any watched element changes size.
		const ro = new ResizeObserver(() => {
			measureDirty = true;
			sizeWrap();
		});
		ro.observe(document.body);
		let observed: Element[] = [];
		function syncObserved() {
			const els = [...clearEls, ...perchEls, ...avoidEls, campEl].filter((el): el is Element => !!el);
			if (els.length === observed.length && els.every((el, i) => el === observed[i])) return;
			for (const el of observed) ro.unobserve(el);
			for (const el of els) ro.observe(el);
			observed = els;
			measureDirty = true;
		}

		// Size multiplier including depth: further butterflies look a little smaller.
		const depthScale = (bf: Butterfly) => bf.scale * (0.8 + 0.4 * bf.z);
		// Whether this butterfly is drawn light. `invert` flips the whole flock; without the
		// plasma behind them (phones, or plasmaBg off) a light butterfly would have nothing to
		// show against, so all go dark.
		const isLight = (bf: Butterfly) => invert !== (bf.light && plasma && plasmaBg);

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
				if (obstacles.every((r) => rectDist(r, x, y) > S * 2)) break;
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
				show: 1,
				bumps: 0,
				esc: null,
				front: flock.length % 2 === 1, // every other one, so some pass over the text
				scale,
				speed: 12 + Math.random() * 12
			};
		}

		function resize() {
			cols = Math.max(1, Math.ceil(window.innerWidth / PIXEL));
			vpRows = Math.max(1, Math.ceil(window.innerHeight / PIXEL));
			rows = vpRows + OVER * 2 + 1;
			bg.width = fg.width = cols;
			bg.height = fg.height = rows;
			bg.style.width = fg.style.width = `${cols * PIXEL}px`;
			bg.style.height = fg.style.height = `${rows * PIXEL}px`;
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
			fimg = fctx.createImageData(cols, rows);
			frontField = new Float32Array(cols * rows);
			frontMask = new Uint8Array(cols * rows);
			field = new Float32Array(cols * rows);
			wake = new Float32Array(cols * rows);
			mask = new Float32Array(cols * rows);
			plasmaBase = new Float32Array(cols * rows);
			sceneBase = new Float32Array(cols * rows);
			sceneA = new Uint8Array(cols * rows);
			ridges = LAYERS.map(() => new Float32Array(cols));
			sceneDirty = true;
			bfMask = new Uint8Array(cols * rows);
			starMask = new Uint8Array(cols * rows);
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

		// Scene: a moonlit landscape, far snowy peaks down to a near pine forest, held to the
		// screen rather than the page. Scrolling lifts the nearer layers faster, so reading
		// down the page is like descending into the valley, and the pointer shifts them
		// sideways by depth. The plasma drifts through as mist pooling above each ridge.
		// Values are ink density (0 = plain ground, 1 = solid dots); light mode swaps the
		// tones so nearer layers are darker instead of the sky being brighter.
		type Layer = {
			base: number; // the ridge's lowest line, in screen heights from the top
			amp: number; // ridge height, in screen heights
			freq: number; // ridge features per screen height
			peaks: boolean; // sharp ridged peaks rather than rolling hills
			trees: number; // pine height, in screen heights; 0 = none
			rise: number; // backdrop: screen heights it lifts over the whole page's scroll
			follow: number; // footer: how closely it keeps up with the page scrolling in (1 = exactly)
			shift: number; // pointer parallax, as a fraction of the screen width
			tone: [number, number]; // ink density [dark, light]
			snow: number; // fraction of the ridge height above which it's snowy; > 1 = none
		};
		const LAYERS: Layer[] = [
			{ base: 0.5, amp: 0.3, freq: 1.3, peaks: true, trees: 0, rise: 0.05, follow: 0.45, shift: 0.004, tone: [0.44, 0.12], snow: 0.5 },
			{ base: 0.62, amp: 0.2, freq: 1.8, peaks: true, trees: 0, rise: 0.1, follow: 0.58, shift: 0.009, tone: [0.3, 0.24], snow: 0.7 },
			{ base: 0.74, amp: 0.1, freq: 1.1, peaks: false, trees: 0.03, rise: 0.16, follow: 0.72, shift: 0.016, tone: [0.15, 0.38], snow: 2 },
			{ base: 0.86, amp: 0.07, freq: 1.5, peaks: false, trees: 0.07, rise: 0.24, follow: 0.86, shift: 0.026, tone: [0.04, 0.54], snow: 2 },
			{ base: 1.3, amp: 0.05, freq: 0.9, peaks: false, trees: 0.5, rise: 0.36, follow: 1, shift: 0.04, tone: [0, 0.72], snow: 2 }
		];
		const CRATERS = [
			[-0.32, -0.18, 0.24],
			[0.28, 0.3, 0.17],
			[0.12, -0.46, 0.11],
			[-0.12, 0.44, 0.13]
		]; // x, y, radius, in moon radii
		let sceneDirty = true;
		let sceneShown = false; // drawn at all (a footer still far below the screen isn't)
		let sceneKey = '';
		let parX = 0; // smoothed pointer offset from the screen's middle, -0.5..0.5
		let parDrawn = 0; // the offset the scene was last drawn with
		let scrollBlur = 0; // px of motion blur on the background, eased toward the scroll speed
		let blurShown = 0; // what's actually set on the canvas

		const hash = (n: number) => {
			const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
			return s - Math.floor(s);
		};
		const noise = (x: number) => {
			const i = Math.floor(x);
			const f = x - i;
			return hash(i) + (hash(i + 1) - hash(i)) * f * f * (3 - 2 * f);
		};

		// Ridge height 0..1 at x (screen heights) for layer l: summed octaves of value noise,
		// folded into sharp creases for peaks.
		function ridgeShape(l: number, x: number) {
			const L = LAYERS[l];
			let sum = 0;
			let norm = 0;
			let a = 0.5;
			let fr = L.freq;
			for (let o = 0; o < 5; o++) {
				const n = noise(x * fr + l * 97.3 + o * 13.1);
				sum += a * (L.peaks ? 1 - Math.abs(n * 2 - 1) : n);
				norm += a;
				a *= 0.5;
				fr *= 2.1;
			}
			const h = sum / norm;
			return L.peaks ? Math.min(1, h * h * 1.5) : h;
		}

		// The scene for the whole canvas at time t, into sceneBase (as brightness, like the plasma).
		function sceneRows(t: number) {
			const footer = scene === 'footer';
			const framed = footer || scene === 'header'; // held to one screen of the page, not the screen
			const H = framed ? vpRows * 0.7 : vpRows; // the scene's height: a framed one sits low in its screen
			const top0 = vpRows - H; // the scene's top, on that screen
			const dk = dark ? 0 : 1;
			const nL = LAYERS.length;
			const prog = Math.min(1, Math.max(0, (scrollCells * PIXEL) / scrollMax));
			// Footer: the scene is framed on the page's last screen. frameTop is that screen's
			// top in screen rows: 0 once scrolled to the end, positive while still below.
			const endPx = sceneBottom || scrollMax + window.innerHeight;
			// Framed: the top of the scene's screen, in screen rows. The header's is the page's first
			// screen; the footer's its last (or the one ending at sceneEnd).
			const frameTop =
				scene === 'header' ? -scrollCells : footer ? (endPx - window.innerHeight) / PIXEL - scrollCells : 0;
			const groundRow = frameTop + vpRows; // footer: where the landscape ends, plain ground below
			// The sky starts at the top of the screen, or for the footer just above the farthest
			// ridge's frame, fading in from the plasma over the half screen above that.
			const skyTop = (framed ? top0 + frameTop * LAYERS[0].follow : 0) - 0.1 * H;
			const skyFade = footer ? 0.5 * H : 0;
			const R = 0.06 * H;
			const mx = cols * 0.76 - parX * 0.002 * cols;
			const my = framed ? top0 + 0.18 * H + frameTop * 0.55 : (0.18 - 0.03 * prog) * H;
			parDrawn = parX;
			sceneDirty = false;
			// (Not yet risen into the canvas, or for a framed scene, already scrolled up past it.)
			sceneShown =
				Math.min(skyTop - skyFade, my - R * 4) < rows - oy && (!framed || groundRow + 0.22 * vpRows > -oy);
			if (!sceneShown) return; // nothing on the canvas yet, so the plasma shows as usual
			const groundA = Math.round(Math.min(1, Math.max(0, opacity)) * 255);
			const sceneAlpha = Math.round(Math.min(1, Math.max(0, sceneOpacity)) * 255);
			const bases = new Float64Array(nL);

			// Ridge lines: the rolling or peaked ground, with pines stood along it.
			for (let l = 0; l < nL; l++) {
				const L = LAYERS[l];
				const r = ridges[l];
				const sh = -parX * L.shift * cols;
				const baseRow = (bases[l] = framed ? top0 + L.base * H + frameTop * L.follow : (L.base - L.rise * prog) * H);
				const ground = (xw: number) => baseRow - L.amp * H * ridgeShape(l, xw / H);
				const treeH = L.trees * H;
				const gap = treeH * 0.55; // tree spacing, cells
				for (let x = 0; x < cols; x++) {
					const xw = x + sh;
					let ridge = ground(xw);
					if (treeH > 0) {
						const k0 = Math.floor(xw / gap);
						for (let k = k0 - 1; k <= k0 + 1; k++) {
							if (hash(k * 1.7 + l * 31) < 0.12) continue; // a clearing
							const cx = (k + 0.2 + 0.6 * hash(k * 5.3 + l * 7)) * gap;
							const th = treeH * (0.55 + 0.45 * hash(k * 2.3 + l * 3));
							const dx = Math.abs(xw - cx) / (th * 0.3);
							if (dx < 1) ridge = Math.min(ridge, ground(cx) - th * (1 - dx));
						}
					}
					r[x] = ridge;
				}
			}

			const horizon = bases[0];
			// Kept below the far peaks, so they stand out moonlit. A framed scene's sky is plain: just
			// the stars and the moon, with no glow or mist.
			const skyGlow = framed ? 0 : dark ? 0.22 : 0.05;
			const rimD = 0.14;
			const shadeSign = dark ? 1 : -1; // moonlit faces: more white dots, or fewer black ones
			const snowD = dark ? 0.9 : 0.02;
			const mistD = dark ? 0.5 : 0;
			const band = 0.1 * H;
			const twinkle = !reduceMotion;

			for (let y = 0; y < rows; y++) {
				const sy = y - oy; // screen row
				const row = y * cols;
				const g = smooth(skyTop, horizon, sy);
				const skyD = skyGlow * g * g;
				const skyW = footer ? smooth(skyTop - skyFade, skyTop, sy) : 1; // sky rather than plasma
				const starRow = Math.floor(sy);
				const starCut = 0.9965 + 0.003 * g; // fewer stars down toward the glow
				for (let x = 0; x < cols; x++) {
					let l = nL - 1;
					while (l >= 0 && sy < ridges[l][x]) l--;
					let d: number;
					let w = 1; // how much of this cell is the scene rather than the plasma
					if (l < 0) {
						w = skyW;
						const below = plasmaBg ? 1 - plasmaBase[row + x] : 0; // what the sky fades up from
						d = w < 1 ? skyD * w + below * (1 - w) : skyD;
						const md = Math.hypot(x - mx, sy - my);
						if (dark) {
							const glow = smooth(R * 4, R, md);
							if (!framed) {
								d += 0.28 * glow * glow;
								w = Math.max(w, glow);
							}
							const hs = hash(x * 12.9898 + starRow * 78.233);
							if (w > 0.3 && hs > starCut && md > R * 1.6) {
								const tw = twinkle ? 0.5 + 0.5 * Math.sin(t * (0.8 + hs * 3000 % 2) + x) : 1;
								d = Math.max(d, 0.5 + 0.5 * tw);
							}
						}
						if (md < R + 1) {
							let disc: number;
							if (dark) {
								disc = 0.95 - 0.2 * smooth(R * 0.75, R, md); // a little darker at the edge
								for (const [cx, cy, cr] of CRATERS) {
									if (Math.hypot(x - mx - cx * R, sy - my - cy * R) < cr * R) disc -= 0.3;
								}
							} else {
								disc = Math.abs(md - R) < 1.2 ? 0.7 : 0.04; // the sun, in outline
							}
							const cov = smooth(R + 1, R - 1, md);
							d += (disc - d) * cov;
							w = Math.max(w, cov);
						}
					} else {
						const L = LAYERS[l];
						const r = ridges[l];
						const dd = sy - r[x]; // rows below the ridge
						d = L.tone[dk] + rimD * smooth(2.5, 0.5, dd);
						if (L.peaks) {
							// Faces sloping down toward the moon catch its light near the crest.
							const sl = (r[Math.min(cols - 1, x + 3)] - r[Math.max(0, x - 3)]) / 6; // over a few cells, so no streaks
							const lit = Math.max(-1, Math.min(1, sl));
							d += shadeSign * lit * 0.14 * smooth(L.amp * H * 0.6, 0, dd);
							const alt = (bases[l] - sy) / (L.amp * H);
							if (alt > L.snow - 0.08) {
								const edge = L.snow + 0.1 * (noise(x * 0.35 + l * 10) - 0.5);
								d += (snowD - d) * smooth(edge - 0.03, edge + 0.03, alt);
							}
						}
					}
					// Mist pooling in the valley above the next ridge in front.
					if (mist > 0 && l + 1 < nL && !(framed && l < 0)) {
						const da = ridges[l + 1][x] - sy;
						if (da < band) {
							const f = mist * smooth(band, 0, da) * smooth(0.3, 0.85, plasmaBase[row + x]);
							d += (mistD - d) * f;
						}
					}
					// The forest runs on past the frame's end, fading out gradually rather than stopping.
					if (framed && sy > groundRow - 0.08 * vpRows) {
						const k = smooth(groundRow + 0.22 * vpRows, groundRow - 0.08 * vpRows, sy);
						d *= k;
						w *= k;
					}
					const v = 1 - d;
					sceneBase[row + x] = v < 0 ? 0 : v > 1 ? 1 : v;
					sceneA[row + x] = groundA + (sceneAlpha - groundA) * w;
				}
			}
		}

		// Night sky at the top of the page: the plasma fades out over the first `starSky` screens
		// and small stars shimmer there instead, each twinkling and wandering a fraction of a
		// cell so the dither under it keeps shifting. Page-anchored, like the plasma.
		type Star = {
			x: number; // page cells
			y: number;
			r: number; // radius, cells
			b: number; // brightness 0..1, already dimmed where the sky fades
			tw: number; // twinkle rate, radians per second
			ph: number;
			wob: number; // how far it wanders, cells
			ws: number; // wander rate, radians per second
			spark: boolean; // one of the few bright enough for a little cross
		};
		let stars: Star[] = [];
		let starKey = '';

		// 1 over the page's whole first screen (all sky), easing to 0 where the plasma takes over.
		const skyAt = (pageRow: number) =>
			starSky > 0 ? 1 - smooth(Math.min(1, starSky * 0.5), starSky, pageRow / vpRows) : 0;

		// Scatter the stars (the same ones on every build, from their index), thinning out
		// where the sky fades.
		function buildStars() {
			stars = [];
			const skyRows = starSky * vpRows;
			const n = Math.round((cols * skyRows) / 600);
			for (let i = 0; i < n; i++) {
				const y = hash(i * 7.31 + 2.1) * skyRows;
				const k = skyAt(y);
				if (hash(i * 5.17 + 3.7) > k) continue;
				const big = hash(i * 1.93 + 8.3);
				stars.push({
					x: hash(i * 3.13 + 1.3) * cols,
					y,
					r: 0.5 + big * big * 1.3,
					b: (0.45 + 0.55 * hash(i * 2.71 + 4.9)) * Math.min(1, k * 2),
					tw: 0.6 + 2.2 * hash(i * 4.43 + 6.1),
					ph: hash(i * 6.07 + 7.9) * TAU,
					wob: 0.25 + 0.5 * hash(i * 8.11 + 9.7),
					ws: 0.2 + 0.5 * hash(i * 9.29 + 5.3),
					spark: big > 0.93
				});
			}
		}

		// Draw the stars into the field at time t: soft dots, the brightest with a cross.
		function stampStars(t: number) {
			const still = reduceMotion;
			for (const s of stars) {
				const y = s.y - wy0 + (still ? 0 : Math.sin(t * s.ws * 0.8 + s.ph * 1.7) * s.wob); // canvas row
				if (y < -8 || y > rows + 8) continue;
				const x = s.x + (still ? 0 : Math.cos(t * s.ws + s.ph) * s.wob);
				const glow = s.b * (still ? 0.8 : 0.55 + 0.45 * Math.sin(t * s.tw + s.ph));
				const reach = s.spark ? s.r * 3.5 : s.r + 1;
				const x0 = Math.max(0, Math.floor(x - reach));
				const x1 = Math.min(cols - 1, Math.ceil(x + reach));
				const y0 = Math.max(0, Math.floor(y - reach));
				const y1 = Math.min(rows - 1, Math.ceil(y + reach));
				for (let cy = y0; cy <= y1; cy++) {
					for (let cx = x0; cx <= x1; cx++) {
						const dx = Math.abs(cx + 0.5 - x);
						const dy = Math.abs(cy + 0.5 - y);
						let d = glow * smooth(s.r + 0.6, 0, Math.hypot(dx, dy));
						if (s.spark) {
							const cross = Math.max(
								smooth(0.9, 0, dy) * smooth(reach, 0, dx),
								smooth(0.9, 0, dx) * smooth(reach, 0, dy)
							);
							d = Math.max(d, glow * 0.7 * cross);
						}
						const i = cy * cols + cx;
						if (1 - d < field[i]) field[i] = 1 - d;
						if (d > 0.1) starMask[i] = 1;
					}
				}
			}
		}

		// Shooting stars: now and then a short streak crosses the night sky (the starry top of the
		// page, or a scene's sky above its far ridge), drawn like the stars. Screen-anchored;
		// they're over in under a second.
		type Meteor = { x: number; y: number; dx: number; dy: number; t0: number; life: number; len: number };
		let meteor: Meteor | null = null;
		let nextMeteor = 4 + Math.random() * 6; // seconds since start

		function stampMeteor(t: number, sceneSky: boolean) {
			// Only over sky: above a shown scene's far ridge, or up in the starry top of the page.
			const sky = (x: number, sy: number) =>
				(sceneSky && sy < ridges[0][Math.min(cols - 1, Math.max(0, Math.floor(x)))] - 3) ||
				(starSky > 0 && skyAt(sy + scrollCells) > 0.6);
			if (!meteor) {
				if (reduceMotion || t < nextMeteor) return;
				// Start somewhere in the upper part of the screen, heading down and to one side.
				const x = cols * (0.1 + Math.random() * 0.8);
				const y = vpRows * Math.random() * 0.45;
				if (!sky(x, y)) {
					nextMeteor = t + 1; // no sky there right now: look again shortly
					return;
				}
				nextMeteor = t + 7 + Math.random() * 12;
				const ang = 0.35 + Math.random() * 0.35; // below the horizontal
				const speed = 140 + Math.random() * 80; // cells per second
				const dir = Math.random() < 0.5 ? -1 : 1;
				meteor = {
					x,
					y,
					dx: Math.cos(ang) * speed * dir,
					dy: Math.sin(ang) * speed,
					t0: t,
					life: 0.5 + Math.random() * 0.4,
					len: 14 + Math.random() * 12
				};
			}
			const m = meteor;
			const age = t - m.t0;
			if (age > m.life) {
				meteor = null;
				return;
			}
			const bright = Math.sin((Math.PI * age) / m.life); // flares up, then burns out
			const speed = Math.hypot(m.dx, m.dy);
			const ux = m.dx / speed;
			const uy = m.dy / speed;
			const hx = m.x + m.dx * age; // head, screen cells
			const hy = m.y + m.dy * age;
			for (let s = 0; s < m.len; s += 0.5) {
				const x = hx - ux * s;
				const sy = hy - uy * s;
				const cx = Math.round(x);
				const cy = Math.round(sy + oy); // canvas row
				if (cx < 0 || cx >= cols || cy < 0 || cy >= rows || !sky(x, sy)) continue;
				const d = bright * (1 - s / m.len); // the tail thins out behind the head
				const i = cy * cols + cx;
				if (1 - d < field[i]) field[i] = 1 - d;
				if (d > 0.1) starMask[i] = 1;
			}
		}

		// Camp: a pitched tent and a campfire at the foot of campEl, smoke billowing up from the
		// fire and drifting off on the breeze. Drawn into the field like the stars (so it shows
		// over plain ground), page-anchored.
		type Puff = { x: number; y: number; vx: number; vy: number; age: number; life: number; r0: number; seed: number };
		const puffs: Puff[] = [];
		let puffClock = 0;

		function stampCamp(t: number, dt: number) {
			const c = docCamp!;
			const W = c.x1 - c.x0;
			const Hc = c.y1 - c.y0;
			const s = Math.min(1.6, Math.max(0.75, Hc / 100)); // grows with the strip
			const gy = c.y1 - 20 / PIXEL; // the ground line, page rows: grass runs from it to the strip's bottom edge
			const fx = c.x0 + W * 0.6; // the fire
			const tx = c.x0 + W * 0.77; // the tent
			const fh = 22 * s; // flame height
			const ts = reduceMotion ? 1.3 : t; // the flames hold still under reduced motion

			// Smoke: a new puff every fifth of a second or so, rising, slowing, swelling and fading.
			if (reduceMotion) {
				if (!puffs.length) {
					// A still plume: short enough to stay in the strip, clear of any text above it.
					for (let k = 0; k < 9; k++) {
						const age = 0.4 + k * 0.45;
						puffs.push({ x: fx + age * 2.5 * s, y: gy - fh * 0.9 - age * 4.5 * s, vx: 0, vy: 0, age, life: 6, r0: 2.5 * s, seed: k * 7 });
					}
				}
			} else {
				puffClock -= dt;
				if (puffClock <= 0) {
					puffClock = 0.16 + Math.random() * 0.12;
					puffs.push({
						x: fx + (Math.random() - 0.5) * 4 * s,
						y: gy - fh * 0.9,
						vx: (Math.random() - 0.3) * 2 * s,
						vy: -(7 + Math.random() * 4) * s,
						age: 0,
						life: 5 + Math.random() * 2.5,
						r0: (2 + Math.random() * 1.5) * s,
						seed: Math.random() * 100
					});
				}
				for (let k = puffs.length - 1; k >= 0; k--) {
					const p = puffs[k];
					p.age += dt;
					if (p.age > p.life) {
						puffs.splice(k, 1);
						continue;
					}
					p.vy *= 1 - dt * 0.12;
					p.vx += (2.5 * s - p.vx) * dt * 0.3; // the breeze takes it
					p.x += (p.vx + Math.sin(p.age * 1.3 + p.seed) * 1.5 * s) * dt;
					p.y += p.vy * dt;
				}
			}

			// Nothing to draw unless some of it is near the canvas.
			if (c.y1 < wy0 || gy - 110 * s > wy0 + rows) return;

			// Fill a page-cell box with density fn(x, y), keeping the strongest mark per cell.
			const region = (xa: number, ya: number, xb: number, yb: number, fn: (x: number, y: number) => number) => {
				const x0 = Math.max(0, Math.floor(xa));
				const x1 = Math.min(cols - 1, Math.ceil(xb));
				const y0 = Math.max(wy0, Math.floor(ya));
				const y1 = Math.min(wy0 + rows - 1, Math.ceil(yb));
				for (let y = y0; y <= y1; y++) {
					for (let x = x0; x <= x1; x++) {
						const d = fn(x + 0.5, y + 0.5);
						if (d <= 0.02) continue;
						const i = (y - wy0) * cols + x;
						if (1 - d < field[i]) field[i] = 1 - d;
						starMask[i] = 1;
					}
				}
			};

			// Firelight: a faint glow on the ground and in the air around the fire.
			const flick = 0.9 + 0.1 * Math.sin(ts * 11) * Math.sin(ts * 4.3);
			region(fx - 45 * s, gy - 40 * s, fx + 45 * s, gy + 5 * s, (x, y) => {
				const dd = Math.hypot(x - fx, (y - (gy - 6 * s)) * 1.3) / (45 * s);
				return dd < 1 ? 0.13 * (1 - dd) * (1 - dd) * flick : 0;
			});

			// A thin layer of grass along the bottom: a speckled band from the ground line down to the
			// strip's (and the page's) bottom edge, with short blades poking up out of it that sway a
			// little in the breeze.
			region(c.x0, gy, c.x1, c.y1 - 0.5, (x, y) => {
				const depth = (y - gy) / Math.max(1, c.y1 - gy); // 0 at the top of the grass
				const speckle = hash(Math.floor(x) * 1.7 + Math.floor(y) * 31.3) > 0.4 ? 1 : 0.35;
				return (0.42 - 0.22 * depth) * speckle;
			});
			for (let x = Math.max(0, Math.floor(c.x0)); x < Math.min(cols, Math.ceil(c.x1)); x++) {
				const blade = Math.floor(hash(x * 0.37 + 5) * 4.5 * s); // cells tall
				for (let up = 1; up <= blade; up++) {
					const sway = reduceMotion ? 0 : Math.round(Math.sin(ts * 1.4 + x * 0.21) * (up / blade) * 0.9);
					const bx = x + sway;
					const by = Math.round(gy) - up;
					region(bx, by, bx, by, () => 0.55 - 0.2 * (up / blade));
				}
			}

			// The tent: an A-frame, lit on the side facing the fire, its door open and dark, poles
			// crossed at the peak and guy lines pegged out either side.
			const tw = 24 * s;
			const th = 30 * s;
			const ax = tx;
			const ay = gy - th;
			region(tx - tw - 14 * s, ay - 6 * s, tx + tw + 14 * s, gy, (x, y) => {
				const body = sdTri(x, y, tx - tw, gy, tx + tw, gy, ax, ay);
				const door = sdTri(x, y, tx - 8 * s, gy, tx + 8 * s, gy, ax + 0.5 * s, gy - th * 0.62);
				let d = 0;
				if (body < 0) {
					d = 0.16 + 0.32 * smooth(tx + tw, tx - tw, x); // brighter toward the fire
					if (door < 0) d = 0.04;
				}
				if (Math.abs(body) < 0.7) d = Math.max(d, 0.75);
				if (body < 0 && Math.abs(door) < 0.6) d = Math.max(d, 0.6);
				const poles = Math.min(
					segDist(x, y, ax - 4 * s, ay - 5 * s, ax + 2 * s, ay + 2 * s),
					segDist(x, y, ax + 4 * s, ay - 5 * s, ax - 2 * s, ay + 2 * s)
				);
				if (poles < 0.6) d = Math.max(d, 0.7);
				const guys = Math.min(
					segDist(x, y, tx - tw * 0.55, gy - th * 0.45, tx - tw - 12 * s, gy),
					segDist(x, y, tx + tw * 0.55, gy - th * 0.45, tx + tw + 12 * s, gy)
				);
				if (guys < 0.5) d = Math.max(d, 0.45);
				return d;
			});

			// The fire: two crossed logs in a ring of stones.
			region(fx - 16 * s, gy - 6 * s, fx + 16 * s, gy + 3 * s, (x, y) => {
				const log1 = segDist(x, y, fx - 10 * s, gy + 0.5 * s, fx + 10 * s, gy - 3 * s);
				const log2 = segDist(x, y, fx - 10 * s, gy - 3 * s, fx + 10 * s, gy + 0.5 * s);
				let d = Math.max(smooth(1.8 * s, 1 * s, log1), smooth(1.8 * s, 1 * s, log2)) * 0.55;
				for (let k = -2; k <= 2; k++) {
					const e = Math.hypot((x - fx - k * 5.5 * s) / (2.4 * s), (y - gy - 1.2 * s) / (1.5 * s));
					d = Math.max(d, 0.4 * smooth(1.1, 0.8, e));
				}
				return d;
			});

			// Its flames: three flickering tongues, the middle one tallest, brightest at the core.
			region(fx - 9 * s, gy - fh * 1.4, fx + 9 * s, gy, (x, y) => {
				const dx = (x - fx) / (8 * s);
				const up = (gy - 1.5 * s - y) / fh; // 0 at the base, 1 at a full flame's tip
				if (up < 0 || Math.abs(dx) > 1) return 0;
				let d = 0;
				for (let k = 0; k < 3; k++) {
					const off = (k - 1) * 0.42;
					const w = 0.55 - Math.abs(off) * 0.4;
					const lx = (dx - off - 0.08 * Math.sin(ts * 7 + k * 2 + up * 5)) / w;
					if (Math.abs(lx) >= 1) continue;
					const tall = (k === 1 ? 1.15 : 0.7) * (0.8 + 0.2 * Math.sin(ts * (9 + k * 3.1) + k) + 0.12 * Math.sin(ts * 17.3 + k * 5));
					const edge = tall * Math.pow(1 - Math.abs(lx), 0.6);
					if (up < edge) d = Math.max(d, 0.7 + 0.3 * (1 - up / edge));
				}
				return d;
			});

			// Sparks drifting up out of it.
			for (let k = 0; k < 6; k++) {
				const phase = (ts * 0.6 + hash(k * 3.7)) % 1;
				const x = fx + (hash(k * 5.1) - 0.5) * 10 * s + Math.sin(ts * 3 + k) * 2 * s;
				const y = gy - fh * 0.6 - phase * 45 * s;
				region(x, y, x, y, () => (1 - phase) * 0.9);
			}

			// The smoke itself.
			for (const p of puffs) {
				const r = p.r0 + p.age * 2.2 * s;
				const peak = 0.4 * smooth(0, 0.6, p.age) * Math.pow(1 - p.age / p.life, 1.2);
				region(p.x - r, p.y - r, p.x + r, p.y + r, (x, y) => {
					const dd = Math.hypot(x - p.x, y - p.y) / r;
					if (dd >= 1) return 0;
					const wisp = 0.8 + 0.2 * Math.sin(x * 0.7 + p.seed) * Math.sin(y * 0.6 - p.age);
					return peak * (1 - dd * dd) * wisp;
				});
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
					const cov = Math.max(wingCov, bodyCov) * bf.show;
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
					if (cov > 0.35) bfMask[i] = stampId;
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
					const cov = Math.max(wingCov, bodyCov) * bf.show;
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
					if (cov > 0.35) bfMask[i] = stampId;
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
				for (const r of bf.esc ? rects : obstacles) {
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
			// Making for a free spot after getting hemmed in: straight there, over whatever's in the
			// way, then back to wandering.
			if (bf.esc) {
				const ex = bf.esc.x;
				const ey = bf.esc.y - scrollCells;
				bf.esc.t -= dt;
				if (Math.hypot(ex - bf.x, ey - bf.y) < S * 0.8 || bf.esc.t <= 0) bf.esc = null;
				else h = turnToward(h, Math.atan2(ey - bf.y, ex - bf.x), Math.min(1, dt * 8));
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
			const px = bf.x;
			const py = bf.y;
			bf.x += Math.cos(h) * sp * speed * dt;
			bf.y += (Math.sin(h) * sp - beat * 5 * Math.min(1, approach)) * speed * dt;

			// Never over what's in avoidEls (most of the wings included). A step into it is held
			// back on that axis, so the butterfly slides along the edge and turns to run with it;
			// one the page has moved something under slips out by the nearest edge.
			const reach = S * 0.6;
			let bumped = false;
			for (const r of bf.esc ? [] : avoid) {
				const x0 = r.x0 - reach;
				const x1 = r.x1 + reach;
				const y0 = r.y0 - reach;
				const y1 = r.y1 + reach;
				if (bf.x <= x0 || bf.x >= x1 || bf.y <= y0 || bf.y >= y1) continue;
				bumped = true;
				const outX = px <= x0 || px >= x1;
				const outY = py <= y0 || py >= y1;
				if (outX || outY) {
					if (outX) bf.x = px;
					if (outY) bf.y = py;
					const along =
						outX && !outY
							? Math.sin(h) >= 0 ? Math.PI / 2 : -Math.PI / 2
							: outY && !outX
								? Math.cos(h) >= 0 ? 0 : Math.PI
								: h + Math.PI; // straight into a corner: turn back
					h = turnToward(h, along, Math.min(1, dt * 6));
				} else {
					const edges = [bf.x - x0, x1 - bf.x, bf.y - y0, y1 - bf.y];
					const e = edges.indexOf(Math.min(...edges));
					const out = e === 0 ? Math.PI : e === 1 ? 0 : e === 2 ? -Math.PI / 2 : Math.PI / 2;
					h = turnToward(h, out, Math.min(1, dt * 8));
					const step = Math.min(edges[e] + 1, S * 8 * dt);
					bf.x += Math.cos(out) * step;
					bf.y += Math.sin(out) * step;
				}
				bf.heading = h;
			}
			// Hemmed into a space too small to get about in (still bumping into things after a
			// second or so): find the nearest spot with room to fly and head for it (see above),
			// so it's never lost from view.
			bf.bumps = Math.max(0, bf.bumps - dt * 3) + (bumped ? dt * 6 : 0);
			if (bf.bumps > 4 && !bf.esc) {
				bf.bumps = 0;
				const free = (x: number, y: number) =>
					x > S * 2 &&
					x < cols - S * 2 &&
					y > S * 2 &&
					y < vpRows - S * 2 &&
					avoid.every((r) => rectDist(r, x, y) > S * 1.2);
				let spot: [number, number] | null = null;
				for (let rr = S * 2; rr <= S * 24 && !spot; rr += S) {
					for (let a = 0; a < 16; a++) {
						const x = bf.x + Math.cos((a / 16) * TAU) * rr;
						const y = bf.y + Math.sin((a / 16) * TAU) * rr;
						if (free(x, y)) {
							spot = [x, y];
							break;
						}
					}
				}
				spot ??= randomPoint(S);
				bf.esc = { x: spot[0], y: spot[1] + scrollCells, t: 4 };
			}

			// Leave a wake.
			disc(bf.x, bf.y + oy, S * 0.9, (i, d) => {
				const w = smooth(1, 0, d) * 0.7 * bf.show;
				if (w > wake[i]) wake[i] = w;
			});
		}

		// Each butterfly's colour, worked out once per frame rather than per cell: a hue from
		// where it is on the page (across the screen and down the page), so the colours shift
		// gently as they fly and as the page scrolls. Slot 0 is unused (bfMask 0 = none).
		let bfRGB = new Uint8Array(0);
		const hslToRgb = (h: number, s: number, l: number) => {
			const k = (n: number) => (n + h / 30) % 12;
			const a = s * Math.min(l, 1 - l);
			const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
			return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
		};
		function colourFlock() {
			if (bfRGB.length < (flock.length + 1) * 3) bfRGB = new Uint8Array((flock.length + 1) * 3);
			const s = Math.min(1, Math.max(0, bfSaturation));
			const l = Math.min(1, Math.max(0, bfLightness));
			flock.forEach((bf, k) => {
				const across = cols ? bf.x / cols : 0;
				const down = vpRows ? (bf.y + scrollCells) / vpRows : 0; // screens down the page
				const hue = (((260 + across * 140 + down * 90) % 360) + 360) % 360;
				bfRGB.set(hslToRgb(hue, s, l), (k + 1) * 3);
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
			if (measureDirty || frameCount % 90 === 0) measure(measureDirty);

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
				bg.style.transform = fg.style.transform = `translateY(${wy0 * PIXEL}px)`;
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
				sceneDirty = true; // its mist moved (and its stars twinkle at the same pace)
			} else if (k) {
				const [r0, r1] = exposed(k);
				plasmaRows(r0, r1, t);
			}

			// The scene is held to the screen, so it's redrawn whenever the page scrolls or the
			// pointer's parallax has moved, as well as along with the plasma.
			let showScene = showPlasma && !!scene;
			if (showScene) {
				const key = `${scene}|${dark}|${mist}|${opacity}|${sceneOpacity}`;
				if (key !== sceneKey) {
					sceneKey = key;
					sceneDirty = true;
				}
				const target = ptrIn && !reduceMotion ? ptrX / cols - 0.5 : 0;
				parX += (target - parX) * Math.min(1, dt * 1.5);
				if (sceneDirty || dScroll || k || Math.abs(parX - parDrawn) > 0.002) sceneRows(t);
				showScene = sceneShown;
			}

			// A touch of motion blur on the background while the page scrolls fast: the scene's
			// layers slide past the fixed dot pattern at different speeds, which flickers. It comes
			// in quickly and eases back out, so the dots are crisp again once scrolling settles.
			const blurTarget = showScene && !reduceMotion ? Math.min(1.6, Math.abs(dScroll) * 0.12) : 0;
			scrollBlur += (blurTarget - scrollBlur) * Math.min(1, dt * (blurTarget > scrollBlur ? 20 : 6));
			const blurPx = scrollBlur < 0.05 ? 0 : Math.round(scrollBlur * 10) / 10;
			if (blurPx !== blurShown) {
				blurShown = blurPx;
				bg.style.filter = blurPx ? `blur(${blurPx}px)` : '';
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

			// Butterflies keep out of the night sky, and the plain ground under a footer's landscape:
			// they fade away as they fly into either.
			const groundRow = sceneBottom / PIXEL; // page rows
			for (const bf of flock) {
				const row = bf.y + scrollCells;
				bf.show = starSky > 0 ? smooth(0.5, 0.1, skyAt(row)) : 1;
				if (sceneBottom) bf.show *= smooth(groundRow + 10, groundRow - 10, row);
			}
			for (const bf of flock) move(bf, dt);
			buildWake(t);

			// Assemble the field: the cached plasma, cleared along the cursor's wake, plus
			// butterfly trails.
			const contrast = invert ? 0 : 1;
			const trailK = trail;
			const decay = Math.exp(-dt * 1.2);
			for (let y = 0; y < rows; y++) {
				const skyK = starSky > 0 ? skyAt(wy0 + y) : 0; // how far the night sky fades the plasma out here
				const fy = y / G;
				const iy = fy | 0;
				const ty = fy - iy;
				for (let x = 0; x < cols; x++) {
					const i = y * cols + x;
					// 1 = no ink, so only butterflies mark it
					let v = showScene ? sceneBase[i] : showPlasma && plasmaBg ? plasmaBase[i] : 1;
					if (skyK) v = 1 - (1 - v) * (1 - skyK);
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
						// No banks of ink in the night sky, or on bare ground with no background drawn.
						if (showScene || plasmaBg) v -= v * e * (1 - c) * 0.4 * (1 - skyK);
					}
					wake[i] *= decay;
					v += (contrast - v) * wake[i] * trailK;
					field[i] = v;
				}
			}
			starMask.fill(0);
			if (starSky > 0) {
				const key = `${starSky}|${cols}|${vpRows}`;
				if (key !== starKey) {
					starKey = key;
					buildStars();
				}
				stampStars(t);
			} else if (stars.length) {
				stars = [];
				starKey = '';
			}
			stampMeteor(t, showScene);
			if (docCamp) stampCamp(t, dt);

			// Far butterflies first, so nearer ones are drawn over them. Halos go before
			// any wings so one butterfly's halo never paints over another's.
			const byDepth = [...flock].sort((a, b) => a.z - b.z);
			bfMask.fill(0);
			const haloK = halo;
			if (haloK > 0) {
				for (const bf of byDepth) {
					const c = isLight(bf) ? 0 : 1; // bend toward this butterfly's own kind
					disc(bf.x, bf.y + oy, size * depthScale(bf) * 3, (i, d) => {
						field[i] += (c - field[i]) * smooth(1, 0, d) * haloK * bf.show;
					});
				}
			}
			// Front butterflies (never light ones, which would be invisible without dither behind
			// them) go into their own field instead, for the front canvas.
			const inFront = (bf: Butterfly) => bf.front && !isLight(bf);
			for (const bf of byDepth) {
				if (bf.show < 0.01 || inFront(bf)) continue;
				stampId = flock.indexOf(bf) + 1;
				stamp(bf);
			}
			const fronts = byDepth.filter((bf) => bf.show >= 0.01 && inFront(bf));
			frontMask.fill(0);
			if (fronts.length) {
				const mainField = field;
				const mainMask = bfMask;
				field = frontField;
				bfMask = frontMask;
				frontField.fill(1);
				for (const bf of fronts) {
					stampId = flock.indexOf(bf) + 1;
					stamp(bf);
				}
				field = mainField;
				bfMask = mainMask;
			}

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
			// Opacity lives in the pixels, not on the canvas, so the butterflies can be more
			// solid (and their own colour) while the dither behind them stays faint.
			const groundA = Math.round(Math.min(1, Math.max(0, opacity)) * 255);
			const bfA = Math.round(Math.min(1, Math.max(0, bfOpacity)) * 255);
			const starA = Math.round(Math.min(1, Math.max(0, starOpacity)) * 255);
			if (bfA) colourFlock();
			for (let y = 0; y < rows; y++) {
				const wy = wy0 + y; // page row, keeps the dot screen fixed to the page
				const ny = (y + 0.5 - oy - hcy) / hcy;
				const ny2 = ny * ny;
				for (let x = 0; x < cols; x++) {
					const p = y * cols + x;
					const i = p * 4;
					// Butterflies and stars always show, even over the plain areas around content.
					let vis = bfMask[p] || starMask[p] ? 1 : showPlasma ? mask[p] : 0;
					if (introOn) {
						const nx = (x + 0.5 - hcx) / hcx;
						vis *= smooth(revealR, revealR + 0.5, Math.sqrt(nx * nx + ny2));
					}
					if (vis < 1 && vis <= (bayer[((wy + 2) & 3) * 4 + ((x + 1) & 3)] + 0.5) / 16) {
						data[i + 3] = 0;
						continue;
					}
					const thr = (bayer[(wy & 3) * 4 + (x & 3)] + 0.5) / 16;
					const ink = field[p] <= thr; // the dots; the rest is the plain ground
					const id = bfMask[p];
					if (ink && bfA && id) {
						data[i] = bfRGB[id * 3];
						data[i + 1] = bfRGB[id * 3 + 1];
						data[i + 2] = bfRGB[id * 3 + 2];
						data[i + 3] = bfA;
						continue;
					}
					data[i] = data[i + 1] = data[i + 2] = ink === inkWhite ? 255 : 0;
					data[i + 3] = ink && starMask[p] ? starA : showScene ? sceneA[p] : groundA;
				}
			}
			ctx.putImageData(img, 0, 0);

			// The front canvas: just the front butterflies' own dots, on clear pixels, once the
			// intro is over.
			if (fronts.length || frontDrawn) {
				const fd = fimg.data;
				fd.fill(0);
				const drawFront = fronts.length > 0 && introK >= 1;
				if (drawFront) {
					for (let y = 0; y < rows; y++) {
						const wy = wy0 + y;
						for (let x = 0; x < cols; x++) {
							const p = y * cols + x;
							const id = frontMask[p];
							if (!id || frontField[p] > (bayer[(wy & 3) * 4 + (x & 3)] + 0.5) / 16) continue;
							const i = p * 4;
							if (bfA) {
								fd[i] = bfRGB[id * 3];
								fd[i + 1] = bfRGB[id * 3 + 1];
								fd[i + 2] = bfRGB[id * 3 + 2];
								fd[i + 3] = bfA;
							} else {
								fd[i] = fd[i + 1] = fd[i + 2] = inkWhite ? 255 : 0;
								fd[i + 3] = groundA;
							}
						}
					}
				}
				fctx.putImageData(fimg, 0, 0);
				frontDrawn = drawFront;
			}

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
		bg.style.transform = fg.style.transform = `translateY(${wy0 * PIXEL}px)`;
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
	<canvas class="bg" bind:this={bg}></canvas>
</div>
<div class="bg-wrap front" bind:this={frontWrap} aria-hidden="true">
	<canvas class="bg" bind:this={fg}></canvas>
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
	/* Above the page's content, for the butterflies that fly in front of it. */
	.bg-wrap.front {
		z-index: 3;
	}
	/* Sized in resize(); re-anchored within the page in frame(). */
	.bg {
		display: block;
		image-rendering: pixelated;
		will-change: transform;
	}
</style>
