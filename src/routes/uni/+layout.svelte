<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="uni">
	<a class="homebar" href="/uni">euan <span>/ uni</span></a>
	{@render children()}
</div>

<style>
	:global(.uni) {
		--paper: #f7f4ee;
		--card: #fffdf8;
		--ink: #201d18;
		--muted: #6a645a;
		--line: #e2dccf;
		--accent: #0e6b63;
		--accent2: #b5631f;
		--flag: #9a3b2e;
		--good: #2f6d3b;
		--book: #5a4a9e;
		--shadow: 0 1px 2px rgba(40, 34, 24, 0.06), 0 6px 18px rgba(40, 34, 24, 0.05);
		background: var(--paper);
		color: var(--ink);
		font-family: 'Newsreader', Georgia, serif;
		font-size: 18px;
		line-height: 1.62;
		min-height: 100vh;
		-webkit-font-smoothing: antialiased;
	}
	.homebar {
		display: block;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: var(--accent);
		text-decoration: none;
		padding: 14px 24px;
		border-bottom: 1px solid var(--line);
		position: sticky;
		top: 0;
		background: rgba(247, 244, 238, 0.9);
		backdrop-filter: blur(6px);
		z-index: 20;
	}
	.homebar span {
		color: var(--muted);
		font-weight: 500;
	}

	/* ---- shared study-notes component styles (used by every module page) ---- */
	:global(.uni .m-wrap) { max-width: 820px; margin: 0 auto; padding: 44px 24px 120px; }
	:global(.uni .m-kicker) { font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); }
	:global(.uni .m-wrap h1) { font-size: 38px; line-height: 1.1; margin: 0.25em 0 0.3em; font-weight: 600; letter-spacing: -0.01em; }
	:global(.uni .lede) { font-size: 19px; color: #4a453c; margin: 0 0 22px; }
	:global(.uni .toc) { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 20px; font-family: 'Inter', sans-serif; font-size: 13px; }
	:global(.uni .toc a) { text-decoration: none; color: var(--muted); background: var(--card); border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px; }
	:global(.uni .toc a:hover) { color: var(--ink); border-color: var(--accent); }
	:global(.uni section.lesson) { margin-top: 56px; padding-top: 26px; border-top: 2px solid var(--ink); scroll-margin-top: 60px; }
	:global(.uni .lesson-h) { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent2); margin: 0 0 4px; }
	:global(.uni .lesson-title) { font-size: 28px; font-weight: 600; margin: 0.1em 0; letter-spacing: -0.01em; }
	:global(.uni .lesson-date) { font-family: 'Inter', sans-serif; font-size: 12.5px; color: var(--muted); font-weight: 500; }
	:global(.uni .m-wrap h3) { font-family: 'Inter', sans-serif; font-size: 19px; font-weight: 600; margin: 34px 0 10px; }
	:global(.uni .m-wrap h4) { font-family: 'Inter', sans-serif; font-size: 15.5px; font-weight: 600; margin: 22px 0 6px; color: #3a362e; }
	:global(.uni .m-wrap p) { margin: 0 0 14px; }
	:global(.uni .muted) { color: var(--muted); }
	:global(.uni .formula) { background: #fbfaf5; border: 1px solid var(--line); border-radius: 12px; padding: 14px 20px; margin: 18px 0; font-family: 'JetBrains Mono', monospace; font-size: 16px; text-align: center; color: #2f2a22; }
	:global(.uni .callout) { border-radius: 12px; padding: 14px 18px; margin: 18px 0; font-size: 16.5px; font-family: 'Inter', sans-serif; line-height: 1.5; }
	:global(.uni .callout .lab) { font-weight: 700; font-size: 11.5px; letter-spacing: 0.09em; text-transform: uppercase; display: block; margin-bottom: 4px; }
	:global(.uni .c-book) { background: #fdf3ec; border: 1px solid #f0d9c7; }
	:global(.uni .c-book .lab) { color: var(--accent2); }
	:global(.uni .c-trap) { background: #fcf0ee; border: 1px solid #f1cfc9; }
	:global(.uni .c-trap .lab) { color: var(--flag); }
	:global(.uni .c-intuit) { background: #eef5f1; border: 1px solid #cfe4d9; }
	:global(.uni .c-intuit .lab) { color: var(--good); }
	:global(.uni .c-text) { background: #f2f0fa; border: 1px solid #d9d4ef; }
	:global(.uni .c-text .lab) { color: var(--book); }
	:global(.uni .cite) { font-family: 'Inter', sans-serif; font-size: 11.5px; font-weight: 600; color: var(--book); background: #e7e2f6; border: 1px solid #d3ccec; border-radius: 6px; padding: 1px 7px; white-space: nowrap; }
	:global(.uni .worked) { background: #fffdf8; border: 1px solid var(--line); border-radius: 16px; padding: 4px 24px 20px; margin: 26px 0; box-shadow: var(--shadow); }
	:global(.uni .worked .tag) { display: inline-block; font-family: 'Inter', sans-serif; font-size: 11.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #fff; background: var(--accent); padding: 4px 11px; border-radius: 0 0 9px 9px; margin-left: -24px; margin-bottom: 6px; }
	:global(.uni .step) { display: grid; grid-template-columns: 28px 1fr; gap: 13px; margin: 13px 0; align-items: start; }
	:global(.uni .step .n) { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 13px; color: #fff; background: var(--accent2); width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: 2px; }
	:global(.uni .ans) { background: #eef5f1; border: 1px solid #cfe4d9; border-radius: 10px; padding: 10px 16px; font-family: 'Inter', sans-serif; font-size: 16px; margin-top: 8px; }
	:global(.uni .ans b) { color: var(--good); }
	:global(.uni figure) { margin: 24px 0; text-align: center; }
	:global(.uni figure svg) { max-width: 100%; height: auto; background: var(--card); border: 1px solid var(--line); border-radius: 14px; box-shadow: var(--shadow); }
	:global(.uni figcaption) { font-family: 'Inter', sans-serif; font-size: 13px; color: var(--muted); margin-top: 9px; max-width: 60ch; margin-left: auto; margin-right: auto; }
	:global(.uni .figtag) { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent2); display: block; margin-bottom: 2px; }
	:global(.uni table.ref) { width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif; font-size: 14px; margin: 16px 0; }
	:global(.uni table.ref th), :global(.uni table.ref td) { border: 1px solid var(--line); padding: 9px 12px; text-align: left; vertical-align: middle; }
	:global(.uni table.ref th) { background: #efe9dd; font-weight: 600; font-size: 12.5px; }
	:global(.uni .two) { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
	:global(.uni .card-t) { background: var(--card); border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: 12px; padding: 16px 18px; }
	@media (max-width: 680px) { :global(.uni .two) { grid-template-columns: 1fr; } }
	:global(.uni .svgtext) { font-family: 'Inter', sans-serif; }
</style>
