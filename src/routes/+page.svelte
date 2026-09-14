<script lang="ts">
	// main page type shit
	import { flushSync, onMount } from 'svelte';
	import { portraitCols, portraitRows, portraitChars, portraitColors } from '$lib/portrait-ascii';
	import DitherButterflies from '$lib/DitherButterflies.svelte';
	import Seo from '$lib/Seo.svelte';
	import { funFacts, songs, inventory, story as storyParas, missions, sidequests } from '$lib/content';
	import { HOME_TITLE, HOME_DESCRIPTION, homeJsonLd } from '$lib/seo';
	import ArrowEditor from '$lib/ArrowEditor.svelte';
	import { TRAIL_PATH, measureTrail, sampleTrail, trailFinish, trailHead, type Pt, type TrailFrame } from '$lib/scroll-trail';

	let { editArrow = false }: { editArrow?: boolean } = $props(); // true on /arrow-editor

	// The email icon opens a draft with a friendly subject and message already filled in.
	const mailHref = `mailto:euanripper2@gmail.com?subject=${encodeURIComponent('wow, you have such a cool site!')}&body=${encodeURIComponent("I couldn't resist reaching out to say so!")}`;

	// Decode the portrait's base64 RGB blob to bytes, lazily.
	function decodeRGB(b64: string): Uint8Array {
		const bin = atob(b64);
		const buf = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
		return buf;
	}
	let euanRGB: Uint8Array | null = null;


	// Paint the ASCII portrait onto a canvas: the colour selfie on a near-black ground,
	// each cell a dimmed fill behind a brighter glyph. The same in both themes. CSS
	// scales it to fit.
	const FONT = 12;
	const CW = FONT * 0.6; // monospace advance
	const LH = FONT; // line height
	let asciiCanvas = $state<HTMLCanvasElement | null>(null);
	function drawAscii() {
		const cv = asciiCanvas;
		if (!cv) return;
		const ctx = cv.getContext('2d');
		if (!ctx) return;
		const rgb = (euanRGB ??= decodeRGB(portraitColors));
		cv.width = portraitCols * CW;
		cv.height = portraitRows * LH;
		ctx.fillStyle = '#070608';
		ctx.fillRect(0, 0, cv.width, cv.height);
		ctx.font = `${FONT}px 'Departure Mono', ui-monospace, monospace`;
		ctx.textBaseline = 'top';
		const BG = 0.5;
		let p = 0;
		for (let ry = 0; ry < portraitRows; ry++) {
			// +ry skips the row's trailing newline in the flat chars string.
			const base = ry * (portraitCols + 1);
			for (let rx = 0; rx < portraitCols; rx++, p++) {
				const ch = portraitChars[base + rx];
				const r = rgb[p * 3], g = rgb[p * 3 + 1], b = rgb[p * 3 + 2];
				ctx.fillStyle = `rgb(${r * BG},${g * BG},${b * BG})`;
				ctx.fillRect(rx * CW, ry * LH, CW + 1, LH + 1);
				if (ch === ' ') continue;
				ctx.fillStyle = `rgb(${r},${g},${b})`;
				ctx.fillText(ch, rx * CW, ry * LH);
			}
		}
	}
	$effect(() => {
		if (asciiCanvas) drawAscii();
	});

	// Theme: dark by default, light if the visitor picked it (saved, and applied by
	// app.html before first paint).
	// meh, i dont like light mode
	//**
	
	let dark = $state(true);
	onMount(() => {
		dark = document.body.classList.contains('dark');
	});
	function toggleTheme() {
		// Decide the new theme up front: with a view transition, swap() runs later (after the
		// "before" snapshot), so `dark` must not be read for saving until then.
		const nextDark = !dark;
		const swap = () => {
			dark = nextDark;
			document.body.classList.toggle('dark', nextDark);
			flushSync(); // apply it (and redraw the dither) now, for the crossfade's "after" snapshot
		};
		// Crossfade from the old look to the new where view transitions are supported
		// (timing in app.css); otherwise, or with reduced motion, switch instantly.
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (document.startViewTransition && !reduceMotion) document.startViewTransition(swap);
		else swap();
		try {
			if (nextDark) localStorage.removeItem('theme');
			else localStorage.setItem('theme', 'light');
		} catch {
			// storage blocked: the choice just won't be remembered
		}
	}

	// The background keeps its dither off these (plus a margin).
	let heroEl = $state<HTMLElement>();
	let mainEl = $state<HTMLElement>();
	// Butterflies can land on the portrait's top edge.
	let portraitEl = $state<HTMLElement>();

	// The page opens on a blank ground while the background's dither closes in from the
	// edges; the content fades in once that's done and the fonts are ready (or have had a
	// moment longer), so it never flashes in unstyled.
	let revealed = $state(false);
	async function showContent() {
		await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
		revealed = true;
	}

	// Phones (the CSS's 700px breakpoint) get just the butterflies: no dithered plasma,
	// and so no intro waiting for it to close in.
	let phone = $state(false);
	onMount(() => {
		const mq = window.matchMedia('(max-width: 700px)');
		const update = () => (phone = mq.matches);
		update();
		mq.addEventListener('change', update);
		return () => mq.removeEventListener('change', update);
	});

 
	 
	// ── Synthesised audio: menu SFX ──
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
	// Shared loudness for the SFX and song previews.
	const AUDIO_VOL = 0.25;
	// Soft two-note rise played when a section first scrolls into view.
	const discoverSound = () => {
		voice(523.25, 0.09, AUDIO_VOL * 0.55, 'triangle');
		voice(783.99, 0.13, AUDIO_VOL * 0.55, 'triangle', 0.07);
	};

	onMount(() => {
		// Browsers keep audio suspended until a real gesture (hover doesn't count),
		// so prime the context on the first pointer/key press anywhere.
		const unlock = () => getCtx();
		window.addEventListener('pointerdown', unlock, { once: true });
		window.addEventListener('keydown', unlock, { once: true });
		return () => {
			window.removeEventListener('pointerdown', unlock);
			window.removeEventListener('keydown', unlock);
		};
	});

	// ── Personality recommendations ──────────────────────────────────────────
	// Favorite songs (from $lib/content) link to a Spotify search; visitors can suggest one back.
	const songSearch = (s: { title: string; artist: string }) =>
		`https://open.spotify.com/search/${encodeURIComponent(`${s.title} ${s.artist}`)}`;

	// Each song has a small play/pause button for its 30s preview clip. Clip URLs are
	// looked up via /api/preview (iTunes previews) and cached per song; one shared
	// <audio> element plays them, fading in and out.
	const PREVIEW_FADE_MS = 350;
	let previewEl = $state<HTMLAudioElement | null>(null);
	let previewing = $state<string | null>(null); // title of the song playing (or starting)
	let noPreview = $state<string[]>([]); // songs that turned out to have no clip
	let previewFailed = $state<string | null>(null); // song whose clip couldn't be played (tap to retry)
	const previewUrls = new Map<string, Promise<string | null | undefined>>();
	const resolvedUrls = new Map<string, string | null>(); // settled lookups, to start within the tap
	let previewToken = 0; // bumps on every play/pause so stale lookups bail
	let fadeRaf = 0;

	// Resolves to the clip URL, null when there's genuinely no clip, or undefined when the
	// lookup itself failed (forgotten, so the next tap tries again).
	const previewUrl = (s: { title: string; artist: string }) => {
		let p = previewUrls.get(s.title);
		if (!p) {
			const q = new URLSearchParams({ title: s.title, artist: s.artist });
			p = fetch(`/api/preview?${q}`)
				.then((r) => (r.ok ? r.json() : Promise.reject(new Error(`preview lookup HTTP ${r.status}`))))
				.then((d: { url: string | null }) => {
					resolvedUrls.set(s.title, d.url);
					return d.url;
				})
				.catch((err) => {
					console.warn('[preview] lookup failed:', s.title, err);
					previewUrls.delete(s.title);
					return undefined;
				});
			previewUrls.set(s.title, p);
		}
		return p;
	};

	// Look the clips up once the list is nearly on screen, so a tap can start one at once.
	function prefetchPreviews(node: HTMLElement) {
		const io = new IntersectionObserver(
			(entries) => {
				if (!entries.some((e) => e.isIntersecting)) return;
				io.disconnect();
				for (const s of songs) previewUrl(s);
			},
			{ rootMargin: '300px 0px' }
		);
		io.observe(node);
		return { destroy: () => io.disconnect() };
	}

	function fadeTo(target: number, done?: () => void) {
		const el = previewEl;
		if (!el) return;
		cancelAnimationFrame(fadeRaf);
		const from = el.volume;
		const start = performance.now();
		const step = (now: number) => {
			const t = Math.min(1, (now - start) / PREVIEW_FADE_MS);
			el.volume = from + (target - from) * t;
			if (t < 1) fadeRaf = requestAnimationFrame(step);
			else done?.();
		};
		fadeRaf = requestAnimationFrame(step);
	}

	// Show that a clip couldn't play (rather than silently flipping back), so a tap can retry.
	function failPreview(title: string) {
		previewing = null;
		previewFailed = title;
	}

	function togglePreview(s: { title: string; artist: string; start?: number }) {
		if (previewing === s.title) stopPreview();
		else playPreview(s);
	}

	async function playPreview(s: { title: string; artist: string; start?: number }) {
		const el = previewEl;
		if (!el) return;
		const token = ++previewToken;
		previewing = s.title; // show the pause button straight away
		previewFailed = null;
		// Phones only play audio started from the tap itself, so when the clip is already
		// known, start it before anything is awaited; otherwise look it up first.
		const url = resolvedUrls.has(s.title) ? (resolvedUrls.get(s.title) ?? null) : await previewUrl(s);
		if (token !== previewToken) return;
		if (url === null) {
			previewing = null;
			noPreview = [...noPreview, s.title];
			return;
		}
		if (url === undefined) return failPreview(s.title);
		// Skip the intro a little so the clip starts closer to the good bit. The same song
		// again resumes where it was paused (or starts over if it had finished).
		const from = s.start ?? 5;
		const src = `${url}#t=${from}`;
		if (el.src !== src) el.src = src;
		else if (el.ended) el.currentTime = from;
		cancelAnimationFrame(fadeRaf);
		el.volume = 0;
		try {
			await el.play();
		} catch (err) {
			console.warn('[preview] could not play:', s.title, err);
			if (token === previewToken) failPreview(s.title); // blocked, or the clip failed to load
			return;
		}
		if (token !== previewToken) return;
		fadeTo(AUDIO_VOL * 2);
	}

	function stopPreview() {
		++previewToken;
		previewing = null;
		const el = previewEl;
		if (!el || el.paused) return;
		const token = previewToken;
		fadeTo(0, () => token === previewToken && el.pause());
	}

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

	// ── Scroll trail: an arrow drawn from under the hero into the fun facts ──
	// The tail is pinned under the hero text. At the top it's a short straight arrow; as
	// the page scrolls, the head travels along the path until it lands. The path's shape
	// is TRAIL_PATH in $lib/scroll-trail, designed with the editor at /arrow-editor.
	let heroBodyEl = $state<HTMLElement>();
	let factsTextEl = $state<HTMLElement>();
	let trail = $state<{ d: string; hx: number; hy: number; angle: number; w: number; h: number } | null>(null);

	onMount(() => {
		if (editArrow) return; // the editor draws its own arrow
		let frame: TrailFrame | null = null;
		let pts: Pt[] = []; // path samples, evenly spaced along it
		let finish = 1; // scroll distance over which the head travels the path
		let dirty = true;
		let raf = 0;

		const draw = () => {
			if (dirty) {
				dirty = false;
				frame = heroBodyEl && factsTextEl ? measureTrail(heroBodyEl, factsTextEl) : null;
				pts = frame ? sampleTrail(frame, TRAIL_PATH) : [];
				finish = frame ? trailFinish(frame, pts) : 1;
			}
			if (!frame || pts.length < 2) {
				trail = null;
				return;
			}
			const head = trailHead(pts, window.scrollY, finish);
			trail = { ...head, w: frame.w, h: Math.max(...pts.map((p) => p.y)) + 40 };
		};

		const schedule = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(draw);
		};
		const relayout = () => {
			dirty = true;
			schedule();
		};
		const ro = new ResizeObserver(relayout);
		ro.observe(document.body);
		window.addEventListener('scroll', schedule, { passive: true });
		window.addEventListener('resize', relayout); // viewport height feeds `finish`
		document.fonts.ready.then(relayout);
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			window.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', relayout);
		};
	});

	// Story paragraphs (from $lib/content), rendered with animated plane dividers between them.
	// Both divider planes cross at the same pace — the reading time of the first
	// (top) paragraph at an average adult reading speed.
	const STORY_WPM = 230;
	const readMs = (text: string) => (text.trim().split(/\s+/).length / STORY_WPM) * 60000;

	// Hackatime stuff, maybe replace?
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

</script>

<svelte:head>
	<!-- Without scripts there's no intro to wait for: show the content (and underlines) as-is. -->
	<noscript>
		<style>
			.veiled { opacity: 1 !important; }
			.hero-line::after { transform: none !important; }
		</style>
	</noscript>
</svelte:head>

<Seo title={HOME_TITLE} description={HOME_DESCRIPTION} path="/" type="profile" jsonLd={homeJsonLd()} />

<!-- Dithered plasma background with butterflies drawn into it. It fades to the
     plain ground around the hero block and the main content column. -->
<DitherButterflies
	{dark}
	plasma={!phone}
	opacity={dark ? 0.08 : 0.2}
	count={9}
	clearEls={[heroEl, mainEl]}
	clearPad={40}
	clearRadius={100}
	clearFloor={dark ? 0.15 : 0.03}
	perchEls={phone ? [] : [portraitEl]}
	intro={phone ? 0 : 3000}
	onready={showContent}
	fade={220}
/>

<!-- ── Hero: the first screen; everything else is a scroll away. Sits outside
     <main> so the background can close in around it. ── -->
<section class="hero" class:veiled={!revealed} class:shown={revealed}>
	<div class="corner-toggles">
		<button
			class="corner-toggle"
			type="button"
			onclick={toggleTheme}
			aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
			title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
		>
			{#if dark}
				<!-- sun: switch to light -->
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
					<circle cx="12" cy="12" r="4" />
					<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
				</svg>
			{:else}
				<!-- moon: switch to dark -->
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">
					<path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7z" />
				</svg>
			{/if}
		</button>
	</div>
	<div class="hero-inner" bind:this={heroEl}>
		<div class="hero-heading">
			<p class="hero-title"><span class="hero-line">Welcome</span><br /><span class="hero-line">to my space</span></p>
			<h1 class="hero-name">Euan Ripper</h1>
		</div>
		<div class="model" bind:this={portraitEl}>
			<canvas
				class="model-ascii"
				bind:this={asciiCanvas}
				aria-label="ASCII portrait of Euan Ripper"
			></canvas>
			<span class="photo-credit">photo credit: reem &lt;3</span>
		</div>
		<div class="hero-body" bind:this={heroBodyEl}>
			<p class="hero-sub">
				I'm an outdoorsy nerd, I like circus arts, robotics, and organising events for creatives
			</p>
			<div class="socials hero-socials">
				<a href="https://github.com/edRipper" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub — my code & projects">
					<img class="mono" src="https://cdn.simpleicons.org/github" alt="GitHub" />
				</a>
				<a href="https://www.linkedin.com/in/euan-ripper-ab876528b/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn — my work & experience">
					<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" alt="LinkedIn" />
				</a>
				<a href="https://www.instagram.com/euanripper/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram — my photos & life">
					<img src="https://cdn.simpleicons.org/instagram/833AB4" alt="Instagram" />
				</a>
				<a href={mailHref} aria-label="Email" title="Email — say hi">
					<svg class="mail" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
					</svg>
				</a>
			</div>
		</div>
	</div>
</section>

<!-- Scroll trail from the hero down to the fun facts (see the trail logic above). -->
{#if editArrow}
	<ArrowEditor {heroBodyEl} {factsTextEl} />
{:else if trail}
	<svg
		class="scroll-trail"
		class:veiled={!revealed}
		class:shown={revealed}
		width={trail.w}
		height={trail.h}
		aria-hidden="true"
	>
		<path class="trail-line" d={trail.d} />
		<path
			class="trail-head"
			d="M-13 -15 L0 0 L13 -15"
			transform="translate({trail.hx} {trail.hy}) rotate({trail.angle})"
		/>
	</svg>
{/if}

<main class="screen" class:veiled={!revealed} class:shown={revealed} bind:this={mainEl}>
	<!-- Phones only: marks where the first screen ends and the rest begins. -->
	<hr class="fold-divider" />
	<div class="class-tag">
		<div>
			<h2>Fun facts</h2>
			<p bind:this={factsTextEl}>{funFacts}</p>
		</div>
	</div>

	<!-- ── Personality ── -->
	<section class="panel personality">
		<h3 class="sub rec-head">My favorite songs:</h3>
		<ol class="song-list" use:prefetchPreviews>
			{#each songs as s (s.title)}
				{@const playing = previewing === s.title}
				{@const unavailable = noPreview.includes(s.title)}
				<li class:playing>
					<button
						class="play"
						type="button"
						onclick={() => togglePreview(s)}
						disabled={unavailable}
						aria-pressed={playing}
						aria-label="Preview {s.title} by {s.artist}"
						class:failed={previewFailed === s.title}
						title={unavailable
							? 'No preview available'
							: previewFailed === s.title
								? "Couldn't play the preview, tap to try again"
								: playing
									? 'Pause'
									: 'Play a preview'}
					>
						{#if playing}
							<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="3" height="9" /><rect x="7" y="1.5" width="3" height="9" /></svg>
						{:else}
							<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" /></svg>
						{/if}
					</button>
					<a href={songSearch(s)} target="_blank" rel="noopener noreferrer">
						{s.title} · {s.artist}
					</a>
					{#if playing}
						<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>
					{/if}
				</li>
			{/each}
		</ol>
		{#if previewFailed}
			<p class="preview-err" role="status">couldn’t play that preview, tap ▶ to try again</p>
		{/if}
		<audio
			bind:this={previewEl}
			preload="none"
			onended={() => (previewing = null)}
			onerror={() => previewing && failPreview(previewing)}
		></audio>
		{#if suggestState === 'done'}
			<p class="suggest-done">
				thank you &lt;3, I will give it a listen!
				<button type="button" class="suggest-again" onclick={() => (suggestState = 'idle')}>
					suggest another
				</button>
			</p>
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
	</section>

	<!-- ── Stats ── -->
	<div class="section-head" use:reveal={{ sound: true }}>
		<span class="line"></span>
		<span class="arrow-stream" aria-hidden="true"></span>
		<h2>
			Coding stats from <a href="https://hackatime.hackclub.com" target="_blank" rel="noopener noreferrer">hackatime</a>
		</h2>
		<span class="arrow-stream" aria-hidden="true"></span>
		<span class="line"></span>
	</div>
	<section class="panel stats">
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
			<p class="telem-err">⚠ Hackatime is down or pushed breaking changes {codingErr}</p>
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
	</section>

	<!-- ── Story ── -->
	<div class="section-head" use:reveal={{ sound: true }}>
		<span class="line"></span>
		<span class="arrow-stream" aria-hidden="true"></span>
		<h2>Story: The lore so far</h2>
		<span class="arrow-stream" aria-hidden="true"></span>
		<span class="line"></span>
	</div>
	<section class="panel story">
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
	</section>


	<!-- ── Missions (projects) ── -->
	<div class="section-head" use:reveal={{ sound: true }}>
		<span class="line"></span>
		<span class="arrow-stream" aria-hidden="true"></span>
		<h2>Missions</h2>
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
		<h2>Sidequests: Fun projects on the side</h2>
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

	<footer class="contact">
		the best way to reach me is to shoot me an email!
		<a href="mailto:euanripper2@gmail.com">euanripper2@gmail.com</a>
	</footer>
</main>

<style>
	:global(body) {
		/* Light: a retro handheld-screen palette, deep green-black ink on pale sage. */
		--bg: #e3e8d3;
		--panel: rgba(236, 240, 224, 0.88);
		--border: #8c977a;
		--bw: 2px;
		--text: #1b2417; /* ~15:1 on the ground */
		--accent: #256b2a; /* ~5.3:1, fine for small text */
		--warn: #8a4b12; /* burnt orange, ~5.5:1 */
		--shadow: 0 10px 30px rgba(27, 36, 23, 0.18);
		background: var(--bg);
		color: var(--text);
	}
	:global(body.dark) {
		--bg: #131318;
		--panel: rgba(30, 30, 38, 0.85);
		--border: #3a3a40;
		--text: #ece7da;
		--accent: #39d353; /* brighter green reads better on the dark ground */
		--warn: var(--warn);
		--shadow: 0 12px 34px rgba(0, 0, 0, 0.6);
	}

	.screen {
		position: relative;
		width: 100%;
		max-width: 1000px; /* matches the background's clear column */
		margin: 0 auto;
		min-height: 100vh;
		box-sizing: border-box;
		padding: 1.5rem 1.5rem 4rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		font-family: 'Departure Mono', ui-monospace, monospace;
	}

	/* Content stays hidden until the background's intro is done (see showContent()), then
	   fades in. The delayed animation is a fallback so it still appears if scripts never run. */
	.veiled {
		opacity: 0;
	}
	.shown {
		animation: fade-in 1.4s ease both;
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* First screen: welcome text + portrait, centred; the rest is below the fold. */
	.hero {
		position: relative;
		min-height: 100vh;
		min-height: 100svh;
		box-sizing: border-box;
		padding: 2rem 1.5rem 4rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Departure Mono', ui-monospace, monospace;
	}
	/* Title and portrait side by side, level; the intro text runs under both. */
	.hero-inner {
		width: 100%;
		max-width: 1240px; /* wider than the content column below, so the hero fills more of the screen */
		container-type: inline-size; /* lets the title size against this block */
		display: grid;
		/* Title column is never narrower than the title's longest word (up to 55%);
		   the portrait takes what's left, so it can't overlap the title. */
		grid-template-columns: fit-content(55%) minmax(0, 1fr);
		grid-template-areas:
			'title model'
			'body body';
		align-items: center;
		gap: 2.5rem 4rem;
	}
	.hero-body {
		grid-area: body;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.hero-heading {
		grid-area: title;
	}
	.hero-name {
		margin: 1.25rem 0 0;
		font-weight: normal; /* the page's h1, styled as the subtitle it sits under */
		font-size: clamp(1.1rem, 2vw, 1.6rem);
		letter-spacing: 0.08em;
	}
	.hero-title {
		margin: 0;
		font-family: 'OnlyTrue', 'Departure Mono', ui-monospace, monospace;
		font-weight: 1; /* as in hackclub/strands; stops faux-bold */
		text-transform: uppercase; /* OnlyTrue only has capitals */
		/* 7cqi keeps "TO MY SPACE" to about half the hero block even with large
		   browser text, so the portrait beside it never gets squeezed. */
		font-size: clamp(2.4rem, 6vw, min(5.6rem, 7cqi));
		line-height: 1.3; /* room between the lines for the underline */
		letter-spacing: 0.02em;
		white-space: nowrap; /* exactly two lines, split by the <br> */
	}
	/* Each title line has its own underline, drawn left to right, top line first, once the
	   text has faded in. */
	.hero-line {
		position: relative;
		display: inline-block;
	}
	.hero-line::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0.07em; /* grows downward, keeping the same gap under the letters */
		height: 0.09em;
		background: currentColor;
		transform: scaleX(0);
		transform-origin: left center;
	}
	.shown .hero-line::after {
		animation: draw-line 0.8s cubic-bezier(0.65, 0, 0.35, 1) forwards;
	}
	.shown .hero-line:nth-of-type(2)::after {
		animation-delay: 0.4s;
	}
	@keyframes draw-line {
		to {
			transform: scaleX(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.shown .hero-line::after {
			animation: none;
			transform: scaleX(1);
		}
	}
	.hero-sub {
		margin: 0;
		font-size: clamp(1rem, 1.6vw, 1.35rem);
		line-height: 1.6;
		opacity: 0.85;
		text-wrap: pretty;
	}
	/* Doubled class to beat the later .socials rule's margin-left: auto. */
	.socials.hero-socials {
		margin-left: 0;
		gap: 1rem;
	}
	.socials.hero-socials img,
	.socials.hero-socials svg {
		width: 32px;
		height: 32px;
	}
	.hero .model {
		grid-area: model;
		margin: 0;
		min-height: 0;
	}
	/* Arrow from under the hero to the fun facts; drawn in document coordinates. */
	.scroll-trail {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 0;
		overflow: visible;
		pointer-events: none;
		color: var(--text);
	}
	.trail-line,
	.trail-head {
		fill: none;
		stroke: currentColor;
		stroke-width: 6;
		stroke-linecap: square;
		stroke-linejoin: miter;
	}

	.panel {
		display: flex;
		flex-direction: column;
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
	/* Top-right switch for light/dark mode. */
	.corner-toggles {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 2;
		display: flex;
		gap: 0.5rem;
	}
	.corner-toggle {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		padding: 0;
		color: var(--text);
		background: var(--panel);
		border: var(--bw) solid var(--border);
	}
	.corner-toggle:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.corner-toggle svg {
		display: block;
		width: 18px;
		height: 18px;
	}
	/* Contact line at the foot of the page. */
	.contact {
		margin-top: 3rem;
		text-align: center;
		font-size: 0.85rem;
		line-height: 1.6;
	}
	.contact a {
		color: var(--accent);
		overflow-wrap: anywhere;
	}
	.fold-divider {
		display: none;
	}
	.class-tag {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-end;
		gap: 0.5rem 1.5rem;
	}
	.class-tag h2 {
		margin: 0 0 0.35rem;
		font-size: 0.95rem;
	}
	.class-tag p {
		margin: 0;
		max-width: 60ch;
		font-size: 0.8rem;
		line-height: 1.5;
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
	.socials {
		display: flex;
		gap: 0.75rem;
		margin-left: auto;
	}
	.socials img,
	.socials svg {
		width: 22px;
		height: 22px;
		display: block;
	}
	/* Force these brand marks to pure white on dark (brightness(0) flattens any
	   colour to black, invert(1) then makes it white) so none come out tinted. */
	:global(body.dark) .mono {
		filter: brightness(0) invert(1);
	}
	.socials .mail {
		color: var(--text); /* matches the white GitHub mark */
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
	.section-head h2 a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
	.section-head h2 a:hover {
		color: var(--accent);
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
		/* Match the page ground. Kept opaque so the card's text underneath stays
		   hidden when the image fades in. Adapts to theme. */
		background-color: var(--bg);
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
		border: var(--bw) solid var(--warn);
		color: var(--warn);
	}
	.badge.complete {
		border-color: var(--accent);
		color: var(--accent);
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
		background: var(--bg); /* mask the dashes directly under the plane */
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
	/* Small play/pause button for each song's preview clip. */
	.song-list .play {
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		width: 1.35rem;
		height: 1.35rem;
		padding: 0;
		color: #3ec500;
		background: transparent;
		border: var(--bw) solid var(--border);
	}
	:global(body:not(.dark)) .song-list .play {
		color: var(--accent); /* the bright green is too faint on the light ground */
	}
	.song-list .play svg {
		display: block;
		width: 0.6rem;
		height: 0.6rem;
		fill: currentColor;
	}
	.song-list .play:hover:not(:disabled),
	.song-list .playing .play {
		border-color: var(--accent);
		color: var(--accent);
	}
	.song-list .play:disabled {
		opacity: 0.35;
	}
	.song-list .play.failed {
		border-color: var(--warn);
		color: var(--warn);
	}
	.preview-err {
		margin: 0 0 0.6rem;
		font-size: 0.72rem;
		color: var(--warn);
	}
	.song-list a {
		color: inherit;
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.song-list a:hover,
	.song-list .playing a {
		color: var(--accent);
		text-decoration: underline;
	}
	/* Little equaliser beside a song while its preview plays. */
	.eq {
		flex: 0 0 auto;
		color: var(--accent);
		display: inline-flex;
		align-items: flex-end;
		gap: 1px;
		height: 0.8em;
	}
	.eq i {
		width: 2px;
		height: 100%;
		background: currentColor;
		transform-origin: bottom;
		animation: eq 0.8s ease-in-out infinite;
	}
	.eq i:nth-child(2) {
		animation-delay: -0.3s;
	}
	.eq i:nth-child(3) {
		animation-delay: -0.55s;
	}
	@keyframes eq {
		0%,
		100% {
			transform: scaleY(0.3);
		}
		50% {
			transform: scaleY(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.eq i {
			animation: none;
			transform: scaleY(0.7);
		}
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
		color: var(--warn);
	}
	.suggest-done {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.75rem;
		margin: 0;
		font-size: 0.8rem;
		color: var(--accent);
	}
	.suggest-again {
		padding: 0.3rem 0.7rem;
		font: inherit;
		color: var(--text);
		background: transparent;
		border: var(--bw) solid var(--border);
	}
	.suggest-again:hover {
		border-color: var(--accent);
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
		color: var(--warn);
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
	:global(body.dark) .chart img {
		filter: invert(1) hue-rotate(180deg);
	}
	/* Light: multiply drops the chart image's white ground into the page colour. */
	:global(body:not(.dark)) .chart img {
		mix-blend-mode: multiply;
	}

	@media (max-width: 1080px) {
		/* Room left of the fun facts for the scroll trail to turn and point in. */
		.class-tag {
			padding-left: 3rem;
		}
	}

	@media (max-width: 940px) {
		/* Hero: stack title, portrait, then the intro text. */
		.hero-inner {
			grid-template-columns: minmax(0, 1fr);
			grid-template-areas:
				'title'
				'model'
				'body';
			gap: 2rem;
		}
	}

	@media (max-width: 700px) {
		.screen {
			padding: 1rem 1rem 7rem;
		}
		/* Phones: a centred intro (no portrait) that fits on the first screen with room
		   around it for the butterflies. The title sizes off the screen width so its lines
		   never overflow. */
		.hero {
			padding: 1.25rem 1rem 2rem;
		}
		.hero-inner {
			grid-template-areas:
				'title'
				'body';
			gap: 1.1rem;
			text-align: center;
		}
		.hero-title {
			font-size: min(2.25rem, 9.5vw);
		}
		.hero-name {
			margin-top: 0.6rem;
			font-size: 1rem;
		}
		.hero .model {
			display: none;
		}
		.fold-divider {
			display: block;
			width: 100%;
			margin: 0 0 0.5rem;
			border: 0;
			border-top: 2px dashed var(--border);
		}
		.hero-body {
			align-items: center;
			gap: 0.9rem;
		}
		.hero-sub {
			font-size: 0.92rem;
			line-height: 1.5;
		}
		.socials.hero-socials {
			justify-content: center;
			gap: 0.85rem;
		}
		.socials.hero-socials img,
		.socials.hero-socials svg {
			width: 26px;
			height: 26px;
		}
		.class-tag {
			flex-direction: column;
			align-items: center;
			text-align: center;
			padding-left: 0; /* no scroll trail on phones, so no room needed for it */
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
