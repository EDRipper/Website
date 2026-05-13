<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	const paragraphText =
		'I work on Hack Club Stickers with maxstellar and alice — a SvelteKit 2, Drizzle and Three.js rewrite of the site where teen hackers earn physical vinyl stickers by shipping projects. We added community voting on new designs, a public JSON catalog API, profiles, ordering, and a 3D viewer that makes the sticker drawer feel like a real-world shelf. Art comes from kat, with extra wiring from dani.';

	const linkPhrase = 'Hack Club Stickers';
	const linkHref = 'https://github.com/hackclub/stickers';

	let lines: { text: string; indent: number }[] = $state([]);
	let headingIndent = $state(0);
	let laidOut = $state(false);
	let posterEl: HTMLElement;
	let stickerEl: HTMLElement;
	let headingEl: HTMLElement | undefined = $state();
	let probeEl: HTMLElement = $state()!;
	let resizeObserver: ResizeObserver | null = null;

	async function doLayout() {
		if (!posterEl || !stickerEl || !probeEl) return;
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
		if (lhStr === 'normal') {
			lineHeight = fontSize * 1.2;
		} else if (lhStr.endsWith('px')) {
			lineHeight = parseFloat(lhStr);
		} else {
			lineHeight = fontSize * parseFloat(lhStr);
		}
		const fontFamily = probeStyle.fontFamily;
		const fontString = `${fontSize}px ${fontFamily}`;

		const posterRect = posterEl.getBoundingClientRect();
		const stickerRect = stickerEl.getBoundingClientRect();
		const probeRect = probeEl.getBoundingClientRect();

		const padLeft = parseFloat(posterStyle.paddingLeft);
		const padRight = parseFloat(posterStyle.paddingRight);
		const contentLeft = posterRect.left + padLeft;
		const contentRight = posterRect.right - padRight;
		const contentWidth = contentRight - contentLeft;

		const stickerCenterXAbs = stickerRect.left + stickerRect.width / 2;
		const stickerCenterX = stickerCenterXAbs - contentLeft;
		const stickerCenterY = stickerRect.top + stickerRect.height / 2 - posterRect.top;
		const stickerRadius = (stickerRect.width / 2) * 1.4;
		const gap = fontSize * 0.6;

		const paragraphStartY = probeRect.top - posterRect.top;

		if (headingEl) {
			const headingRect = headingEl.getBoundingClientRect();
			const headingMidY = headingRect.top + headingRect.height / 2 - posterRect.top;
			const dyH = headingMidY - stickerCenterY;
			let headingStickerRightX = -Infinity;
			if (Math.abs(dyH) < stickerRadius) {
				headingStickerRightX =
					stickerCenterX + Math.sqrt(stickerRadius * stickerRadius - dyH * dyH);
			}
			headingIndent = Math.max(0, headingStickerRightX + gap);
		}

		const prepared = prepareWithSegments(paragraphText, fontString);
		let cursor = { segmentIndex: 0, graphemeIndex: 0 };
		let yOffset = 0;

		const newLines: { text: string; indent: number }[] = [];
		let safety = 200;
		while (safety-- > 0) {
			const lineMidY = paragraphStartY + yOffset + lineHeight / 2;

			let stickerRightX = -Infinity;
			const dy = lineMidY - stickerCenterY;
			if (Math.abs(dy) < stickerRadius) {
				stickerRightX = stickerCenterX + Math.sqrt(stickerRadius * stickerRadius - dy * dy);
			}

			const indent = Math.max(0, stickerRightX + gap);
			const availableWidth = Math.max(80, contentWidth - indent);

			const range = layoutNextLineRange(prepared, cursor, availableWidth);
			if (range === null) break;

			const line = materializeLineRange(prepared, range);
			newLines.push({ text: line.text, indent });

			cursor = range.end;
			yOffset += lineHeight;
		}

		lines = newLines;
		laidOut = true;
	}

	function renderLine(text: string) {
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

<section class="hero">
	<div class="text">
		<h1>THIS IS EUAN!</h1>
		<p>seen here at 2AM exhausted while <br /> staffing an Austrian hackathon</p>
	</div>
	<div class="photo">
		<img src="/images/headshot.png" alt="Euan in a suit at an Austrian hackathon at 2AM" />
	</div>
	<ul class="contacts">
		<li><a href="https://github.com/edRipper">github</a></li>
		<li><a href="https://www.linkedin.com/in/euan-ripper-ab876528b/">linkedin</a></li>
		<li><a href="https://www.instagram.com/euanripper/">instagram</a></li>
	</ul>
</section>

<section class="poster" bind:this={posterEl}>
	<a class="sticker" href="https://stickers.hackclub.com" bind:this={stickerEl}>
		<img src="/images/sticker.png" alt="Hack Club sticker" />
	</a>
	<h2 bind:this={headingEl} style="padding-left: {headingIndent}px">STICKERS</h2>
	<div class="paragraph">
		{#if !laidOut}
			<p class="probe" bind:this={probeEl}>
				I work on <a href={linkHref}>Hack Club Stickers</a> with maxstellar and alice — a SvelteKit
				2, Drizzle and Three.js rewrite of the site where teen hackers earn physical vinyl stickers
				by shipping projects. We added community voting on new designs, a public JSON catalog API,
				profiles, ordering, and a 3D viewer that makes the sticker drawer feel like a real-world
				shelf. Art comes from kat, with extra wiring from dani.
			</p>
		{:else}
			<div class="lines">
				{#each lines as line}
					<div class="line" style="padding-left: {line.indent}px">
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
	.hero {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 2.5rem;
		max-width: 1100px;
		margin: 0 auto;
		padding: 4rem 2rem;
	}

	.text {
		flex: 0 1 auto;
	}

	.text h1 {
		font-family: 'Goozette', monospace;
		font-size: clamp(1.25rem, 6vw, 4.5rem);
		line-height: 1;
		margin: 0 0 0.5rem;
		letter-spacing: 0.02em;
		word-spacing: 0.2em;
		white-space: nowrap;
	}

	.text p {
		font-family: 'Terminal Grotesque', monospace;
		font-size: clamp(1.25rem, 3vw, 2.5rem);
		line-height: 1.2;
		margin: 0;
	}

	.photo {
		flex-shrink: 0;
	}

	.contacts {
		list-style: none;
		padding: 0;
		margin: 0 calc(50% - 50vw + 2.5rem) 0 auto;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 1.25rem;
		font-family: 'Terminal Grotesque', monospace;
		font-size: clamp(1.25rem, 2.2vw, 2.25rem);
		text-align: right;
	}

	.contacts a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.contacts a:hover {
		text-decoration-thickness: 2px;
	}

	.photo img {
		display: block;
		width: clamp(90px, 20vw, 240px);
		height: auto;
		padding: 0;
		background: #fff;
		box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18), 0 6px 10px rgba(0, 0, 0, 0.12);
		transform: rotate(4deg);
	}

	.poster {
		max-width: 1100px;
		margin: 2rem auto 6rem;
		padding: 0 2rem;
		position: relative;
	}

	.poster h2 {
		font-family: 'Goozette', monospace;
		font-size: clamp(1.75rem, 4vw, 3rem);
		line-height: 1;
		margin: 0 0 1rem;
		letter-spacing: 0.02em;
		word-spacing: 0.2em;
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

	.poster a {
		color: inherit;
		text-decoration: underline;
	}

	.sticker {
		--size: clamp(220px, 30vw, 380px);
		display: block;
		position: absolute;
		width: var(--size);
		height: var(--size);
		left: calc(50% - 50vw - var(--size) / 4);
		top: 0;
		margin: 0;
		z-index: 1;
	}

	.sticker img {
		display: block;
		width: 100%;
		height: 100%;
		transform-origin: 50% 50%;
		transform: rotate(30deg);
		filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.22));
		animation: rock 3.2s ease-in-out infinite paused;
		transition: filter 0.15s ease;
	}

	.sticker:hover img {
		animation-play-state: running;
		filter: drop-shadow(2px 0 0 #111) drop-shadow(-2px 0 0 #111) drop-shadow(0 2px 0 #111)
			drop-shadow(0 -2px 0 #111);
	}

	@keyframes rock {
		0%,
		100% {
			transform: rotate(30deg);
		}
		25% {
			transform: rotate(26deg);
		}
		75% {
			transform: rotate(34deg);
		}
	}

	@media (max-width: 700px) {
		.hero {
			gap: 1rem;
			padding: 2rem 1rem;
		}

		.poster {
			padding: 0 1rem;
			margin-bottom: 4rem;
		}

		.sticker {
			--size: clamp(160px, 50vw, 260px);
		}
	}
</style>
