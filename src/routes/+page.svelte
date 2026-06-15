<script lang="ts">
	// "Customise your character" screen — character card, commit stats and missions.
	import { onMount } from 'svelte';

	// Theme. Initialised from the OS preference on mount, then user-toggleable.
	let dark = $state(false);
	onMount(() => {
		dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
	});
	$effect(() => {
		document.body.classList.toggle('dark', dark);
	});

	// Animated ordered-dither (Bayer) plasma, drawn faintly behind everything.
	let bg!: HTMLCanvasElement;
	onMount(() => {
		const ctx = bg.getContext('2d')!;
		const PIXEL = 4; // on-screen size of each dither cell
		const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

		let cols = 0;
		let rows = 0;
		let img: ImageData;
		let raf = 0;
		const start = performance.now();

		function resize() {
			cols = Math.max(1, Math.ceil(window.innerWidth / PIXEL));
			rows = Math.max(1, Math.ceil(window.innerHeight / PIXEL));
			bg.width = cols;
			bg.height = rows;
			img = ctx.createImageData(cols, rows);
		}

		function frame(now: number) {
			const t = (now - start) / 1000;
			const data = img.data;
			for (let y = 0; y < rows; y++) {
				for (let x = 0; x < cols; x++) {
					// Moving plasma field, summed sines -> normalised 0..1.
					const s =
						Math.sin(x * 0.025 + t * 0.4) +
						Math.sin(y * 0.022 - t * 0.3) +
						Math.sin((x + y) * 0.016 + t * 0.2);
					const v = (s + 3) / 6;
					const thr = (bayer[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
					// dark dots on light (light mode); inverted for dark mode
					const on = v > thr !== dark ? 0 : 255;
					const i = (y * cols + x) * 4;
					data[i] = data[i + 1] = data[i + 2] = on;
					data[i + 3] = 255;
				}
			}
			ctx.putImageData(img, 0, 0);
			raf = requestAnimationFrame(frame);
		}

		resize();
		window.addEventListener('resize', resize);
		raf = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
		};
	});

	const build = {
		class: 'Euan Ripper',
		title: 'Programmer, Builder, Outdoorsy Nerd'
	};

	// Character level = full years since 26 Nov 2006.
	function yearsSince(year: number, month: number, day: number): number {
		const now = new Date();
		let y = now.getFullYear() - year;
		const m = now.getMonth() - (month - 1);
		if (m < 0 || (m === 0 && now.getDate() < day)) y--;
		return y;
	}
	const level = yearsSince(2006, 11, 26);

	type Mission = {
		name: string;
		status: 'COMPLETE' | 'ACTIVE' | 'OPEN';
		brief: string;
		href?: string;
	};

	const missions: Mission[] = [
		{
			name: 'Hack Club Fellowship',
			status: 'ACTIVE',
			brief:
				'Move across the world at 18 to spend a year scaling the mission of Hack Club — building programs and running events that inspire thousands of teens to learn coding.',
			href: '/blog/hack-club-fellowship'
		},
		{
			name: 'StrandBeest',
			status: 'COMPLETE',
			brief:
				'Design, manufacture and build a mechanical walking sculpture, and meet the inspiration Theo Jansen.',
			href: '/blog/strandbeest'
		},
		{
			name: 'Beest Hackathon',
			status: 'COMPLETE',
			brief:
				'Convince 30 teens to fly to the Netherlands to watch the StrandBeest exhibition.',
			href: '/blog/beest-hackathon'
		},
		{
			name: 'You Ship, We Ship',
			status: 'ACTIVE',
			brief:
				'Create and execute programs that reward teens for building personal projects. Goal: 10,000 hours of tracked learning.',
			href: '/blog/you-ship-we-ship'
		},
		{
			name: 'Flagship Hackathon',
			status: 'ACTIVE',
			brief:
				'Get 10 of the biggest technical YouTubers together for a game jam in LA.',
			href: '/blog/flagship-hackathon'
		},
		{
			name: 'Stickers',
			status: 'COMPLETE',
			brief:
				'Build a platform to track historical sticker designs by Hack Club — starting as an internal tool and becoming a platform used by thousands to distribute designs.',
			href: '/blog/stickers'
		},
		{
			name: 'New Mission',
			status: 'OPEN',
			brief: 'Want to work on another mission with me? Reach out with your pitch!',
			href: '/contact'
		}
	];
</script>

<svelte:head>
	<title>Euan Ripper — Character Select</title>
</svelte:head>

<canvas class="bg" bind:this={bg} aria-hidden="true"></canvas>

<main class="screen">
	<header class="topbar">
		<h1>Selected Character: Euan Shipper</h1>
		<button
			class="theme-toggle"
			onclick={() => (dark = !dark)}
			aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
		>
			{#if dark}
				<!-- sun -->
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<circle cx="12" cy="12" r="5" />
					<line x1="12" y1="1" x2="12" y2="3" />
					<line x1="12" y1="21" x2="12" y2="23" />
					<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
					<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
					<line x1="1" y1="12" x2="3" y2="12" />
					<line x1="21" y1="12" x2="23" y2="12" />
					<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
					<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
				</svg>
			{:else}
				<!-- moon -->
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
				</svg>
			{/if}
		</button>
	</header>

	<div class="layout">
		<!-- ── Character model (placeholder) ── -->
		<section class="panel stage">
			<div class="stage-half model-half">
				<div class="class-tag">
					<div>
						<h2>{build.class}</h2>
						<p>{build.title}</p>
					</div>
					<div class="socials">
						<a href="https://github.com/edRipper" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
							<img class="mono" src="https://cdn.simpleicons.org/github" alt="GitHub" />
						</a>
						<a href="https://www.linkedin.com/in/euan-ripper-ab876528b/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
							<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" alt="LinkedIn" />
						</a>
						<a href="https://www.instagram.com/euanripper/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
							<img class="mono" src="https://cdn.simpleicons.org/instagram" alt="Instagram" />
						</a>
					</div>
				</div>
				<div class="model">[ MODEL PLACEHOLDER ]</div>
			</div>

			<div class="stage-half stats-half">
				<h3 class="sub">STATS</h3>
				<div class="stat-row">
					<span class="lvl-badge">LV {level}</span>
					<span class="location">LOCATION: VERMONT</span>
				</div>
				<a class="chart" href="https://github.com/edRipper" target="_blank" rel="noopener noreferrer">
					<img
						src="https://ghchart.rshah.org/39d353/edRipper"
						alt="GitHub commit history for edRipper"
						loading="lazy"
					/>
				</a>
				<p class="bio">
					Started programming at 16 to automate his very boring warehouse job, and got hooked
					on the intersection of maths and art — using code as a tool to explore it. He
					quickly realised that no community of makers existed in his area of rural England,
					so he started one. He taught a class, won a competition and was offered a $50,000
					fellowship with Hack Club. At 18, he moved to America to build the future of
					technical education for teens.
				</p>
			</div>
		</section>

	</div>

	<!-- ── Missions (projects) ── -->
	<section class="panel missions">
		<h2>MISSIONS</h2>
		<div class="mission-grid">
			{#each missions as m (m.name)}
				{@const external = m.href?.startsWith('http')}
				<svelte:element
					this={m.href ? 'a' : 'div'}
					class="mission"
					class:open={m.status === 'OPEN'}
					href={m.href}
					target={external ? '_blank' : undefined}
					rel={external ? 'noopener noreferrer' : undefined}
				>
					<div class="mission-head">
						<span class="mission-name">{m.name}</span>
						<span class="mission-status">{m.status}</span>
					</div>
					<p class="mission-brief">{m.brief}</p>
				</svelte:element>
			{/each}
		</div>
	</section>
</main>

<style>
	:global(body) {
		--bg: #f0ede4;
		--panel: rgba(248, 245, 238, 0.85);
		--border: #cccccc;
		--text: #1a1814;
		background: var(--bg);
		color: var(--text);
	}
	:global(body.dark) {
		--bg: #0d0d0f;
		--panel: #16161a;
		--border: #3a3a40;
		--text: #ece7da;
	}

	.bg {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		display: block;
		image-rendering: pixelated;
		opacity: 0.08;
		pointer-events: none;
		z-index: -1;
	}

	.screen {
		position: relative;
		min-height: 100vh;
		box-sizing: border-box;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		font-family: 'Departure Mono', ui-monospace, monospace;
	}

	.topbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding-bottom: 0.5rem;
	}
	.topbar h1 {
		margin: 0;
		font-size: 1.4rem;
	}
	.theme-toggle {
		flex-shrink: 0;
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		padding: 0;
		border: 1px solid var(--border);
		background: var(--panel);
		color: inherit;
		cursor: pointer;
	}
	.theme-toggle svg {
		width: 20px;
		height: 20px;
		display: block;
	}

	.layout {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	.panel {
		border: 1px solid var(--border);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		background: var(--panel);
	}
	.panel h2 {
		margin: 0 0 1rem;
		font-size: 0.9rem;
	}
	.sub {
		margin: 0 0 0.6rem;
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		border-bottom: 1px solid var(--border);
		padding-bottom: 0.3rem;
	}

	/* stage */
	.stage {
		flex-direction: row;
		gap: 0;
		padding: 0;
	}
	.stage-half {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		padding: 1rem;
	}
	.model-half {
		border-right: 1px solid var(--border);
	}
	.class-tag {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.class-tag h2 {
		margin: 0;
	}
	.class-tag p {
		margin: 0;
		font-size: 0.7rem;
	}
	.lvl-badge {
		border: 1px solid var(--border);
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}
	.model {
		flex: 1;
		display: grid;
		place-items: center;
		border: 1px dashed var(--border);
		margin: 1rem 0;
		min-height: 240px;
		font-size: 0.8rem;
	}
	.location {
		font-size: 0.7rem;
		letter-spacing: 0.1em;
	}
	.stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.socials {
		display: flex;
		gap: 0.75rem;
		margin-left: auto;
	}
	.socials img {
		width: 22px;
		height: 22px;
		display: block;
	}
	/* Force these brand marks to pure white on dark (brightness(0) flattens any
	   colour to black, invert(1) then makes it white) so none come out tinted. */
	:global(body.dark) .mono {
		filter: brightness(0) invert(1);
	}

	/* missions */
	.missions {
		margin-top: 1.5rem;
	}
	.mission-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.75rem;
	}
	.mission {
		border: 1px solid var(--border);
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		text-decoration: none;
		color: inherit;
	}
	.mission.open {
		border-style: dashed;
	}
	.mission-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.mission-name {
		font-size: 0.95rem;
	}
	.mission-status {
		font-size: 0.6rem;
		border: 1px solid var(--border);
		padding: 0.15rem 0.35rem;
	}
	.mission-brief {
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.4;
	}
	/* activity log */
	.bio {
		margin: 1rem 0 0;
		font-size: 0.85rem;
		line-height: 1.55;
	}
	.chart {
		display: block;
		background: #fff;
		padding: 6px;
		border: 1px solid var(--border);
	}
	.chart img {
		width: 100%;
		height: auto;
		display: block;
	}
	/* In dark mode, invert just the image so its white/grey ground turns dark,
	   then rotate the hue 180° to bring the green squares (and labels) back.
	   Border/background live on the wrapper so they aren't inverted. */
	:global(body.dark) .chart {
		background: transparent;
	}
	:global(body.dark) .chart img {
		filter: invert(1) hue-rotate(180deg);
	}

	@media (max-width: 940px) {
		.layout {
			grid-template-columns: 1fr;
		}
		.stage {
			order: -1;
		}
	}
</style>
