<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	type Props = {
		heading: string;
		paragraph: string;
		linkPhrase?: string;
		linkHref?: string;
		imageSrc: string;
		imageAlt: string;
		imageHref: string;
		side: 'left' | 'right';
		embedded?: boolean;
		radiusBoost?: number;
		rotation?: number;
		rock?: boolean;
		size?: string;
		techs?: (string | { slug: string; color?: string; label?: string })[];
	};

	let {
		heading,
		paragraph,
		linkPhrase = '',
		linkHref = '',
		imageSrc,
		imageAlt,
		imageHref,
		side,
		embedded = false,
		radiusBoost = 1,
		rotation = 0,
		rock = false,
		size = 'clamp(220px, 30vw, 380px)',
		techs = []
	}: Props = $props();

	let lines: { text: string; indent: number; width: number }[] = $state([]);
	let headingIndent = $state(0);
	let headingMaxWidth = $state<number | null>(null);
	let laidOut = $state(false);
	let posterEl: HTMLElement;
	let imageEl: HTMLElement | undefined = $state();
	let headingEl: HTMLElement | undefined = $state();
	let probeEl: HTMLElement = $state()!;
	let resizeObserver: ResizeObserver | null = null;

	async function doLayout() {
		if (!posterEl || !imageEl || !probeEl) return;
		if (typeof window === 'undefined') return;

		const { prepareWithSegments, layoutNextLineRange, materializeLineRange } = await import(
			'@chenglou/pretext'
		);

		await document.fonts.ready;

		const posterStyle = window.getComputedStyle(posterEl);
		const probeStyle = window.getComputedStyle(probeEl);

		const fontSize = parseFloat(probeStyle.fontSize);
		const lhStr = probeStyle.lineHeight;
		let lineHeight: number;
		if (lhStr === 'normal') lineHeight = fontSize * 1.2;
		else if (lhStr.endsWith('px')) lineHeight = parseFloat(lhStr);
		else lineHeight = fontSize * parseFloat(lhStr);

		const fontFamily = probeStyle.fontFamily;
		const fontString = `${fontSize}px ${fontFamily}`;

		const posterRect = posterEl.getBoundingClientRect();
		const imageRect = imageEl.getBoundingClientRect();
		const probeRect = probeEl.getBoundingClientRect();

		const padLeft = parseFloat(posterStyle.paddingLeft);
		const padRight = parseFloat(posterStyle.paddingRight);
		const contentLeft = posterRect.left + padLeft;
		const contentRight = posterRect.right - padRight;
		const contentWidth = contentRight - contentLeft;

		const imageCenterX = imageRect.left + imageRect.width / 2 - contentLeft;
		const imageCenterY = imageRect.top + imageRect.height / 2 - posterRect.top;
		const imageRadius = (imageRect.width / 2) * radiusBoost;
		const gap = fontSize * 0.6;

		function metricsAtY(y: number): { indent: number; width: number } {
			const dy = y - imageCenterY;
			if (Math.abs(dy) >= imageRadius) return { indent: 0, width: contentWidth };
			const offset = Math.sqrt(imageRadius * imageRadius - dy * dy);
			if (side === 'left') {
				const rightEdge = imageCenterX + offset;
				const indent = Math.max(0, rightEdge + gap);
				return { indent, width: Math.max(80, contentWidth - indent) };
			} else {
				const leftEdge = imageCenterX - offset;
				const width = Math.max(80, leftEdge - gap);
				return { indent: 0, width };
			}
		}

		if (headingEl) {
			const headingRect = headingEl.getBoundingClientRect();
			const headingMidY = headingRect.top + headingRect.height / 2 - posterRect.top;
			const m = metricsAtY(headingMidY);
			if (side === 'left') {
				headingIndent = m.indent;
				headingMaxWidth = null;
			} else {
				headingIndent = 0;
				headingMaxWidth = m.width;
			}
		}

		const paragraphStartY = probeRect.top - posterRect.top;
		const prepared = prepareWithSegments(paragraph, fontString);
		let cursor = { segmentIndex: 0, graphemeIndex: 0 };
		let yOffset = 0;

		const newLines: { text: string; indent: number; width: number }[] = [];
		let safety = 200;
		while (safety-- > 0) {
			const lineMidY = paragraphStartY + yOffset + lineHeight / 2;
			const m = metricsAtY(lineMidY);
			const range = layoutNextLineRange(prepared, cursor, m.width);
			if (range === null) break;
			const line = materializeLineRange(prepared, range);
			newLines.push({ text: line.text, indent: m.indent, width: m.width });
			cursor = range.end;
			yOffset += lineHeight;
		}

		lines = newLines;
		laidOut = true;
	}

	function renderLine(text: string) {
		if (!linkPhrase) return [{ kind: 'text' as const, content: text }];
		const idx = text.indexOf(linkPhrase);
		if (idx === -1) return [{ kind: 'text' as const, content: text }];
		return [
			{ kind: 'text' as const, content: text.slice(0, idx) },
			{ kind: 'link' as const, content: text.slice(idx, idx + linkPhrase.length) },
			{ kind: 'text' as const, content: text.slice(idx + linkPhrase.length) }
		];
	}

	onMount(() => {
		doLayout();
		if (typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver(() => doLayout());
			resizeObserver.observe(posterEl);
		}
		window.addEventListener('load', doLayout);
	});

	onDestroy(() => {
		if (resizeObserver) resizeObserver.disconnect();
		if (typeof window !== 'undefined') window.removeEventListener('load', doLayout);
	});
</script>

<section
	class="poster"
	class:side-left={side === 'left'}
	class:side-right={side === 'right'}
	bind:this={posterEl}
	style:--size={size}
>
	<a
		class="image"
		class:embedded
		class:rocking={rock}
		href={imageHref}
		bind:this={imageEl}
		style:--rotation="{rotation}deg"
	>
		<img src={imageSrc} alt={imageAlt} />
	</a>
	<h2
		bind:this={headingEl}
		style:padding-left="{headingIndent}px"
		style:max-width={headingMaxWidth !== null ? `${headingMaxWidth}px` : null}
	>
		{heading}
		{#if techs.length}<span class="techs"
				>{#each techs as t}{@const slug = typeof t === 'string' ? t : t.slug}{@const color =
						typeof t === 'string' ? '' : t.color || ''}{@const label =
						typeof t === 'string' ? slug : t.label || slug}<span class="tech"
						><img
							src={`https://cdn.simpleicons.org/${slug}${color ? `/${color}` : ''}`}
							alt={label}
							loading="lazy"
						/><span class="tech-tooltip">{label}</span></span
					>{/each}</span
			>{/if}
	</h2>
	<div class="paragraph">
		{#if !laidOut}
			<p class="probe" bind:this={probeEl}>{paragraph}</p>
		{:else}
			<div class="lines">
				{#each lines as line}
					<div
						class="line"
						style:padding-left="{line.indent}px"
						style:max-width="{line.width}px"
					>
						{#each renderLine(line.text) as part}
							{#if part.kind === 'link'}
								<a href={linkHref}>{part.content}</a>
							{:else}{part.content}{/if}
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	.poster {
		max-width: 1100px;
		margin: 2rem auto 6rem;
		padding: 0 2rem;
		position: relative;
		min-height: var(--size);
	}

	.poster h2 {
		font-family: 'Goozette', monospace;
		font-size: clamp(1.75rem, 4vw, 3rem);
		line-height: 1;
		margin: 0 0 1rem;
		letter-spacing: 0.02em;
		word-spacing: 0.2em;
	}

	.techs {
		display: inline-flex;
		gap: 0.4em;
		vertical-align: middle;
		margin-left: 0.6em;
	}

	.tech {
		position: relative;
		display: inline-flex;
	}

	.tech img {
		width: 0.6em;
		height: 0.6em;
		display: block;
	}

	.tech-tooltip {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translate(-50%, -6px);
		background: #1a1814;
		color: #f1ebdc;
		padding: 0.25rem 0.6rem;
		font-family: 'Terminal Grotesque', monospace;
		font-size: 0.85rem;
		line-height: 1;
		border-radius: 3px;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s ease;
		letter-spacing: normal;
		word-spacing: normal;
		z-index: 5;
	}

	.tech:hover .tech-tooltip {
		opacity: 1;
	}

	.paragraph {
		font-family: 'Terminal Grotesque', monospace;
		font-size: clamp(1rem, 1.6vw, 1.4rem);
		line-height: 1.5;
	}

	.probe {
		margin: 0;
		visibility: hidden;
	}

	.line {
		min-height: 1.5em;
	}

	.poster :global(a) {
		color: inherit;
		text-decoration: underline;
	}

	.image {
		display: block;
		position: absolute;
		width: var(--size);
		height: var(--size);
		top: 0;
		margin: 0;
		z-index: 1;
		text-decoration: none;
	}

	.image img {
		display: block;
		width: 100%;
		height: 100%;
		transform-origin: 50% 50%;
		transform: rotate(var(--rotation, 0deg));
		filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.22));
		transition: filter 0.5s ease;
	}

	.side-left .image {
		left: 0;
	}

	.side-left .image.embedded {
		left: calc(50% - 50vw - var(--size) / 4);
	}

	.side-right .image {
		right: 0;
	}

	.image.rocking img {
		animation: rock 3.2s ease-in-out infinite paused;
	}

	.image:hover img {
		filter: drop-shadow(2px 0 0 #111) drop-shadow(-2px 0 0 #111) drop-shadow(0 2px 0 #111)
			drop-shadow(0 -2px 0 #111);
	}

	.image.rocking:hover img {
		animation-play-state: running;
	}

	@keyframes rock {
		0%,
		100% {
			transform: rotate(var(--rotation, 0deg));
		}
		25% {
			transform: rotate(calc(var(--rotation, 0deg) - 4deg));
		}
		75% {
			transform: rotate(calc(var(--rotation, 0deg) + 4deg));
		}
	}

	@media (max-width: 700px) {
		.poster {
			padding: 0 1rem;
			margin-bottom: 4rem;
		}
	}
</style>
