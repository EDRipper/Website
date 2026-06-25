<script lang="ts">
	// "Customise your character" screen — character card, commit stats and missions.
	import { onMount } from 'svelte';
	import { portraitCols, portraitRows, portraitChars, portraitColors } from '$lib/portrait-ascii';
	import { iceCols, iceRows, iceChars, iceColors } from '$lib/ice-ascii';

	// Decode a base64 RGB blob (one per portrait) to bytes, lazily.
	function decodeRGB(b64: string): Uint8Array {
		const bin = atob(b64);
		const buf = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
		return buf;
	}
	let euanRGB: Uint8Array | null = null;
	let iceRGB: Uint8Array | null = null;

	// A big 5-point ASCII star, scattered around the light-mode portrait.
	const STAR = `       *
      ***
     *****
    *******
***************
 *************
  ***********
   ***   ***
  ***     ***
 ***       ***
**           **`;

	// Paint the ASCII portrait onto a canvas. Dark mode: the colour selfie on a
	// near-black ground (each cell a dimmed fill + brighter glyph). Light mode: the
	// ice-rink selfie with its background cut out, drawn as darker ink on the light
	// panel (transparent, no fill) so it reads like a print. CSS scales it to fit.
	const FONT = 12;
	const CW = FONT * 0.6; // monospace advance
	const LH = FONT; // line height
	let asciiCanvas = $state<HTMLCanvasElement | null>(null);
	function drawAscii() {
		const cv = asciiCanvas;
		if (!cv) return;
		const ctx = cv.getContext('2d');
		if (!ctx) return;
		const light = !dark;
		const cols = light ? iceCols : portraitCols;
		const rows = light ? iceRows : portraitRows;
		const chars = light ? iceChars : portraitChars;
		const rgb = light
			? (iceRGB ??= decodeRGB(iceColors))
			: (euanRGB ??= decodeRGB(portraitColors));
		cv.width = cols * CW;
		cv.height = rows * LH;
		if (light) {
			ctx.clearRect(0, 0, cv.width, cv.height); // transparent → light panel shows
		} else {
			ctx.fillStyle = '#070608';
			ctx.fillRect(0, 0, cv.width, cv.height);
		}
		ctx.font = `${FONT}px 'Departure Mono', ui-monospace, monospace`;
		ctx.textBaseline = 'top';
		const INK = light ? 0.6 : 1; // darken the print so it carries on the light ground
		const BG = 0.5;
		let p = 0;
		for (let ry = 0; ry < rows; ry++) {
			// +ry skips the row's trailing newline in the flat chars string.
			const base = ry * (cols + 1);
			for (let rx = 0; rx < cols; rx++, p++) {
				const ch = chars[base + rx];
				const r = rgb[p * 3], g = rgb[p * 3 + 1], b = rgb[p * 3 + 2];
				if (light) {
					if (ch === ' ') continue;
					ctx.fillStyle = `rgb(${(r * INK) | 0},${(g * INK) | 0},${(b * INK) | 0})`;
					ctx.fillText(ch, rx * CW, ry * LH);
				} else {
					ctx.fillStyle = `rgb(${r * BG},${g * BG},${b * BG})`;
					ctx.fillRect(rx * CW, ry * LH, CW + 1, LH + 1);
					if (ch === ' ') continue;
					ctx.fillStyle = `rgb(${r},${g},${b})`;
					ctx.fillText(ch, rx * CW, ry * LH);
				}
			}
		}
	}
	$effect(() => {
		dark; // redraw when the theme flips
		if (asciiCanvas) drawAscii();
	});

	// Theme. Initialised from the OS preference on mount, then user-toggleable.
	let dark = $state(true);
	$effect(() => {
		document.body.classList.toggle('dark', dark);
	});

	// ── Synthesised audio: menu SFX + chiptune background loop (no files) ──
	let soundOn = $state(true);
	let musicOn = $state(false);
	let audioCtx: AudioContext | null = null;
	function getCtx(): AudioContext | null {
		const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		if (!Ctx) return null;
		audioCtx ??= new Ctx();
		if (audioCtx.state === 'suspended') audioCtx.resume();
		return audioCtx;
	}
	function voice(freq: number, dur: number, vol: number, type: OscillatorType = 'square', when = 0) {
		const ctx = getCtx();
		if (!ctx) return;
		const t = ctx.currentTime + when;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = type;
		osc.frequency.value = freq;
		gain.gain.setValueAtTime(vol, t);
		gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(t);
		osc.stop(t + dur);
	}
	// Shared level so the menu SFX sit at the same loudness as the music.
	const AUDIO_VOL = 0.25;
	// Cursor-move tick on hover; two-note "confirm" rise on select.
	const moveSound = () => soundOn && voice(740, 0.03, AUDIO_VOL);
	const selectSound = () => {
		if (!soundOn) return;
		voice(660, 0.06, AUDIO_VOL);
		voice(990, 0.08, AUDIO_VOL, 'square', 0.055);
	};
	// Soft two-note rise played when a section first scrolls into view.
	const discoverSound = () => {
		if (!soundOn) return;
		voice(523.25, 0.09, AUDIO_VOL * 0.55, 'triangle');
		voice(783.99, 0.13, AUDIO_VOL * 0.55, 'triangle', 0.07);
	};

	// Background music: Kubbi — Spirit Dancer (credit at the foot of the page).
	let musicEl: HTMLAudioElement | null = null;
	$effect(() => {
		const el = musicEl;
		if (!el) return;
		el.volume = AUDIO_VOL;
		if (musicOn) el.play().catch(() => (musicOn = false));
		else el.pause();
	});

	onMount(() => {
		const sel = 'a, button, .mission, .slot';
		let last: Element | null = null;
		const over = (e: PointerEvent) => {
			const el = (e.target as Element)?.closest?.(sel);
			if (el && el !== last) {
				last = el;
				moveSound();
			} else if (!el) {
				last = null;
			}
		};
		const click = (e: MouseEvent) => {
			if ((e.target as Element)?.closest?.(sel)) selectSound();
		};
		// Browsers keep audio suspended until a real gesture (hover doesn't count),
		// so prime the context on the first pointer/key press anywhere.
		const unlock = () => getCtx();
		window.addEventListener('pointerdown', unlock, { once: true });
		window.addEventListener('keydown', unlock, { once: true });

		document.addEventListener('pointerover', over);
		document.addEventListener('click', click);
		return () => {
			window.removeEventListener('pointerdown', unlock);
			window.removeEventListener('keydown', unlock);
			document.removeEventListener('pointerover', over);
			document.removeEventListener('click', click);
		};
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
		{ name: 'NestJS', slug: 'nestjs' },
		{ name: 'Fusion 360', src: '/images/fusion360.svg' }
	];

	// ── Personality recommendations ──────────────────────────────────────────
	// Favorite songs (linked to a Spotify search); visitors can suggest one back.
	const songs = [
		{ title: 'Creature', artist: 'half·alive' },
		{ title: 'Nobody', artist: 'Hozier' },
		{ title: 'Ankles', artist: 'Lucy Dacus' },
		{ title: 'Banana Pancakes', artist: 'Jack Johnson' },
		{ title: 'Fade Into You', artist: 'Mazzy Star' },
		{ title: 'Angry Young Man', artist: 'Billy Joel' },
		{ title: 'First Love / Late Spring', artist: 'Mitski' }
	];
	const songSearch = (s: { title: string; artist: string }) =>
		`https://open.spotify.com/search/${encodeURIComponent(`${s.title} ${s.artist}`)}`;
	// Visitors can suggest a song; it's POSTed to /api/suggest → Neon Postgres.
	let suggestSong = $state('');
	let suggestName = $state('');
	let suggestHoney = $state(''); // honeypot — bots fill it, humans don't
	let suggestState = $state<'idle' | 'sending' | 'done' | 'error'>('idle');
	async function submitSuggestion(e: SubmitEvent) {
		e.preventDefault();
		const song = suggestSong.trim();
		if (!song || suggestState === 'sending') return;
		suggestState = 'sending';
		try {
			const res = await fetch('/api/suggest', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ song, name: suggestName.trim(), website: suggestHoney })
			});
			if (!res.ok) throw new Error();
			suggestState = 'done';
			suggestSong = '';
			suggestName = '';
		} catch {
			suggestState = 'error';
		}
	}
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

	// Reveal-on-scroll: fade/slide an element in the first time it enters view.
	// `delay` staggers grouped items (cards); `sound` plays the discovery note.
	// Classes are stripped after the transition so they never shadow the card's
	// own hover transitions. Skipped entirely under prefers-reduced-motion.
	function reveal(node: HTMLElement, opts: { delay?: number; sound?: boolean } = {}) {
		const { delay = 0, sound = false } = opts;
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return {};
		node.classList.add('reveal');
		const onEnd = (ev: TransitionEvent) => {
			if (ev.propertyName !== 'opacity') return;
			node.classList.remove('reveal', 'in');
			node.removeEventListener('transitionend', onEnd);
		};
		const show = () => {
			node.addEventListener('transitionend', onEnd);
			node.classList.add('in');
			if (sound) discoverSound();
		};
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (!e.isIntersecting) continue;
					io.disconnect();
					if (delay) setTimeout(show, delay);
					else show();
				}
			},
			{ rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
		);
		io.observe(node);
		return {
			destroy() {
				io.disconnect();
				node.removeEventListener('transitionend', onEnd);
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

	// Fraction (0–100) of the current year of age elapsed, for the XP bar.
	function ageProgress(month: number, day: number): number {
		const now = new Date();
		let last = new Date(now.getFullYear(), month - 1, day);
		if (now < last) last = new Date(now.getFullYear() - 1, month - 1, day);
		const next = new Date(last.getFullYear() + 1, month - 1, day);
		return Math.min(100, Math.max(0, ((+now - +last) / (+next - +last)) * 100));
	}
	const agePct = Math.round(ageProgress(11, 26));
	let xp = $state(0);
	onMount(() => {
		xp = agePct;
	});
	// Terminal-style block gauge: fixed run of cells, filled in left-to-right.
	const XP_CELLS = 60;
	const xpFilled = $derived(Math.round((xp / 100) * XP_CELLS));

	// Right-hand character panel is split into tabs.
	const statTabs = [
		{ id: 'stats', label: 'STATS' },
		{ id: 'story', label: 'STORY' },
		{ id: 'personality', label: 'PERSONALITY' }
	] as const;
	let statTab = $state<(typeof statTabs)[number]['id']>('stats');

	// Story paragraphs, rendered with animated plane dividers between them.
	const storyParas = [
		`Started programming at 16 to automate his very boring warehouse job, and got hooked on the intersection of maths and art — using code as a tool to explore it. He quickly realised that no community of makers existed in his area of rural England, so he started one. He taught a class, won a competition and was offered a $50,000 fellowship with Hack Club. At 18, he moved to America to build the future of technical education for teens.`,
		`Over that year in America he ran hackathons with the creators that first showed him coding, travelled all across America and Europe to mentor at events, and got teens to program for 10,000 hours — tracked using Hackatime.`,
		`Soon though, Euan will fly the other way. Home to England to study Mechatronics and Robotics Engineering at Loughborough. We are yet to see where that will go...`
	];
	// Both divider planes cross at the same pace — the reading time of the first
	// (top) paragraph at an average adult reading speed.
	const STORY_WPM = 230;
	const readMs = (text: string) => (text.trim().split(/\s+/).length / STORY_WPM) * 60000;

	// ── Hackatime coding stats ───────────────────────────────────────────────
	// Public stats lookup must be enabled in Hackatime (Settings → My Settings →
	// Privacy). The public endpoint only exposes language/project breakdowns —
	// editor/OS would need an authenticated key, so "loadout" uses top language
	// + top project (no secret shipped to the browser).
	const HACKATIME_USER = 'U098SB3609L';
	// Slice colours for the language pie (last is grey for the "Other" bucket).
	const LANG_COLORS = ['var(--accent)', '#4dd2ff', '#e6b23e', '#ff6b9d', '#b48cff', '#8f8a7e'];

	// Hackatime project names come from local folder names, so they don't always
	// match a GitHub repo. Most are work projects in the hackclub org, so default
	// to github.com/hackclub/<name>; add overrides here for the exceptions.
	const PROJECT_OWNER = 'hackclub';
	const PROJECT_LINKS: Record<string, string> = {
		// 'hackatime-project-name': 'https://github.com/owner/repo'
		stickersV2: 'https://github.com/hackclub/stickers',
		stickers: 'https://github.com/hackclub/stickersv1'
	};
	const projectLink = (name: string) =>
		PROJECT_LINKS[name] ?? `https://github.com/${PROJECT_OWNER}/${encodeURIComponent(name)}`;

	type Lang = { name: string; percent: number; color: string };
	type Proj = { name: string; text: string; href: string };
	type CodingStats = { total: string; streak: number; langs: Lang[]; projects: Proj[] };
	let coding = $state<CodingStats | null>(null);
	let codingErr = $state<string | null>(null); // visible diagnostic if the fetch fails

	// Build the conic-gradient for the pie from cumulative language percentages.
	function pieGradient(langs: Lang[]): string {
		let acc = 0;
		const stops = langs.map((l) => {
			const start = acc;
			acc += l.percent;
			return `${l.color} ${start}% ${acc}%`;
		});
		return `conic-gradient(${stops.join(', ')})`;
	}

	onMount(async () => {
		const url = `https://hackatime.hackclub.com/api/v1/users/${HACKATIME_USER}/stats?features=languages,projects`;
		// Retry a couple of times so a transient blip (5xx/network) doesn't leave
		// the panel permanently blank until the next reload.
		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				const res = await fetch(url, { cache: 'no-store' });
				if (!res.ok) {
					console.warn(`[hackatime] HTTP ${res.status} (attempt ${attempt})`);
					codingErr = `HTTP ${res.status}`;
					if (res.status >= 500 || res.status === 429) continue; // transient — retry
					return; // 4xx (e.g. public stats disabled) — give up quietly
				}
				const { data } = await res.json();
				// Top 5 *named* languages get their own slice; the tail plus the API's
				// own "Other" bucket roll into a single "Other" (avoids a duplicate key).
				const raw = (data.languages ?? []) as { name: string; percent: number }[];
				const named = raw.filter((l) => l.name && l.name.toLowerCase() !== 'other');
				const langs = named
					.slice(0, 5)
					.map((l, i) => ({ name: l.name, percent: l.percent, color: LANG_COLORS[i] }));
				const kept = new Set(langs.map((l) => l.name));
				const restPct = raw
					.filter((l) => !kept.has(l.name))
					.reduce((s, l) => s + (l.percent || 0), 0);
				if (restPct > 0.5) langs.push({ name: 'Other', percent: restPct, color: LANG_COLORS[5] });
				const projects = ((data.projects ?? []) as { name: string; text: string }[])
					.slice(0, 5)
					.map((p) => ({ name: p.name, text: p.text, href: projectLink(p.name) }));
				coding = {
					total: data.human_readable_total ?? '—',
					streak: data.streak ?? 0,
					langs,
					projects
				};
				codingErr = null;
				return; // success
			} catch (err) {
				console.warn(`[hackatime] fetch failed (attempt ${attempt}):`, err);
				codingErr = err instanceof Error ? `${err.name}: ${err.message}` : 'fetch failed';
			}
		}
	});

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
			class:active={musicOn}
			onclick={() => (musicOn = !musicOn)}
			aria-label={musicOn ? 'Stop background music' : 'Play background music'}
			aria-pressed={musicOn}
			title={musicOn ? 'Stop music' : 'Play music'}
		>
			{#if musicOn}
				<!-- music playing -->
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M9 18V5l12-2v13" />
					<circle cx="6" cy="18" r="3" />
					<circle cx="18" cy="16" r="3" />
				</svg>
			{:else}
				<!-- music off (slashed note) -->
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M9 18V5l12-2v13" />
					<circle cx="6" cy="18" r="3" />
					<circle cx="18" cy="16" r="3" />
					<line x1="3" y1="3" x2="21" y2="21" />
				</svg>
			{/if}
		</button>
		<button
			class="toggle"
			class:active={soundOn}
			onclick={() => (soundOn = !soundOn)}
			aria-label={soundOn ? 'Mute sound effects' : 'Unmute sound effects'}
			aria-pressed={soundOn}
			title={soundOn ? 'Mute sound effects' : 'Unmute sound effects'}
		>
			{#if soundOn}
				<!-- speaker on -->
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M11 5 6 9H2v6h4l5 4z" />
					<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
				</svg>
			{:else}
				<!-- speaker muted -->
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M11 5 6 9H2v6h4l5 4z" />
					<line x1="23" y1="9" x2="17" y2="15" />
					<line x1="17" y1="9" x2="23" y2="15" />
				</svg>
			{/if}
		</button>
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
				<div class="model" class:light={!dark}>
					{#if !dark}
						<pre class="star star-a" aria-hidden="true">{STAR}</pre>
						<pre class="star star-b" aria-hidden="true">{STAR}</pre>
						<pre class="star star-c" aria-hidden="true">{STAR}</pre>
					{/if}
					<canvas
						class="model-ascii"
						bind:this={asciiCanvas}
						aria-label="ASCII portrait of Euan Ripper"
					></canvas>
					<span class="photo-credit">photo credit: reem &lt;3</span>
				</div>
			</div>

			<div class="stage-half stats-half">
				<div class="sub tabs-head">
					<div class="tabs" role="tablist" aria-label="Character details">
						{#each statTabs as t (t.id)}
							<button
								class="tab"
								class:active={statTab === t.id}
								role="tab"
								aria-selected={statTab === t.id}
								onclick={() => (statTab = t.id)}
							>
								{t.label}
							</button>
						{/each}
					</div>
					<a class="stats-email" href="mailto:euanripper2@gmail.com">euanripper2@gmail.com</a>
				</div>

				<div class="tab-panel" role="tabpanel">
					{#if statTab === 'stats'}
						<div class="stat-row">
							<span class="lvl-badge">Level {level}</span>
							<div
								class="xp-bar"
								role="progressbar"
								aria-valuenow={agePct}
								aria-valuemin="0"
								aria-valuemax="100"
							>
								<span class="xp-brk">[</span><!--
								-->{#each { length: XP_CELLS } as _, i}<span
										class="xp-cell"
										class:on={i < xpFilled}>{i < xpFilled ? '█' : '░'}</span
									>{/each}<!--
								--><span class="xp-brk">]</span>
							</div>
							<span class="location">LOCATION: VERMONT</span>
						</div>
						<div class="xp">
							<span class="xp-label">{agePct}% through Level {level} → {level + 1}</span>
						</div>

						{#if coding}
							<dl class="telemetry">
								<div class="telem-line">
									<dt>CODING TIME</dt>
									<dd>{coding.total}</dd>
								</div>
								{#if coding.streak > 2}
									<div class="telem-line">
										<dt>STREAK</dt>
										<dd class="streak">
											<img class="fire" src="/images/fire.gif" alt="" aria-hidden="true" />
											{coding.streak} days
										</dd>
									</div>
								{/if}
							</dl>
							{#if coding.langs.length}
								<div class="lang-breakdown">
									<div
										class="pie"
										style="background: {pieGradient(coding.langs)}"
										role="img"
										aria-label="Top languages by coding time"
									></div>
									<ul class="legend">
										{#each coding.langs as l (l.name)}
											<li>
												<span class="swatch" style="background: {l.color}"></span>
												<span class="lname">{l.name}</span>
												<span class="pct">{Math.round(l.percent)}%</span>
											</li>
										{/each}
									</ul>
									{#if coding.projects.length}
										<nav class="projects" aria-label="Top projects">
											<span class="projects-head">TOP PROJECTS ↗</span>
											{#each coding.projects as p (p.name)}
												<a
													class="proj"
													href={p.href}
													target="_blank"
													rel="noopener noreferrer"
												>
													<span class="pname">{p.name}</span>
													<span class="ptime">{p.text}</span>
												</a>
											{/each}
										</nav>
									{/if}
								</div>
							{/if}
						{:else if codingErr}
							<p class="telem-err">⚠ Hackatime telemetry offline — {codingErr}</p>
						{/if}

						<a class="chart" href="https://github.com/edRipper" target="_blank" rel="noopener noreferrer">
							<img
								src="https://ghchart.rshah.org/39d353/edRipper"
								alt="GitHub commit history for edRipper"
								loading="lazy"
							/>
						</a>

						<h3 class="sub inv-head">Inventory / Tools</h3>
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
					{:else if statTab === 'story'}
						{#each storyParas as para, i (i)}
							{#if i > 0}
								<div class="flight {i % 2 === 0 ? 'rev' : ''}" aria-hidden="true">
									<span
										class="flight-plane"
										style="animation-duration: {readMs(storyParas[0])}ms"
									>✈︎</span>
								</div>
							{/if}
							<p class="bio">{para}</p>
						{/each}
					{:else}
						<p class="likes">LIKES: circus arts, robotics, web dev, hackathons</p>

						<h3 class="sub rec-head">My favorite songs:</h3>
						<ol class="song-list">
							{#each songs as s (s.title)}
								<li>
									<span class="note">♫</span>
									<a href={songSearch(s)} target="_blank" rel="noopener noreferrer">
										{s.title} · {s.artist}
									</a>
								</li>
							{/each}
						</ol>
						{#if suggestState === 'done'}
							<p class="suggest-done">thanks — added to the pile ♪</p>
						{:else}
							<form class="song-suggest" onsubmit={submitSuggestion}>
								<label class="suggest-label" for="suggest-song">know a song i might like?</label>
								<div class="suggest-row">
									<input
										id="suggest-song"
										type="text"
										bind:value={suggestSong}
										maxlength="200"
										placeholder="song — artist"
										required
									/>
									<input
										class="suggest-name"
										type="text"
										bind:value={suggestName}
										maxlength="80"
										placeholder="you (optional)"
									/>
									<input
										class="hp"
										type="text"
										tabindex="-1"
										autocomplete="off"
										bind:value={suggestHoney}
										aria-hidden="true"
									/>
									<button type="submit" disabled={suggestState === 'sending'}>
										{suggestState === 'sending' ? '…' : 'send'}
									</button>
								</div>
								{#if suggestState === 'error'}
									<span class="suggest-err">couldn’t send — try again</span>
								{/if}
							</form>
						{/if}

					{/if}
				</div>
			</div>
		</section>

	</div>

	<!-- ── Missions (projects) ── -->
	<div class="section-head" use:reveal={{ sound: true }}>
		<span class="line"></span>
		<span class="arrow-stream" aria-hidden="true"></span>
		<h2>Missions: See challenges from the profession skill tree</h2>
		<span class="arrow-stream" aria-hidden="true"></span>
		<span class="line"></span>
	</div>
	<section class="panel missions">
		<div class="mission-grid">
			{#each missions as m, i (m.name)}
				{@const external = m.href?.startsWith('http')}
				<svelte:element
					this={m.href ? 'a' : 'div'}
					class="mission"
					class:open={m.status === 'OPEN'}
					href={m.href}
					target={external ? '_blank' : undefined}
					rel={external ? 'noopener noreferrer' : undefined}
					use:hoverHold
					use:reveal={{ delay: i * 70 }}
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

	<!-- ── Sidequests ── -->
	<div class="section-head" use:reveal={{ sound: true }}>
		<span class="line"></span>
		<span class="arrow-stream" aria-hidden="true"></span>
		<h2>Sidequests: Lore building adventures on the side of main missions</h2>
		<span class="arrow-stream" aria-hidden="true"></span>
		<span class="line"></span>
	</div>
	<section class="panel sidequests">
		<div class="mission-grid">
			{#each sidequests as q, i (q.name)}
				<a class="mission" href={q.href} use:hoverHold use:reveal={{ delay: i * 70 }}>
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

	<footer class="credits">
		<p>
			Music: <a href="https://kubbi.bandcamp.com" target="_blank" rel="noopener noreferrer"
				>Kubbi — Spirit Dancer</a
			>
		</p>
	</footer>

	<audio bind:this={musicEl} src="/audio/spirit-dancer.mp3" loop preload="none"></audio>
</main>

<style>
	:global(body) {
		--bg: #f0ede4;
		--panel: rgba(248, 245, 238, 0.85);
		--border: #8f8a7e;
		--bw: 2px;
		--text: #1a1814;
		--accent: #1f9a3d; /* darker green for legibility on the light ground */
		--shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
		background: var(--bg);
		color: var(--text);
		cursor: url('/cursors/hitbox.png') 16 16, crosshair;
	}
	:global(a),
	:global(button),
	:global(label) {
		cursor: url('/cursors/hitbox-green.png') 16 16, pointer;
	}
	:global(body.dark) {
		--bg: #131318;
		--panel: rgba(30, 30, 38, 0.85);
		--border: #3a3a40;
		--text: #ece7da;
		--accent: #39d353; /* brighter green reads better on the dark ground */
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
		padding: 1.5rem 1.5rem 4rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		font-family: 'Departure Mono', ui-monospace, monospace;
	}

	.credits {
		margin-top: 2rem;
		text-align: center;
		font-size: 0.8rem;
		opacity: 0.7;
	}
	.credits a {
		color: inherit;
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
		font-family: inherit;
	}
	.toggle.active {
		border-color: var(--accent);
		color: var(--accent);
	}
	.toggle svg {
		width: 20px;
		height: 20px;
		display: block;
	}

	.layout {
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
	/* Tab bar across the top of the character panel. */
	.tabs-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 0.75rem;
		margin-bottom: 0.6rem;
		padding-bottom: 0;
		border-bottom: var(--bw) solid var(--border);
	}
	.tabs {
		display: flex;
		gap: 0.25rem;
	}
	.tab {
		padding: 0.3rem 0.6rem;
		font-family: inherit;
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		color: inherit;
		background: transparent;
		border: var(--bw) solid var(--border);
		border-bottom: none;
		opacity: 0.65;
		transition: opacity 0.15s ease, color 0.15s ease, border-color 0.15s ease;
	}
	.tab:hover {
		opacity: 1;
	}
	.tab.active {
		opacity: 1;
		color: var(--text);
		border-color: var(--text);
		/* sit on top of the head's bottom border so the active tab reads as joined */
		margin-bottom: calc(-1 * var(--bw));
		background: var(--panel);
	}
	.tab-panel {
		min-height: 320px;
		padding-top: 1.1rem;
	}
	.stats-email {
		font-weight: normal;
		letter-spacing: 0;
		text-decoration: none;
		color: inherit;
		opacity: 0.8;
		padding-bottom: 0.3rem;
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
		/* Size from our own width, not the sibling tab's height — otherwise switching
		   tabs changes the stage height and resizes the portrait. Ratio matches the
		   canvas (cols·CW / rows·LH ≈ 102/73) so cover shows the full frame, no crop. */
		width: 100%;
		aspect-ratio: 102 / 73;
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
	.model-ascii {
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
		display: block;
		object-fit: cover;
		background: #070608;
		user-select: none;
	}
	/* Light mode: show the whole cut-out print on the panel (no dark fill, no crop). */
	.model.light .model-ascii {
		object-fit: contain;
		background: transparent;
	}
	/* Big ASCII stars behind the cut-out, peeking through the removed background. */
	.star {
		position: absolute;
		z-index: 0;
		margin: 0;
		font-family: inherit;
		line-height: 1;
		white-space: pre;
		color: var(--accent);
		pointer-events: none;
		user-select: none;
	}
	.star-a {
		top: 8px;
		left: 8px;
		font-size: 8px;
		opacity: 0.55;
	}
	.star-b {
		right: 10px;
		bottom: 10px;
		font-size: 10px;
		opacity: 0.45;
	}
	.star-c {
		top: 14px;
		right: 18px;
		font-size: 6px;
		opacity: 0.35;
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
		margin-bottom: 0.6rem;
	}
	.xp {
		margin-bottom: 1rem;
	}
	.xp-bar {
		flex: 1; /* grow to fill the row, pushing LOCATION to the right edge */
		min-width: 0; /* let the nowrap cells clip instead of forcing the column wide */
		display: flex;
		align-items: stretch;
		font-size: 0.95rem;
		line-height: 1;
		white-space: nowrap;
		overflow: hidden;
	}
	.xp-brk {
		flex: 0 0 auto;
		color: var(--border);
	}
	.xp-cell {
		flex: 1 1 0; /* cells spread evenly across the widened bar */
		min-width: 0; /* allow equal widths regardless of glyph (█ is wider than ░) */
		overflow: hidden;
		text-align: center;
		color: rgba(57, 211, 83, 0.4); /* unfilled: visible so the full track reads */
		transition: color 0.25s ease;
	}
	.xp-cell.on {
		color: var(--accent);
		text-shadow: 0 0 2px rgba(57, 211, 83, 0.5); /* subtle CRT glow, no bleed */
	}
	.xp-label {
		display: block;
		margin-top: 0.3rem;
		font-size: 0.6rem;
		letter-spacing: 0.1em;
		opacity: 0.8;
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

	/* Scroll-reveal: hidden until the `reveal` action adds `.in` on entry. The
	   action strips both classes after the transition, so this never lingers. */
	:global(.reveal) {
		opacity: 0;
		transform: translateY(18px);
		transition: opacity 0.55s ease, transform 0.55s ease;
		will-change: opacity, transform;
	}
	:global(.reveal.in) {
		opacity: 1;
		transform: none;
	}

	.section-head {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		margin: 2.5rem 0;
	}
	.section-head .line {
		flex: 1;
		height: 0;
		border-top: 5px solid var(--text);
	}
	.section-head h2 {
		margin: 0;
		font-size: 0.95rem;
		text-align: center;
	}
	/* Pixel down-arrows scrolling as a seamless carousel beside the heading. The
	   SVG is used as a mask so the arrows inherit the divider's --text colour;
	   shifting the mask by exactly one cell per loop makes the stream continuous,
	   and the fixed height clips each arrow as the next follows it down. */
	.arrow-stream {
		flex: 0 0 auto;
		width: 14px;
		height: 1em;
		background-color: var(--text);
		image-rendering: pixelated;
		-webkit-mask-image: url('/images/arrow-down.svg');
		mask-image: url('/images/arrow-down.svg');
		-webkit-mask-repeat: repeat-y;
		mask-repeat: repeat-y;
		-webkit-mask-position: center 0;
		mask-position: center 0;
		-webkit-mask-size: 14px 18px;
		mask-size: 14px 18px;
		animation: arrow-stream 0.85s linear infinite;
	}
	@keyframes arrow-stream {
		to {
			-webkit-mask-position: center 18px;
			mask-position: center 18px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.arrow-stream {
			animation: none;
		}
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
		/* Match the card colour (panel over page bg). Kept opaque so the card's
		   text underneath stays hidden when the image fades in. Adapts to theme. */
		background-color: var(--bg);
		background-image: linear-gradient(var(--panel), var(--panel));
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
		border-color: var(--accent);
		color: var(--accent);
	}
	/* The amber reads too light on the off-white background — darken it. */
	:global(body:not(.dark)) .badge:not(.complete) {
		border-color: #b5651d;
		color: #b5651d;
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
	/* Animated plane hopping along a dashed line between paragraphs. */
	.flight {
		position: relative;
		height: 1.5rem;
		margin: 0.9rem 0;
		overflow: hidden;
	}
	.flight::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		border-top: 2px dashed var(--border);
	}
	.flight-plane {
		position: absolute;
		top: 50%;
		left: 0;
		line-height: 1;
		font-size: 1rem;
		color: var(--text);
		background: var(--panel); /* mask the dashes directly under the plane */
		padding: 0 0.1ch;
		/* Crosses the line once and loops; the duration is set per-plane inline to
		   the reading time of the paragraph above it, so it paces your reading. */
		animation: fly 12s steps(48) infinite;
	}
	/* `left` is container-relative, so the plane spans the full line width on any
	   screen; the matching translate keeps the whole glyph on-screen at each end. */
	@keyframes fly {
		from {
			left: 0%;
			transform: translate(0%, -50%);
		}
		to {
			left: 100%;
			transform: translate(-100%, -50%);
		}
	}
	/* Return flight: start at the right, hop leftwards, glyph mirrored. */
	.flight.rev .flight-plane {
		animation-name: fly-rev;
	}
	@keyframes fly-rev {
		from {
			left: 100%;
			transform: translate(-100%, -50%) scaleX(-1);
		}
		to {
			left: 0%;
			transform: translate(0%, -50%) scaleX(-1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.flight-plane {
			animation: none;
			opacity: 1;
			left: 50%;
			transform: translate(-50%, -50%);
		}
	}
	.inv-head {
		margin-top: 1.25rem;
	}
	/* Personality: song rec. */
	.rec-head {
		margin-top: 1.25rem;
	}
	.song-list {
		list-style: none;
		margin: 0 0 0.6rem;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.3rem 1.25rem;
		font-size: 0.85rem;
	}
	.song-list li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}
	.song-list .note {
		color: #3ec500;
		flex: 0 0 auto;
	}
	.song-list a {
		color: inherit;
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.song-list a:hover {
		color: var(--accent);
		text-decoration: underline;
	}
	.suggest-label {
		display: block;
		font-size: 0.78rem;
		opacity: 0.8;
		margin-bottom: 0.35rem;
	}
	.suggest-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.suggest-row input {
		flex: 1 1 9rem;
		min-width: 0;
		padding: 0.35rem 0.5rem;
		font-family: inherit;
		font-size: 0.8rem;
		color: inherit;
		background: var(--panel);
		border: var(--bw) solid var(--border);
	}
	.suggest-row input.suggest-name {
		flex: 0 1 7rem;
	}
	.suggest-row input:focus {
		outline: none;
		border-color: var(--accent);
	}
	.suggest-row button {
		flex: 0 0 auto;
		padding: 0.35rem 0.8rem;
		font-family: inherit;
		font-size: 0.8rem;
		color: inherit;
		background: transparent;
		border: var(--bw) solid var(--border);
	}
	.suggest-row button:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.suggest-row button:disabled {
		opacity: 0.5;
	}
	/* Honeypot — kept in the DOM for bots, hidden from real users. */
	.hp {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		opacity: 0;
	}
	.suggest-err {
		display: block;
		margin-top: 0.3rem;
		font-size: 0.72rem;
		color: #e6b23e;
	}
	.suggest-done {
		margin: 0;
		font-size: 0.8rem;
		color: var(--accent);
	}
	/* Hackatime telemetry: terminal-style key/value readout. */
	.telemetry {
		margin: 0 0 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		border: var(--bw) solid var(--border);
		padding: 0.6rem 0.75rem;
	}
	.telem-line {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.75rem;
	}
	.telem-line dt {
		font-size: 0.62rem;
		letter-spacing: 0.12em;
		opacity: 0.7;
	}
	.telem-line dd {
		margin: 0;
		font-size: 0.85rem;
		color: var(--accent);
		text-align: right;
	}
	.telem-line dd.streak {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		color: inherit;
	}
	.fire {
		width: 18px;
		height: 18px;
		image-rendering: pixelated; /* keep the pixel art crisp when scaled */
	}
	.telem-err {
		margin: 0 0 1.1rem;
		font-size: 0.72rem;
		letter-spacing: 0.05em;
		color: #e6b23e;
		opacity: 0.85;
	}
	/* Language pie + legend */
	.lang-breakdown {
		display: flex;
		flex-wrap: wrap; /* pie / legend / projects wrap instead of spilling when cramped */
		align-items: center;
		gap: 1rem;
		margin: 0 0 1.1rem;
		padding: 0.75rem;
		border: var(--bw) solid var(--border);
	}
	.pie {
		flex-shrink: 0;
		width: 96px;
		height: 96px;
		border-radius: 50%;
		border: var(--bw) solid var(--border);
	}
	.legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.32rem;
		flex: 1 1 130px; /* prefer ~130px but allow shrinking so it never overflows */
		min-width: 0;
		font-size: 0.72rem;
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.swatch {
		flex-shrink: 0;
		width: 10px;
		height: 10px;
	}
	.legend .pct {
		margin-left: auto;
		opacity: 0.7;
	}
	.projects {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.32rem;
		font-size: 0.72rem;
	}
	.projects-head {
		font-size: 0.6rem;
		letter-spacing: 0.12em;
		opacity: 0.6;
		margin-bottom: 0.1rem;
	}
	.proj {
		display: flex;
		justify-content: space-between;
		gap: 0.6rem;
		color: inherit;
		text-decoration: none;
	}
	.proj .pname {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.proj .ptime {
		flex-shrink: 0;
		opacity: 0.7;
	}
	.proj:hover {
		color: var(--accent);
	}
	.proj:hover .pname {
		text-decoration: underline;
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
		transition: border-color 0.15s ease;
	}
	.slot:hover {
		border-color: var(--accent);
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
			/* minmax(0,…) lets the column shrink below its content's min width so
			   nowrap children (e.g. the XP bar) clip rather than overflow. */
			grid-template-columns: minmax(0, 1fr);
		}
		/* Stack the portrait above the stats so each gets the full panel width —
		   side by side they're too narrow and the tabs/stats spill over the edge. */
		.stage {
			order: -1;
			flex-direction: column;
		}
		.model-half {
			border-right: none;
			border-bottom: var(--bw) solid var(--border);
		}
		/* Let the tabs + email wrap instead of overflowing. */
		.tabs-head {
			flex-wrap: wrap;
			gap: 0.25rem 0.75rem;
		}
		.stats-email {
			word-break: break-all;
		}
	}

	@media (max-width: 700px) {
		.screen {
			padding: 1rem 1rem 7rem;
		}
		.topbar h1 {
			font-size: 1.1rem;
		}
		.section-head {
			margin: 1.75rem 0;
			gap: 0.75rem;
		}
		.section-head h2 {
			font-size: 0.85rem;
		}
		.mission-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Phones: stack the rows that assume a wide panel so nothing overflows. */
	@media (max-width: 560px) {
		/* XP bar gets its own full-width line under the level badge + location. */
		.stat-row {
			flex-wrap: wrap;
		}
		.location {
			order: 1;
		}
		.xp-bar {
			order: 2;
			flex-basis: 100%;
		}
		/* Pie + legend share a row; the projects list drops below, full width. */
		.lang-breakdown {
			flex-wrap: wrap;
			gap: 0.75rem 1rem;
		}
		.projects {
			flex-basis: 100%;
		}
		/* Song list drops back to a single column when the panel gets narrow. */
		.song-list {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
