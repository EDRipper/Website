<script lang="ts">
	// "Customise your character" screen — character card, commit stats and missions.
	import { onMount } from 'svelte';

	// Theme. Initialised from the OS preference on mount, then user-toggleable.
	let dark = $state(true);
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

	// Tools in the "inventory". Most logos come from the Simple Icons CDN (by
	// slug); a couple use self-hosted full-colour SVGs via `src`.
	const inventory = [
		{ name: 'Svelte', slug: 'svelte' },
		{ name: 'PostgreSQL', slug: 'postgresql' },
		{ name: 'Airtable', src: '/images/airtable.svg' },
		{ name: 'Python', src: '/images/python.svg' },
		{ name: 'JavaScript', slug: 'javascript' },
		{ name: 'Metabase', slug: 'metabase' },
		{ name: 'NestJS', slug: 'nestjs' }
	];

	// Adds `.hovering` on pointer enter and removes it `delay` ms after leave, so
	// the reveal always completes (never reverses mid-way) and lingers on exit.
	function hoverHold(node: HTMLElement, delay = 1000) {
		let timer: ReturnType<typeof setTimeout>;
		const enter = () => {
			clearTimeout(timer);
			node.classList.add('hovering');
		};
		const leave = () => {
			timer = setTimeout(() => node.classList.remove('hovering'), delay);
		};
		node.addEventListener('pointerenter', enter);
		node.addEventListener('pointerleave', leave);
		return {
			destroy() {
				clearTimeout(timer);
				node.removeEventListener('pointerenter', enter);
				node.removeEventListener('pointerleave', leave);
			}
		};
	}

	// Character level = full years since 26 Nov 2006.
	function yearsSince(year: number, month: number, day: number): number {
		const now = new Date();
		let y = now.getFullYear() - year;
		const m = now.getMonth() - (month - 1);
		if (m < 0 || (m === 0 && now.getDate() < day)) y--;
		return y;
	}
	const level = yearsSince(2006, 11, 26);

	type Status = 'COMPLETE' | 'IN PROGRESS';
	type Mission = {
		name: string;
		status: Status | 'OPEN';
		brief: string;
		href?: string;
		image?: string;
		contain?: boolean;
	};

	const missions: Mission[] = [
		{
			name: 'Hack Club Fellowship',
			status: 'COMPLETE',
			brief:
				'Move across the world at 18 to spend a year scaling the mission of Hack Club — building programs and running events that inspire thousands of teens to learn coding.',
			href: '/blog/hack-club-fellowship',
			image: '/images/fellowship.png'
		},
		{
			name: 'StrandBeest',
			status: 'IN PROGRESS',
			brief:
				'Design, manufacture and build a mechanical walking sculpture, and meet the inspiration Theo Jansen.',
			href: '/blog/strandbeest',
			image: '/images/strandbeest.png'
		},
		{
			name: 'Beest Hackathon',
			status: 'IN PROGRESS',
			brief:
				'Convince 30 teens to fly to the Netherlands to watch the StrandBeest exhibition.',
			href: '/blog/beest-hackathon',
			image: '/images/beest-hackathon.png'
		},
		{
			name: 'You Ship, We Ship',
			status: 'IN PROGRESS',
			brief:
				'Create and execute programs that reward teens for building personal projects. Goal: 10,000 hours of tracked learning.',
			href: '/blog/you-ship-we-ship',
			image: '/images/you-ship-we-ship.png'
		},
		{
			name: 'Flagship Hackathon',
			status: 'COMPLETE',
			brief:
				'Get 10 of the biggest technical YouTubers together for a game jam in LA.',
			href: '/blog/flagship-hackathon',
			image: '/images/flagship-hackathon.png'
		},
		{
			name: 'Stickers',
			status: 'IN PROGRESS',
			brief:
				'Build a platform to track historical sticker designs by Hack Club — starting as an internal tool and becoming a full-fledged distribution platform.',
			href: '/blog/stickers',
			image: '/images/sticker.png',
			contain: true
		},
		{
			name: 'Create a coding club, win a competition!',
			status: 'COMPLETE',
			brief:
				'Start teaching kids coding from 0 — raise your own budget, beat the well-funded schools.',
			href: '/blog/coding-club',
			image: '/images/coding-club.png'
		},
		{
			name: 'New Mission',
			status: 'OPEN',
			brief: 'Want to work on another mission with me? Reach out with your pitch — euanripper2@gmail.com',
			href: 'mailto:euanripper2@gmail.com'
		}
	];

	type Sidequest = { name: string; href: string; brief?: string; image?: string };

	const sidequests: Sidequest[] = [
		{
			name: 'Learn to unicycle',
			brief:
				'Over lockdown you find yourself with a lot of time, a lot of boredom, and a rusty old unicycle in the back of a shed...',
			href: '/blog/learn-to-unicycle',
			image: '/images/unicycle.png'
		},
		{
			name: 'Hike 55 miles with the British Army',
			brief:
				"Over 3 years, take on progressively harder hikes, culminating in leading a team of 6 across 55 miles through 10 checkpoints for the army's Ten Tors challenge.",
			href: '/blog/hike-55-miles-british-army',
			image: '/images/hike-army.jpg'
		},
		{
			name: 'Attend Hackathons',
			brief:
				'I love being in a technical community, and the best way to meet people is at hackathons — fortunately my work runs a lot of them!',
			href: '/blog/attend-hackathons',
			image: '/images/headshot.png'
		},
		{
			name: 'Run an ultramarathon',
			brief:
				"Go from couch potato to ultramarathon runner — run across a national park to complete the quest. Time doesn't matter, finishing matters!",
			href: '/blog/run-an-ultramarathon',
			image: '/images/ultramarathon.webp'
		},
		{
			name: 'Learn how differential equations govern the spots and stripes on fish.',
			brief:
				'Build a visualisation of Turing\'s "The chemical basis of morphogenesis" paper using Python to simulate why some animals get spots and others stripes.',
			href: '/blog/turing-patterns',
			image: '/images/fish.png'
		},
		{
			name: 'Speak at the European Parliament in Strasbourg',
			brief: 'Convince the European Parliament to let your school visit, even after Brexit...',
			href: '/blog/european-parliament',
			image: '/images/european-parliament.webp'
		}
	];
</script>

<svelte:head>
	<title>Euan's Website</title>
</svelte:head>

<canvas class="bg" bind:this={bg} aria-hidden="true"></canvas>

<main class="screen">
	<header class="topbar">
		<h1>Selected Character: Euan Shipper</h1>
		<div class="controls">
		<button
			class="toggle"
			onclick={() => (dark = !dark)}
			aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
			title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
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
		</div>
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
						<a href="https://github.com/edRipper" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub — my code & projects">
							<img class="mono" src="https://cdn.simpleicons.org/github" alt="GitHub" />
						</a>
						<a href="https://www.linkedin.com/in/euan-ripper-ab876528b/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn — my work & experience">
							<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" alt="LinkedIn" />
						</a>
						<a href="https://www.instagram.com/euanripper/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram — my photos & life">
							<img class="mono" src="https://cdn.simpleicons.org/instagram" alt="Instagram" />
						</a>
					</div>
				</div>
				<div class="model">
					<img class="model-img" src="/images/euan.jpg" alt="Euan Ripper" />
					<span class="photo-credit">photo credit: reem &lt;3</span>
				</div>
			</div>

			<div class="stage-half stats-half">
				<h3 class="sub stats-head">
					<span>ATTRIBUTES</span>
					<a class="stats-email" href="mailto:euanripper2@gmail.com">euanripper2@gmail.com</a>
				</h3>
				<div class="stat-row">
					<span class="lvl-badge">Level {level}</span>
					<span class="location">LOCATION: VERMONT</span>
				</div>
				<p class="likes">LIKES: circus arts, robotics, web dev, hackathons</p>

				<h3 class="sub">STATS</h3>
				<a class="chart" href="https://github.com/edRipper" target="_blank" rel="noopener noreferrer">
					<img
						src="https://ghchart.rshah.org/39d353/edRipper"
						alt="GitHub commit history for edRipper"
						loading="lazy"
					/>
				</a>

				<h3 class="sub">STORY</h3>
				<p class="bio">
					Started programming at 16 to automate his very boring warehouse job, and got hooked
					on the intersection of maths and art — using code as a tool to explore it. He
					quickly realised that no community of makers existed in his area of rural England,
					so he started one. He taught a class, won a competition and was offered a $50,000
					fellowship with Hack Club. At 18, he moved to America to build the future of
					technical education for teens.
				</p>

				<hr class="divider" />

				<h3 class="sub">INVENTORY</h3>
				<div class="inventory">
					{#each inventory as item (item.name)}
						<span class="slot" title={item.name}>
							<img
								src={item.src ?? `https://cdn.simpleicons.org/${item.slug}`}
								alt={item.name}
								loading="lazy"
							/>
						</span>
					{/each}
				</div>
			</div>
		</section>

	</div>

	<hr class="rule" />

	<!-- ── Missions (projects) ── -->
	<section class="panel missions">
		<h2>Missions: The adventures I'm lucky enough to do for work</h2>
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
					use:hoverHold
				>
					{#if m.status !== 'OPEN'}
						<img
							class="card-img"
							class:contain={m.contain}
							src={m.image ?? '/images/coming-soon.svg'}
							alt={m.image ? m.name : 'Coming soon'}
							loading="lazy"
						/>
						<span class="badge" class:complete={m.status === 'COMPLETE'}>{m.status}</span>
					{/if}
					<span class="mission-name">{m.name}</span>
					<p class="mission-brief">{m.brief}</p>
				</svelte:element>
			{/each}
		</div>
	</section>

	<hr class="rule" />

	<!-- ── Sidequests ── -->
	<section class="panel sidequests">
		<h2>Sidequests: The lore I'm building for the fun of it</h2>
		<div class="mission-grid">
			{#each sidequests as q (q.name)}
				<a class="mission" href={q.href} use:hoverHold>
					<img
						class="card-img"
						src={q.image ?? '/images/coming-soon.svg'}
						alt={q.image ? q.name : 'Coming soon'}
						loading="lazy"
					/>
					<span class="badge complete">COMPLETE</span>
					<span class="mission-name">{q.name}</span>
					{#if q.brief}
						<p class="mission-brief">{q.brief}</p>
					{/if}
				</a>
			{/each}
		</div>
	</section>
</main>

<style>
	:global(body) {
		--bg: #f0ede4;
		--panel: rgba(248, 245, 238, 0.85);
		--border: #8f8a7e;
		--bw: 2px;
		--text: #1a1814;
		--shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
		background: var(--bg);
		color: var(--text);
	}
	:global(body.dark) {
		--bg: #131318;
		--panel: rgba(30, 30, 38, 0.85);
		--border: #3a3a40;
		--text: #ece7da;
		--shadow: 0 12px 34px rgba(0, 0, 0, 0.6);
	}

	.bg {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		display: block;
		image-rendering: pixelated;
		opacity: 0.14;
		pointer-events: none;
		z-index: -1;
	}

	.screen {
		position: relative;
		min-height: 100vh;
		box-sizing: border-box;
		padding: 1.5rem 1.5rem 12rem;
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
		text-decoration: underline;
	}
	.controls {
		flex-shrink: 0;
		display: flex;
		gap: 0.5rem;
	}
	.toggle {
		flex-shrink: 0;
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		padding: 0;
		border: var(--bw) solid var(--border);
		background: var(--panel);
		color: inherit;
		cursor: pointer;
		font-family: inherit;
	}
	.toggle svg {
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
		border: var(--bw) solid var(--border);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		background: var(--panel);
		box-shadow: var(--shadow);
	}
	.panel h2 {
		margin: 0 0 1rem;
		font-size: 0.9rem;
	}
	.sub {
		margin: 0 0 0.6rem;
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		border-bottom: var(--bw) solid var(--border);
		padding-bottom: 0.3rem;
	}
	.stats-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.75rem;
	}
	.stats-email {
		font-weight: normal;
		letter-spacing: 0;
		text-decoration: none;
		color: inherit;
		opacity: 0.8;
	}
	.stats-email:hover {
		text-decoration: underline;
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
		border-right: var(--bw) solid var(--border);
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
		border: var(--bw) solid var(--border);
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}
	.model {
		position: relative;
		flex: 1;
		display: grid;
		place-items: center;
		margin: 1rem 0;
		min-height: 240px;
		overflow: hidden;
		padding: 6px;
		box-sizing: border-box;
		/* Marching ants: dashes drawn as gradients on each edge, then scrolled. */
		background-image:
			linear-gradient(90deg, var(--border) 50%, transparent 50%),
			linear-gradient(90deg, var(--border) 50%, transparent 50%),
			linear-gradient(0deg, var(--border) 50%, transparent 50%),
			linear-gradient(0deg, var(--border) 50%, transparent 50%);
		background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
		background-size: 12px 2px, 12px 2px, 2px 12px, 2px 12px;
		background-position: 0 0, 0 100%, 0 0, 100% 0;
		animation: march 2s linear infinite;
	}
	@keyframes march {
		to {
			background-position: 12px 0, -12px 100%, 0 -12px, 100% 12px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.model {
			animation: none;
		}
	}
	.model-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.photo-credit {
		position: absolute;
		right: 10px;
		bottom: 10px;
		padding: 0.4rem 0.7rem;
		font-size: 0.8rem;
		letter-spacing: 0.05em;
		color: #fff;
		background: rgba(0, 0, 0, 0.6);
		opacity: 0;
		transition: opacity 0.25s ease;
		pointer-events: none;
	}
	.model:hover .photo-credit {
		opacity: 1;
	}
	.location,
	.likes {
		font-size: 0.7rem;
		letter-spacing: 0.1em;
	}
	.likes {
		margin: 0 0 1rem;
	}
	.stat-row {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 0.75rem;
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

	.rule {
		border: none;
		border-top: 5px solid var(--border);
		margin: 2.5rem 0;
		width: 100%;
	}

	/* missions */
	.mission-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.75rem;
	}
	.mission {
		position: relative;
		border: var(--bw) solid var(--border);
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: inherit;
		overflow: hidden;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}
	.mission:global(.hovering) {
		transform: translateY(-6px);
		box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18);
	}
	.mission.open {
		border-style: dashed;
	}
	/* Placeholder image: fills the whole card edge-to-edge and fades in over the
	   text on hover, without changing the card's size. */
	.card-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.6s ease;
	}
	/* For transparent logos: show the whole (square) image on a white ground. */
	.card-img.contain {
		object-fit: contain;
		background: #fff;
	}
	.mission:global(.hovering) .card-img {
		opacity: 1;
	}
	.badge {
		align-self: flex-start;
		margin-bottom: 0.4rem;
		padding: 0.15rem 0.4rem;
		font-size: 0.6rem;
		letter-spacing: 0.1em;
		border: var(--bw) solid #e6b23e;
		color: #e6b23e;
	}
	.badge.complete {
		border-color: #39d353;
		color: #39d353;
	}
	.mission-name {
		font-size: 0.95rem;
	}
	.mission-brief {
		margin: 0.5rem 0 0;
		font-size: 0.8rem;
		line-height: 1.4;
	}
	/* activity log */
	.bio {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.55;
	}
	.divider {
		border: none;
		border-top: var(--bw) solid var(--border);
		margin: 1.25rem 0;
	}
	.inventory {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.slot {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: var(--bw) solid var(--border);
		background: var(--panel);
	}
	.slot img {
		width: 24px;
		height: 24px;
		display: block;
	}
	.chart {
		display: block;
		margin-bottom: 1.1rem;
		background: #fff;
		padding: 6px;
		border: var(--bw) solid var(--border);
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
