<script lang="ts">
	import Project from '$lib/components/Project.svelte';
	import { onMount } from 'svelte';

	const messages = [
		'seen here at 2AM exhausted while staffing an Austrian hackathon',
		'TODO: replace me',
		'TODO: replace me',
		'TODO: replace me'
	];

	const images = [
		'/images/headshot.png',
		'/images/replace-me-2.png',
		'/images/replace-me-3.png',
		'/images/replace-me-4.png'
	];

	const imageAlts = [
		'Euan in a suit at an Austrian hackathon at 2AM',
		'TODO: replace me',
		'TODO: replace me',
		'TODO: replace me'
	];

	let displayedText = $state('');
	let messageIndex = $state(0);
	let phase = $state<'typing' | 'pausing' | 'untyping'>('typing');
	let scrolled = $state(false);

	const TYPE_MS = 45;
	const UNTYPE_MS = 25;
	const PAUSE_AFTER_TYPE_MS = 4000;
	const PAUSE_AFTER_UNTYPE_MS = 1500;

	onMount(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 24;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();

		let timer: ReturnType<typeof setTimeout>;

		function tick() {
			const message = messages[messageIndex];
			if (phase === 'typing') {
				if (displayedText.length < message.length) {
					displayedText = message.slice(0, displayedText.length + 1);
					timer = setTimeout(tick, TYPE_MS);
				} else {
					phase = 'pausing';
					timer = setTimeout(tick, PAUSE_AFTER_TYPE_MS);
				}
			} else if (phase === 'pausing') {
				phase = 'untyping';
				timer = setTimeout(tick, UNTYPE_MS);
			} else {
				if (displayedText.length > 0) {
					displayedText = displayedText.slice(0, -1);
					timer = setTimeout(tick, UNTYPE_MS);
				} else {
					messageIndex = (messageIndex + 1) % messages.length;
					phase = 'typing';
					timer = setTimeout(tick, PAUSE_AFTER_UNTYPE_MS);
				}
			}
		}

		tick();
		return () => {
			clearTimeout(timer);
			window.removeEventListener('scroll', onScroll);
		};
	});

	const stickerParagraph =
		'I work on Hack Club Stickers with maxstellar and alice — a SvelteKit 2, Drizzle and Three.js rewrite of the site where teen hackers earn physical vinyl stickers by shipping projects. We added community voting on new designs, a public JSON catalog API, profiles, ordering, and a 3D viewer that makes the sticker drawer feel like a real-world shelf. Art comes from kat, with extra wiring from dani.';

	const beestParagraph =
		"I'm building Beest with the Hack Club community — a NestJS 11 + PostgreSQL backend and SvelteKit 2 / Svelte 5 frontend powering the You Ship We Ship hackathon in the Netherlands. Hackers sign in, ship projects, share feedback, and redeem prizes through an in-app shop, with OAuth, Hackatime time-tracking, leaderboards, and admin tools wired into a clean API/UI monorepo.";
</script>

<section class="hero">
	<div class="text">
		<h1>THIS IS EUAN!</h1>
		<p class="typewriter">{displayedText}<span class="caret">|</span></p>
	</div>
	<div class="photo">
		<img src={images[messageIndex]} alt={imageAlts[messageIndex]} />
	</div>
	<ul class="contacts">
		<li class="contact-github"><a href="https://github.com/edRipper">github</a></li>
		<li class="contact-linkedin">
			<a href="https://www.linkedin.com/in/euan-ripper-ab876528b/">linkedin</a>
		</li>
		<li class="contact-instagram"><a href="https://www.instagram.com/euanripper/">instagram</a></li>
	</ul>
	<div class="scroll-indicator" class:hidden={scrolled} aria-hidden="true">
		<span>scroll</span>
		<span class="arrow">↓</span>
	</div>
</section>

<section class="intro">
	<p>
		I'm a software engineer building open-source tools for <a href="https://hackclub.com">Hack Club</a>,
		a global community of teenage hackers. Most of my work sits between hackathon logistics, community
		tooling, and shipping things that look like they were printed in a basement. Below are two of the
		projects I've helped ship — the people I work with are the best part.
	</p>
</section>

<Project
	heading="STICKERS"
	paragraph={stickerParagraph}
	linkPhrase="Hack Club Stickers"
	linkHref="https://github.com/hackclub/stickers"
	imageSrc="/images/sticker.png"
	imageAlt="Hack Club sticker"
	imageHref="https://stickers.hackclub.com"
	side="left"
	radiusBoost={1.4}
	rotation={30}
	rock
	size="clamp(180px, 22vw, 280px)"
	techs={[
		{ slug: 'svelte', label: 'SvelteKit 2' },
		{ slug: 'drizzle', color: '4a8b1c', label: 'Drizzle ORM' },
		{ slug: 'threedotjs', label: 'Three.js' }
	]}
/>

<Project
	heading="BEEST"
	paragraph={beestParagraph}
	linkPhrase="Beest"
	linkHref="https://github.com/hackclub/beest"
	imageSrc="/images/beest.png"
	imageAlt="Beest logo"
	imageHref="https://beest.hackclub.com"
	side="right"
	rotation={-4}
	techs={[
		{ slug: 'nestjs', label: 'NestJS 11' },
		{ slug: 'postgresql', label: 'PostgreSQL' },
		{ slug: 'svelte', label: 'SvelteKit 2 / Svelte 5' }
	]}
/>

<style>
	.hero {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 2.5rem;
		max-width: 1100px;
		margin: 0 auto;
		padding: 4rem 2rem;
		min-height: 100vh;
		box-sizing: border-box;
		position: relative;
	}

	.scroll-indicator {
		position: absolute;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		font-family: 'Terminal Grotesque', monospace;
		font-size: 0.95rem;
		opacity: 0.65;
		letter-spacing: 0.1em;
		transition: opacity 0.35s ease;
		pointer-events: none;
	}

	.scroll-indicator.hidden {
		opacity: 0;
	}

	.scroll-indicator .arrow {
		font-size: 1.4rem;
		line-height: 1;
		animation: scroll-bounce 1.8s ease-in-out infinite;
	}

	@keyframes scroll-bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(6px);
		}
	}

	.text {
		flex: 0 1 auto;
		display: grid;
		grid-template-columns: min-content;
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
		min-height: 2.4em;
		max-width: 100%;
		word-wrap: break-word;
	}

	.caret {
		display: inline-block;
		margin-left: 0.05em;
		animation: blink 1s steps(2, start) infinite;
	}

	@keyframes blink {
		to {
			visibility: hidden;
		}
	}

	.photo {
		flex-shrink: 0;
	}

	.contacts {
		list-style: none;
		padding: 0;
		margin: 0 calc(50% - 50vw - 1.25rem) 0 auto;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.6rem;
		font-family: 'Terminal Grotesque', monospace;
		font-size: clamp(1.25rem, 2.2vw, 2.25rem);
		text-align: right;
	}

	.contacts li {
		border: 2px solid #1a1814;
		padding: 0.35rem 3rem 0.35rem 1.25rem;
		background: rgba(255, 250, 235, 0.55);
	}

	.contacts a {
		color: inherit;
		text-decoration: none;
		transition: color 0.25s ease;
	}

	.contact-github {
		border-color: #6e5494;
	}

	.contact-github a {
		color: #6e5494;
	}

	.contact-linkedin {
		border-color: #0a66c2;
	}

	.contact-linkedin a {
		color: #0a66c2;
	}

	.contact-instagram {
		border-color: #d62976;
	}

	.contact-instagram a {
		background: linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
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

	.intro {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem 2rem 4rem;
	}

	.intro p {
		font-family: 'Terminal Grotesque', monospace;
		font-size: clamp(1.1rem, 2vw, 1.75rem);
		line-height: 1.45;
		margin: 0;
		max-width: 56ch;
	}

	.intro a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	@media (max-width: 700px) {
		.hero {
			gap: 1rem;
			padding: 2rem 1rem;
		}

		.intro {
			padding: 1rem 1rem 2rem;
		}
	}
</style>
