<script lang="ts">
	// Editor overlay for the scroll-trail arrow (used by /arrow-editor). Shows the whole
	// path as cubic Béziers with draggable points and handles, can preview the scroll
	// animation, and copies the path out as TRAIL_PATH data for $lib/scroll-trail.
	import { onMount } from 'svelte';
	import {
		TRAIL_PATH,
		TRAIL_STEP,
		TRAIL_STUB,
		cubicAt,
		measureTrail,
		nodeAt,
		sampleTrail,
		toPx,
		toTrail,
		trailBeziers,
		trailFinish,
		trailHead,
		type Pt,
		type TrailFrame,
		type TrailNode
	} from '$lib/scroll-trail';

	let { heroBodyEl, factsTextEl }: { heroBodyEl?: HTMLElement; factsTextEl?: HTMLElement } = $props();

	const STORE = 'arrow-editor-path';
	const clone = (list: TrailNode[]) => list.map((n) => ({ ...n }));

	let nodes = $state<TrailNode[]>(clone(TRAIL_PATH));
	let loaded = false; // don't overwrite saved edits before they've been read back
	let frame = $state<TrailFrame | null>(null);
	let docH = $state(0);
	let scrollY = $state(0);
	let mode = $state<'edit' | 'preview'>('edit');
	let mirror = $state(true);
	let selected = $state<number | null>(null);
	let collapsed = $state(false);
	let copyState = $state<'idle' | 'copied' | 'failed'>('idle');
	let exportText = $state('');
	const history: string[] = []; // JSON snapshots for undo

	const last = $derived(nodes.length - 1);
	const beziers = $derived(frame ? trailBeziers(frame, nodes) : []);
	const fmt = (p: Pt) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
	const pathD = $derived(
		beziers.length
			? `M${fmt(beziers[0][0])}` + beziers.map(([, c1, c2, p3]) => `C${fmt(c1)} ${fmt(c2)} ${fmt(p3)}`).join('')
			: ''
	);
	const pts = $derived(frame ? sampleTrail(frame, nodes) : []);
	const finish = $derived(frame && pts.length > 1 ? trailFinish(frame, pts) : 1);
	const head = $derived(pts.length > 1 ? trailHead(pts, scrollY, finish) : null);
	const endHead = $derived(pts.length > 1 ? trailHead(pts, finish, finish) : null);
	const rest = $derived(pts.length > 1 ? pts[Math.min(pts.length - 1, Math.round(TRAIL_STUB / TRAIL_STEP))] : null);
	const knobs = $derived.by(() => {
		const f = frame;
		if (!f) return [];
		return nodes.map((n, i) => {
			const p = nodeAt(nodes, i);
			return {
				p: toPx(f, p),
				in: toPx(f, { x: p.x + n.ix, y: p.y + n.iy }),
				out: toPx(f, { x: p.x + n.ox, y: p.y + n.oy })
			};
		});
	});

	// ── Measuring ──
	let raf = 0;
	function measure() {
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(() => {
			frame = heroBodyEl && factsTextEl ? measureTrail(heroBodyEl, factsTextEl) : null;
			docH = document.documentElement.scrollHeight;
		});
	}
	$effect(() => {
		// Re-measure once the page has bound the elements the arrow hangs off.
		if (heroBodyEl && factsTextEl) measure();
	});
	$effect(() => {
		const json = JSON.stringify(nodes);
		if (!loaded) return;
		try {
			localStorage.setItem(STORE, json);
		} catch {
			// storage unavailable: edits just won't survive a reload
		}
	});

	onMount(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(STORE) ?? 'null');
			if (Array.isArray(saved) && saved.length >= 2) nodes = saved;
		} catch {
			// nothing saved (or unreadable): keep the current TRAIL_PATH
		}
		loaded = true;
		const onScroll = () => (scrollY = window.scrollY);
		const ro = new ResizeObserver(measure);
		ro.observe(document.body);
		window.addEventListener('resize', measure);
		window.addEventListener('scroll', onScroll, { passive: true });
		document.fonts.ready.then(measure);
		onScroll();
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			window.removeEventListener('resize', measure);
			window.removeEventListener('scroll', onScroll);
		};
	});

	// ── Editing ──
	function snapshot() {
		history.push(JSON.stringify(nodes));
		if (history.length > 200) history.shift();
	}

	type Grab = { i: number; part: 'point' | 'in' | 'out' };
	let grab: Grab | null = null;

	function startDrag(e: PointerEvent, i: number, part: Grab['part']) {
		if (e.button !== 0) return;
		e.preventDefault();
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		snapshot();
		grab = { i, part };
		selected = i;
	}

	function drag(e: PointerEvent) {
		const f = frame;
		if (!grab || !f) return;
		const n = nodes[grab.i];
		const at = toTrail(f, { x: e.pageX, y: e.pageY });
		if (grab.part === 'point') {
			if (grab.i === 0) return; // the tail is pinned under the hero
			n.x = at.x;
			n.y = at.y;
			return;
		}
		const p = nodeAt(nodes, grab.i);
		const dx = at.x - p.x;
		const dy = at.y - p.y;
		const len = Math.hypot(dx, dy) || 1;
		// Mirrored handles stay in line (keeping the other handle's length) so the curve
		// stays smooth through the point; hold Alt to bend a corner.
		const keepLine = mirror && !e.altKey;
		if (grab.part === 'in') {
			n.ix = dx;
			n.iy = dy;
			if (keepLine) {
				const other = Math.hypot(n.ox, n.oy);
				n.ox = (-dx / len) * other;
				n.oy = (-dy / len) * other;
			}
		} else {
			n.ox = dx;
			n.oy = dy;
			if (keepLine) {
				const other = Math.hypot(n.ix, n.iy);
				n.ix = (-dx / len) * other;
				n.iy = (-dy / len) * other;
			}
		}
	}

	function endDrag() {
		grab = null;
	}

	// Double-click the line: split the nearest curve there, keeping its shape.
	function addPoint(e: MouseEvent) {
		const f = frame;
		if (!f) return;
		let best = { k: 0, t: 0.5, dist: Infinity };
		beziers.forEach(([p0, c1, c2, p3], k) => {
			for (let s = 0; s <= 80; s++) {
				const q = cubicAt(p0, c1, c2, p3, s / 80);
				const dist = Math.hypot(q.x - e.pageX, q.y - e.pageY);
				if (dist < best.dist) best = { k, t: s / 80, dist };
			}
		});
		snapshot();
		const { k, t } = best;
		const a = nodes[k];
		const b = nodes[k + 1];
		const p0 = nodeAt(nodes, k);
		const p3 = nodeAt(nodes, k + 1);
		const c1 = { x: p0.x + a.ox, y: p0.y + a.oy };
		const c2 = { x: p3.x + b.ix, y: p3.y + b.iy };
		const lerp = (u: Pt, v: Pt) => ({ x: u.x + (v.x - u.x) * t, y: u.y + (v.y - u.y) * t });
		const q1 = lerp(p0, c1);
		const q2 = lerp(c1, c2);
		const q3 = lerp(c2, p3);
		const r1 = lerp(q1, q2);
		const r2 = lerp(q2, q3);
		const mid = lerp(r1, r2);
		a.ox = q1.x - p0.x;
		a.oy = q1.y - p0.y;
		b.ix = q3.x - p3.x;
		b.iy = q3.y - p3.y;
		nodes.splice(k + 1, 0, {
			x: mid.x,
			y: mid.y,
			ix: r1.x - mid.x,
			iy: r1.y - mid.y,
			ox: r2.x - mid.x,
			oy: r2.y - mid.y
		});
		selected = k + 1;
	}

	// Any point but the tail can go, as long as the path keeps a start and an end.
	const canRemove = $derived(selected !== null && selected !== 0 && nodes.length > 2);
	function removeSelected() {
		if (!canRemove || selected === null) return;
		snapshot();
		nodes.splice(selected, 1);
		selected = null;
	}

	function undo() {
		const prev = history.pop();
		if (!prev) return;
		nodes = JSON.parse(prev);
		selected = null;
	}

	function reset() {
		snapshot();
		nodes = clone(TRAIL_PATH);
		selected = null;
	}

	function onKey(e: KeyboardEvent) {
		const el = e.target as HTMLElement;
		if (el.closest('input, textarea')) return;
		if ((e.key === 'Delete' || e.key === 'Backspace') && selected !== null) {
			e.preventDefault();
			removeSelected();
		} else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
			e.preventDefault();
			undo();
		} else if (e.key === 'Escape') {
			selected = null;
		}
	}

	// ── Export ──
	const round = (v: number) => Math.round(v * 1000) / 1000;
	async function copy() {
		const lines = nodes.map(
			(n) =>
				`\t{ x: ${round(n.x)}, y: ${round(n.y)}, ix: ${round(n.ix)}, iy: ${round(n.iy)}, ox: ${round(n.ox)}, oy: ${round(n.oy)} }`
		);
		exportText = `// arrow-editor export (viewport ${frame?.w ?? '?'}×${frame?.vh ?? '?'})\nexport const TRAIL_PATH: TrailNode[] = [\n${lines.join(',\n')}\n];\n`;
		try {
			await navigator.clipboard.writeText(exportText);
			copyState = 'copied';
			setTimeout(() => {
				if (copyState === 'copied') copyState = 'idle';
			}, 2000);
		} catch {
			copyState = 'failed'; // show the text so it can be copied by hand
		}
	}
</script>

<svelte:window onkeydown={onKey} />

{#if frame}
	<svg class="editor" width={frame.w} height={docH} aria-hidden="true">
		{#if mode === 'edit'}
			<path class="line" d={pathD} />
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<path class="hit" d={pathD} ondblclick={addPoint} />
			{#if rest}
				<circle class="rest" cx={rest.x} cy={rest.y} r="6" />
			{/if}
			{#if endHead}
				<path
					class="head"
					d="M-13 -15 L0 0 L13 -15"
					transform="translate({endHead.hx} {endHead.hy}) rotate({endHead.angle})"
				/>
			{/if}
			{#each knobs as k, i (i)}
				{#if i > 0}
					<line class="arm" x1={k.p.x} y1={k.p.y} x2={k.in.x} y2={k.in.y} />
				{/if}
				{#if i < last}
					<line class="arm" x1={k.p.x} y1={k.p.y} x2={k.out.x} y2={k.out.y} />
				{/if}
			{/each}
			{#each knobs as k, i (i)}
				{#if i > 0}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<circle
						class="knob"
						cx={k.in.x}
						cy={k.in.y}
						r="7"
						onpointerdown={(e) => startDrag(e, i, 'in')}
						onpointermove={drag}
						onpointerup={endDrag}
					/>
				{/if}
				{#if i < last}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<circle
						class="knob"
						cx={k.out.x}
						cy={k.out.y}
						r="7"
						onpointerdown={(e) => startDrag(e, i, 'out')}
						onpointermove={drag}
						onpointerup={endDrag}
					/>
				{/if}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<rect
					class="point"
					class:pinned={i === 0}
					class:selected={selected === i}
					x={k.p.x - 8}
					y={k.p.y - 8}
					width="16"
					height="16"
					onpointerdown={(e) => startDrag(e, i, 'point')}
					onpointermove={drag}
					onpointerup={endDrag}
				/>
			{/each}
		{:else if head}
			<path class="line" d={head.d} />
			<path class="head" d="M-13 -15 L0 0 L13 -15" transform="translate({head.hx} {head.hy}) rotate({head.angle})" />
		{/if}
	</svg>
{/if}

<div class="panel">
	<div class="bar">
		<strong>Arrow editor</strong>
		<button onclick={() => (collapsed = !collapsed)}>{collapsed ? 'show' : 'hide'}</button>
	</div>
	{#if !collapsed}
		<div class="row">
			<button class:on={mode === 'edit'} onclick={() => (mode = 'edit')}>Edit</button>
			<button class:on={mode === 'preview'} onclick={() => (mode = 'preview')}>Preview scroll</button>
		</div>
		<label class="check"><input type="checkbox" bind:checked={mirror} /> Mirror handles (Alt-drag to break)</label>
		<div class="row">
			<button onclick={undo}>Undo</button>
			<button onclick={removeSelected} disabled={!canRemove}>
				Delete point
			</button>
			<button onclick={reset}>Reset</button>
		</div>
		<button class="copy" onclick={copy}>{copyState === 'copied' ? 'Copied!' : 'Copy data'}</button>
		{#if copyState === 'failed'}
			<textarea readonly value={exportText} onfocus={(e) => e.currentTarget.select()}></textarea>
		{/if}
		<p class="hint">
			Drag squares to move points and circles to bend the curve. Double-click the line to add a point;
			click one and press Delete to remove it. The yellow tail is pinned under the hero; the end
			point moves with the fun facts paragraph. The ring marks where the head rests before
			scrolling. Edits are saved in this browser.
			{#if frame}Viewport {frame.w}×{frame.vh}.{/if}
		</p>
	{/if}
</div>

<style>
	.editor {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 50;
		overflow: visible;
		pointer-events: none;
	}
	.line,
	.head {
		fill: none;
		stroke: #ece7da;
		stroke-width: 6;
		stroke-linecap: square;
		stroke-linejoin: miter;
	}
	.hit {
		fill: none;
		stroke: transparent;
		stroke-width: 22;
		pointer-events: stroke;
		cursor: copy;
	}
	.rest {
		fill: none;
		stroke: #4dd2ff;
		stroke-width: 2;
		stroke-dasharray: 3 3;
	}
	.arm {
		stroke: #39d353;
		stroke-width: 1.5;
		opacity: 0.8;
	}
	.knob {
		fill: #39d353;
		stroke: #131318;
		stroke-width: 2;
		pointer-events: all;
		cursor: grab;
	}
	.point {
		fill: #131318;
		stroke: #ece7da;
		stroke-width: 2.5;
		pointer-events: all;
		cursor: move;
	}
	.point.selected {
		stroke: #39d353;
		stroke-width: 3.5;
	}
	.point.pinned {
		fill: #e6b23e;
		cursor: default;
	}
	.panel {
		position: fixed;
		right: 16px;
		bottom: 16px;
		z-index: 100;
		width: min(300px, calc(100vw - 32px));
		box-sizing: border-box;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-family: 'Departure Mono', ui-monospace, monospace;
		font-size: 12px;
		color: #ece7da;
		background: #1e1e26;
		border: 2px solid #3a3a40;
		box-shadow: 0 12px 34px rgba(0, 0, 0, 0.6);
	}
	.bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	button {
		padding: 0.3rem 0.55rem;
		font: inherit;
		color: inherit;
		background: transparent;
		border: 2px solid #3a3a40;
	}
	button:hover:not(:disabled),
	button.on {
		border-color: #39d353;
		color: #39d353;
	}
	button:disabled {
		opacity: 0.4;
	}
	.copy {
		padding: 0.45rem;
		border-color: #39d353;
		color: #39d353;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	textarea {
		height: 8rem;
		font: inherit;
		font-size: 11px;
		color: inherit;
		background: #131318;
		border: 2px solid #3a3a40;
	}
	.hint {
		margin: 0;
		line-height: 1.45;
		opacity: 0.75;
	}
</style>
