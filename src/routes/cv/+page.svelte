<script lang="ts">
	import Seo from '$lib/Seo.svelte';
	import { profile } from '$lib/content';

	const contacts = [
		{ label: 'euans.life', href: 'https://www.euans.life' },
		{ label: profile.email, href: `mailto:${profile.email}` },
		...profile.socials.map((s) => ({ label: s.name, href: s.url }))
	];
</script>

<Seo
	title="Euan Ripper — CV"
	description="Euan Ripper's CV: Hack Club fellow, programme lead and web developer, now studying Mechatronics and Robotics at Loughborough."
	path="/cv"
	type="profile"
/>

<main class="screen">
	<a class="back" href="/">‹ BACK TO HOME</a>

	<header class="head">
		<h1>Euan Ripper</h1>
		<p class="tagline">Engineer · Programme lead &amp; web developer @ Hack Club</p>
		<ul class="contacts">
			{#each contacts as c}
				<li><a href={c.href}>{c.label}</a></li>
			{/each}
		</ul>
	</header>

	<p class="summary">
		Robotics and mechatronics student at Loughborough, working as a web developer and event
		organiser for Hack Club. I build platforms and run programmes that have rewarded thousands of
		teenagers for learning technical skills. I grew up on a sustainable farm in rural Devon and care
		most about energy resilience and sustainability.
	</p>

	<section class="panel">
		<h2>Experience</h2>

		<article class="role">
			<div class="role-head">
				<h3>Hack Club — Programme lead &amp; web developer</h3>
				<span class="meta">United States · 2024 – present</span>
			</div>
			<ul>
				<li>Selected onto a $50,000 fellowship after two interviews and a portfolio review; one of a small hand-picked group running Hack Club's funding programmes from its US headquarters. Deferred a place at Loughborough to take it.</li>
				<li>Led communications for Summer of Making, a global programme run with GitHub that shipped over 5,000 physical prizes to teenagers who built technical projects.</li>
				<li>Designed and built Beest, a full-stack web platform, from scratch: more than 4,000 verified students built projects, received feedback and earned prizes. Modelled a Strandbeest linkage in CAD and flew the top 30 builders to the Netherlands to meet Theo Jansen. One of Hack Club's first events in Europe; Net Promoter Score of 94.</li>
				<li>Co-created a Los Angeles hackathon with the Open Sauce team, Michael Reeves, William Osman and eight other YouTubers (combined audience around 25 million).</li>
				<li>Ran programmes that generated over 10,000 hours of independently verified student work; managed $100k+ budgets, logistics, event safety and deadlines to thousands of users.</li>
				<li>Handled a responsible security disclosure end to end: after a researcher reported a bug exposing user emails, I confirmed it, took the platform offline, patched it and rewarded the reporter, then searched the logs, emailed all 25 possibly affected users, trained the developer and open-sourced the platform.</li>
			</ul>
		</article>

		<article class="role">
			<div class="role-head">
				<h3>North Devon robotics club — Founder &amp; team lead</h3>
				<span class="meta">Devon · from age 16</span>
			</div>
			<ul>
				<li>Taught myself the engineering, then taught my members, growing the club from zero to 15 regular participants.</li>
				<li>Led the team to win the North Devon Robotics Challenge 2024 against far better-funded private schools. Credited as team lead in an <a href="https://engx.theiet.org/b/blogs/posts/north-devon-robotics-challenge-2024">IET article</a>.</li>
			</ul>
		</article>
	</section>

	<section class="panel">
		<h2>Education</h2>
		<article class="role">
			<div class="role-head">
				<h3>Loughborough University</h3>
				<span class="meta">Mechatronics, robotics &amp; control engineering</span>
			</div>
		</article>
		<article class="role">
			<div class="role-head">
				<h3>A-Levels</h3>
				<span class="meta">perfect score in programming</span>
			</div>
		</article>
	</section>

	<section class="panel">
		<h2>Leadership &amp; teamwork</h2>
		<article class="role">
			<div class="role-head">
				<h3>Ten Tors 2025 — Team leader</h3>
				<span class="meta">Dartmoor · May 2025</span>
			</div>
			<ul>
				<li>Led a team of six from QE School Crediton through the 55-mile endurance challenge, completing it in 33 hours despite record dropouts from heat stroke. Each member carried around 20kg to be self-sufficient for the weekend.</li>
			</ul>
		</article>
	</section>

	<section class="panel">
		<h2>Interests</h2>
		<ul class="interests">
			<li>Challenge-driven hobbies: unicycling (started at 16), ultramarathons (first 50k finished in eight hours, at 17), learning to rollerblade at 19.</li>
			<li>Building in my spare time: designed and built my own walking Strandbeest, currently hacking a cheap thermal printer to print live photos from a Pi Camera.</li>
		</ul>
	</section>

	<p class="print-hint">Tip: use your browser's print-to-PDF for a clean copy.</p>
</main>

<style>
	.screen {
		min-height: 100vh;
		box-sizing: border-box;
		max-width: 820px;
		margin: 0 auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		font-family: 'Departure Mono', ui-monospace, monospace;
		line-height: 1.6;
	}

	a {
		color: var(--accent);
	}

	.back {
		text-decoration: none;
		font-size: 0.8rem;
		color: inherit;
	}

	.head h1 {
		margin: 0;
		font-size: 2.2rem;
	}

	.tagline {
		margin: 0.4rem 0 0;
		color: var(--text);
		opacity: 0.85;
	}

	.contacts {
		list-style: none;
		margin: 0.75rem 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1rem;
		font-size: 0.85rem;
	}

	.summary {
		margin: 0;
		font-size: 1rem;
	}

	.panel {
		border: var(--bw) solid var(--border);
		background: var(--panel);
		box-shadow: var(--shadow);
		padding: 1.25rem 1.5rem;
	}

	h2 {
		margin: 0 0 1rem;
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--accent);
		border-bottom: var(--bw) solid var(--border);
		padding-bottom: 0.4rem;
	}

	.role {
		margin-bottom: 1.25rem;
	}
	.role:last-child {
		margin-bottom: 0;
	}

	.role-head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.2rem 1rem;
	}

	h3 {
		margin: 0;
		font-size: 0.95rem;
	}

	.meta {
		font-size: 0.8rem;
		opacity: 0.7;
	}

	ul {
		margin: 0.5rem 0 0;
		padding-left: 1.1rem;
	}

	li {
		margin-bottom: 0.4rem;
		font-size: 0.9rem;
	}

	.interests {
		margin-top: 0;
	}

	.print-hint {
		font-size: 0.75rem;
		opacity: 0.6;
		margin: 0;
	}

	/* Printed / saved-to-PDF: drop the dark theme for ink-friendly black on white. */
	@media print {
		.screen {
			color: #000;
		}
		a {
			color: #000;
		}
		.panel {
			border: 1px solid #000;
			background: #fff;
			box-shadow: none;
		}
		h2 {
			color: #000;
			border-bottom-color: #000;
		}
		.back,
		.print-hint {
			display: none;
		}
	}
</style>
