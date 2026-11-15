<script lang="ts">
	import RestitutionDrop from '$lib/uni/RestitutionDrop.svelte';
	import Sym from '$lib/uni/Sym.svelte';
	import LectureClip from '$lib/uni/LectureClip.svelte';
	// Panopto session for the 2 Nov helmet lecture (the 26 Oct one also covers it).
	const LEC_02NOV = '34889ee4-7117-4e2c-9f63-b4f6001a6d69';
</script>

<svelte:head><title>WSA070 Applied Engineering - study notes</title></svelte:head>

<main class="m-wrap">
	<p class="m-kicker">WSA070 &middot; Applied Engineering</p>
	<h1>Sports engineering: impact, materials &amp; design</h1>
	<p class="lede">
		Engineering principles applied to real kit - how a helmet soaks up a crash, why a bat has a sweet
		spot, and the trade-offs behind every design decision. From the lectures, with a coefficient-of-
		restitution demo you can slide.
	</p>

	<nav class="toc">
		<a href="#l1">1 &middot; impact absorption</a>
		<a href="#l2">2 &middot; restitution</a>
		<a href="#l3">3 &middot; the sweet spot</a>
		<a href="#l4">4 &middot; design trade-offs</a>
		<a href="#l5">5 &middot; testing &amp; standards</a>
	</nav>

	<!-- ===== LESSON 1 ===== -->
	<section class="lesson" id="l1">
		<div class="lesson-h">Lesson 1</div>
		<div class="lesson-title">Impact energy absorption: helmet design</div>
		<div class="lesson-date">02 November &middot; energy, foam, single vs multiple impact</div>
		<LectureClip id={LEC_02NOV} start={538} label="impact absorption" />

		<p>
			A helmet's job is to <b>slow the stop down</b>. The head arrives with kinetic energy; the helmet
			absorbs it over a few more milliseconds and a few more millimetres, which cuts the <b>peak
			acceleration</b> the brain feels. Spread the same force over more time and area and the dangerous
			spike disappears.
		</p>

		<div class="two">
			<div class="card-t"><h4 style="margin-top:0">single-impact</h4><p style="margin:0">Cycling helmets use <b>expanded polystyrene</b> foam that crushes once, absorbing energy through permanent plastic deformation. Great protection, then bin it.</p></div>
			<div class="card-t"><h4 style="margin-top:0">multiple-impact</h4><p style="margin:0">Lacrosse and American-football helmets use <b>elastic foams</b> and composite shells that spring back and survive repeated hits.</p></div>
		</div>

		<div class="callout c-intuit">
			<span class="lab">intuition &middot; the three knobs</span>
			Foam <b>density</b>, <b>thickness</b> and <b>geometry</b> set how the helmet manages the hit. Too
			soft and it bottoms out; too stiff and it passes the spike straight through. The shell's other job
			is to <b>spread</b> a sharp point load across the whole foam so no single spot takes it all.
		</div>

		<figure>
			<span class="figtag">figure 1.1 &middot; the PPE triangle</span>
			<svg viewBox="0 0 300 220" class="svgtext" aria-label="PPE trade-off triangle">
				<polygon points="150,30 40,190 260,190" fill="#eef5f1" stroke="#0e6b63" stroke-width="2" />
				<text x="150" y="22" font-size="13" fill="#0e6b63" font-weight="600" text-anchor="middle">safety</text>
				<text x="34" y="205" font-size="13" fill="#b5631f" font-weight="600" text-anchor="middle">comfort</text>
				<text x="262" y="205" font-size="13" fill="#9a3b2e" font-weight="600" text-anchor="middle">visibility</text>
				<text x="150" y="130" font-size="11.5" fill="#6a645a" text-anchor="middle">push one corner,</text>
				<text x="150" y="146" font-size="11.5" fill="#6a645a" text-anchor="middle">lose the others</text>
			</svg>
			<figcaption>The PPE triangle: safety, comfort and visibility pull against each other. A helmet nobody wears because it is hot or blocks their view protects nobody - comfort and fit are safety features too.</figcaption>
		</figure>
	</section>

	<!-- ===== LESSON 2 ===== -->
	<section class="lesson" id="l2">
		<div class="lesson-h">Lesson 2</div>
		<div class="lesson-title">Bat-ball impacts &amp; the coefficient of restitution</div>
		<div class="lesson-date">19 October &middot; momentum, energy loss, restitution</div>

		<p>
			When a bat meets a ball, momentum transfers and some energy is always lost. The <b>coefficient of
			restitution</b> e measures how bouncy the collision is - the ratio of separation speed to approach
			speed. e = 1 is a perfect, lossless bounce; e = 0 is completely dead.
		</p>
		<div class="formula"><Sym def="coefficient of restitution - how bouncy the collision is, 0 to 1">e</Sym> = (speed apart) / (speed together) &nbsp;&nbsp;|&nbsp;&nbsp; drop test: <Sym def="rebound height after the bounce">h&prime;</Sym> = e&sup2; <Sym def="original drop height">h</Sym></div>

		<div class="callout c-trap">
			<span class="lab">common trap &middot; no collision is perfectly elastic</span>
			Every impact model is a simplification. Real energy leaks away as <b>vibration, sound, heat and
			deformation</b>, so e &lt; 1 always. That lost energy is exactly what a helmet wants to maximise and
			a hurling ball wants to minimise.
		</div>

		<p>Drop a ball and slide e - the rebound height is e&sup2; times the drop, and the rest is lost:</p>
		<RestitutionDrop />
	</section>

	<!-- ===== LESSON 3 ===== -->
	<section class="lesson" id="l3">
		<div class="lesson-h">Lesson 3</div>
		<div class="lesson-title">The sweet spot</div>
		<div class="lesson-date">19 October &middot; why some hits feel clean and others sting</div>

		<p>
			The "sweet spot" is not a single point - it is an <b>area</b> where several good things line up, and
			it shifts with your grip and the equipment.
		</p>
		<table class="ref"><tbody>
			<tr><th>factor</th><th>what it is</th><th>why it matters</th></tr>
			<tr><td>centre of mass</td><td>the balance point of the bat</td><td>sets how the bat swings and where energy concentrates</td></tr>
			<tr><td>centre of percussion</td><td>the point that, when struck, sends no jolt to the hands</td><td>hit here and the handle does not kick</td></tr>
			<tr><td>vibration node</td><td>a point on the bat that barely vibrates</td><td>hit here and little energy is wasted making the bat ring - and your hands do not sting</td></tr>
		</tbody></table>

		<div class="callout c-intuit">
			<span class="lab">intuition &middot; why it is an area</span>
			The sweet spot is where the centre of percussion and a vibration node roughly coincide, so the hit
			is both jolt-free and low-vibration - maximum energy into the ball, minimum into your hands and the
			bat's ringing. Because those points depend on grip position and the player, the sweet spot is a
			region, not a dot.
		</div>
	</section>

	<!-- ===== LESSON 4 ===== -->
	<section class="lesson" id="l4">
		<div class="lesson-h">Lesson 4</div>
		<div class="lesson-title">Design trade-offs</div>
		<div class="lesson-date">throughout &middot; competing demands &amp; stakeholders</div>
		<LectureClip id={LEC_02NOV} start={1084} label="design trade-offs" />

		<p>
			Almost every equipment decision is a <b>compromise</b> between properties that fight each other. You
			cannot max everything, so the engineer picks where to sit on each axis for the intended use.
		</p>
		<div class="two">
			<div class="card-t"><h4 style="margin-top:0">flexibility vs stiffness</h4><p style="margin:0">Flex stores and returns energy (a lively feel); stiffness gives control and durability.</p></div>
			<div class="card-t"><h4 style="margin-top:0">light vs durable</h4><p style="margin:0">Lighter is faster to swing but usually weaker; tougher usually means heavier.</p></div>
		</div>
		<div class="two" style="margin-top:0">
			<div class="card-t"><h4 style="margin-top:0">speed vs control</h4><p style="margin:0">A bigger sweet spot forgives mis-hits but can cost raw power or feel.</p></div>
			<div class="card-t"><h4 style="margin-top:0">cost vs performance</h4><p style="margin:0">The best materials and manufacturing push the price past what most of the market will pay.</p></div>
		</div>

		<div class="callout c-intuit">
			<span class="lab">intuition &middot; whose requirements?</span>
			Players, manufacturers, spectators and governing bodies all want different things - a player wants
			power, a governing body wants safety and fair play, a manufacturer wants a sellable price. The final
			design is a negotiated settlement between those conflicting requirements, which is why standards and
			regulations exist to set the floor.
		</div>
	</section>

	<!-- ===== LESSON 5 ===== -->
	<section class="lesson" id="l5">
		<div class="lesson-h">Lesson 5</div>
		<div class="lesson-title">Testing, standards &amp; the design loop</div>
		<div class="lesson-date">throughout &middot; how equipment actually gets signed off</div>
		<LectureClip id={LEC_02NOV} start={1641} label="standards & testing" />

		<p>
			A design is not finished until it is <b>verified</b>. That means both <b>lab testing</b> (rigs,
			instrumented head-forms, drop towers measuring peak acceleration) and <b>player testing</b> (does it
			actually work and feel right in use), before anything reaches the market.
		</p>

		<div class="callout c-text">
			<span class="lab">standards drive improvement</span>
			Testing protocols and standards - the NFL's helmet testing programme was the lecture's example -
			rank equipment and set a required bar. Publishing the rankings pushed every manufacturer to improve,
			measurably raising helmet performance and cutting injuries over time.
		</div>

		<div class="callout c-intuit">
			<span class="lab">the thread running through all five</span>
			Reducing injury is never one fix. It takes the whole loop: better equipment engineering, rule
			changes, coaching and education, and injury-data analysis feeding back into the next design. The
			physics (energy, restitution, vibration) tells you what is possible; the trade-offs and standards
			decide what actually gets built.
		</div>
	</section>

	<p class="muted" style="font-size:13px;font-family:Inter,sans-serif;margin-top:40px">
		Lecture content from the WSA070 Applied Engineering Panopto recordings (helmet / impact lectures,
		26 Oct &amp; 2 Nov). No set textbook for this module, so theory is condensed from the lecturer's own
		material rather than cited to a page. "Watch the clip" links open the ReVIEW recording at that
		timestamp (needs your Loughborough login); the restitution and sweet-spot lessons come from an
		earlier recording that predates the clip-search window, so those two are not linked yet. Diagrams
		are original schematic study aids.
	</p>
</main>
