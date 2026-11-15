<script lang="ts">
	import VectorAngle from '$lib/uni/VectorAngle.svelte';
	import Sym from '$lib/uni/Sym.svelte';
	import LectureClip from '$lib/uni/LectureClip.svelte';
	// Panopto session ids for the WSA034 recordings (only the two most recent are
	// still inside the recording-search window; the 21-28 Oct lectures aged out).
	const LEC_03NOV = '770a3281-5c79-4cf0-abbf-b4f70009851e';
	const LEC_04NOV = '80eec7b9-0611-4ffc-9763-b4f8000addb0';
</script>

<svelte:head><title>WSA034 Dynamic Systems Analysis - study notes</title></svelte:head>

<main class="m-wrap">
	<p class="m-kicker">WSA034 &middot; Dynamic Systems Analysis</p>
	<h1>Statics &amp; mechanics: the last five lessons</h1>
	<p class="lede">
		The lecturer's own worked examples stepped out in full, plus the parts he left for the textbook
		condensed from Beer &amp; Johnston and cited to the page. The dynamic bits are animated, and the
		one everybody gets stuck on - resolving a tilted vector - is a demo you can drag.
	</p>

	<nav class="toc">
		<a href="#l1">1 &middot; moments &amp; couples</a>
		<a href="#l2">2 &middot; friction</a>
		<a href="#l3">3 &middot; moments of inertia</a>
		<a href="#l4">4 &middot; belts &amp; 2nd moment</a>
		<a href="#l5">5 &middot; stress &amp; strain</a>
		<a href="#ref">formula reference</a>
	</nav>

	<!-- ================= LESSON 1 ================= -->
	<section class="lesson" id="l1">
		<div class="lesson-h">Lesson 1</div>
		<div class="lesson-title">Moments, couples &amp; composite centroids</div>
		<div class="lesson-date">21 October &middot; 3D force-couple systems, the right-hand rule, centroids</div>

		<p>
			Pure vector bookkeeping. His one-line summary: <b>"it's all just adding vectors up."</b> A
			<b>couple</b> is a pair of equal, opposite, parallel forces whose net force is zero but which still
			twist the body.
		</p>

		<div class="callout c-text">
			<span class="lab">from the textbook &middot; VM &sect;3.3A <span class="cite">p.119</span></span>
			Two forces F and &minus;F with equal magnitude, parallel lines of action and opposite sense form a
			<b>couple</b>. Their components cancel so there is no translation, but their moments do not: the
			couple moment is M = r &times; F (eq. 3.45) with magnitude M = F&middot;d (eq. 3.46), where d is the
			perpendicular distance between the lines of action. Because r does not depend on which point you take
			moments about, M is a <b>free vector</b> - it can be applied anywhere on the body.
		</div>

		<div class="formula"><Sym def="moment of the couple (N&middot;m) - how hard it twists">M</Sym> = <Sym def="magnitude of one of the two forces (N)">F</Sym>&middot;<Sym def="perpendicular distance between the two force lines (m)">d</Sym> &nbsp;&nbsp;|&nbsp;&nbsp; M = <Sym def="position vector from the axis to the force (m)">r</Sym> &times; F &nbsp;&nbsp;|&nbsp;&nbsp; |M| = &radic;(<Sym def="x-component of the moment vector">M&#8339;</Sym>&sup2; + <Sym def="y-component of the moment vector">M&#7527;</Sym>&sup2; + <Sym def="z-component of the moment vector">M&#7611;</Sym>&sup2;)</div>

		<p>
			The "point your right hand along the rotation" line is hard to picture, so here it is drawn: curl
			your fingers the way the body spins and your thumb is the moment vector.
		</p>

		<figure>
			<span class="figtag">figure 1.1 &middot; the right-hand rule</span>
			<svg viewBox="0 0 520 300" class="svgtext" aria-label="right-hand rule">
				<ellipse cx="150" cy="200" rx="88" ry="30" fill="#eef5f1" stroke="#cfe4d9" />
				<path d="M150 200 m 78 0 a 78 26 0 1 1 -3 -20" fill="none" stroke="#0e6b63" stroke-width="3" marker-end="url(#rh1)" />
				<text x="92" y="258" fill="#0e6b63" font-size="13" font-weight="600">sense of rotation</text>
				<g transform="translate(150,200)">
					<line x1="0" y1="-8" x2="0" y2="-150" stroke="#9a3b2e" stroke-width="5" stroke-linecap="round" marker-end="url(#rh2)" />
					<rect x="-26" y="-14" width="40" height="30" rx="7" fill="#f3ddc6" stroke="#b5631f" stroke-width="1.5" transform="rotate(12)" />
					<path d="M-24 2 q 30 26 58 2" fill="none" stroke="#b5631f" stroke-width="4" stroke-linecap="round" />
					<path d="M-22 10 q 28 24 54 2" fill="none" stroke="#b5631f" stroke-width="4" stroke-linecap="round" opacity="0.8" />
					<path d="M-20 18 q 26 22 50 2" fill="none" stroke="#b5631f" stroke-width="4" stroke-linecap="round" opacity="0.6" />
				</g>
				<text x="168" y="74" fill="#9a3b2e" font-weight="700" font-size="15">M (thumb)</text>
				<text x="300" y="185" fill="#b5631f" font-size="13" font-weight="600">curl fingers the way it spins</text>
				<text x="300" y="225" fill="#201d18" font-size="13">thumb points along M</text>
				<text x="300" y="245" fill="#201d18" font-size="13">screws "out" = positive</text>
				<defs>
					<marker id="rh1" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#0e6b63" /></marker>
					<marker id="rh2" markerWidth="10" markerHeight="10" refX="5" refY="8" orient="auto"><path d="M0,0 L5,9 L10,0 z" fill="#9a3b2e" /></marker>
				</defs>
			</svg>
			<figcaption>Curl the fingers of your right hand the way the body spins; your thumb points along the moment vector M.</figcaption>
		</figure>

		<h3>Resolving a tilted moment - drag it yourself</h3>
		<p>
			When a couple sits in a tilted plane, its vector points partly along x and partly along y. The
			angle is measured <b>from the vertical</b>, so the axis it leans toward (y) gets the cosine and the
			axis it leans away from (x) gets the sine. Drag the slider:
		</p>

		<VectorAngle magnitude={18.75} label="M&#8321;" />

		<div class="callout c-intuit">
			<span class="lab">intuition &middot; his sin/cos shortcut</span>
			Mentally squash the angle to zero. The direction the vector goes flat gets <b>none</b> of it (the
			sine term); the direction it aligns with gets <b>all</b> of it (the cosine term).
		</div>

		<div class="worked">
			<span class="tag">worked example 1 &middot; his board numbers</span>
			<p>
				Two couples: a <b>25 N</b> pair <b>0.75 m</b> apart (tilted 40&deg;), and a <b>20 N</b> pair
				<b>0.4 m</b> apart in the x-z plane. Find the resultant, then the force pair at 0.75 m that
				replaces it.
			</p>
			<div class="step"><div class="n">1</div><div class="body">Magnitudes: M&#8321; = 25 &times; 0.75 = 18.75, M&#8322; = 20 &times; 0.4 = 8 N&middot;m.</div></div>
			<div class="step"><div class="n">2</div><div class="body">Vectors: M&#8322; screws downward &rarr; &minus;8&#309;. Split M&#8321;: x = 18.75 sin40&deg; = 12.05, y = 18.75 cos40&deg; = 14.3 &rarr; 12.05&#238; + 14.3&#309;.</div></div>
			<div class="step"><div class="n">3</div><div class="body">Add parts separately: M&#7523; = 12.05&#238; + (14.3 &minus; 8)&#309; = 12.05&#238; + 6.3&#309;.</div></div>
			<div class="step"><div class="n">4</div><div class="body">|M&#7523;| = &radic;(12.05&sup2; + 6.3&sup2;) = 13.62, at tan&#8315;&sup1;(6.3/12.05) = 27.8&deg;.</div></div>
			<div class="step"><div class="n">5</div><div class="body">Force pair at d = 0.75: F = M/d = 13.62 / 0.75.</div></div>
			<div class="ans">resultant <b>13.62 N&middot;m at 27.8&deg;</b> = a force pair of <b>F = 18.17 N</b> at 0.75 m spacing.</div>
		</div>

		<h3 id="centroids">Composite centroids</h3>
		<div class="callout c-text">
			<span class="lab">from the textbook &middot; VM &sect;5.1C-D <span class="cite">p.237</span></span>
			The quantity x&#772;A = &Sigma;x&#7522;A&#7522; is the <b>first moment</b> of area about an axis, and
			the first moment about a centroidal axis is zero (the fact that kills a term in the parallel-axis
			proof in Lesson 3). For a composite, take the area-weighted average of the sub-centroids.
		</div>
		<div class="formula"><Sym def="x-coordinate of the whole shape's centroid">x&#772;</Sym> = <Sym def="sum of each piece's area times its own x-position">&Sigma;x&#7522;A&#7522;</Sym> / <Sym def="total area of all the pieces">&Sigma;A&#7522;</Sym> &nbsp;&nbsp;&nbsp; <Sym def="y-coordinate of the centroid">y&#772;</Sym> = <Sym def="sum of each piece's area times its own y-position">&Sigma;y&#7522;A&#7522;</Sym> / &Sigma;A&#7522;</div>

		<div class="worked">
			<span class="tag">worked example 2 &middot; his board numbers</span>
			<table class="ref" style="margin-top:4px"><tbody>
				<tr><th>piece</th><th>dims (mm)</th><th>A&#7522; (mm&sup2;)</th><th>x&#7522;</th><th>y&#7522;</th></tr>
				<tr><td>1</td><td>30 &times; 210</td><td>6300</td><td>105</td><td>15</td></tr>
				<tr><td>2</td><td>30 &times; 300</td><td>9000</td><td>225</td><td>150</td></tr>
			</tbody></table>
			<div class="step"><div class="n">1</div><div class="body">&Sigma;A&#7522; = 15,300 mm&sup2;.</div></div>
			<div class="step"><div class="n">2</div><div class="body">&Sigma;x&#7522;A&#7522; = 2.6865&times;10&#8310;, &Sigma;y&#7522;A&#7522; = 1.4445&times;10&#8310;.</div></div>
			<div class="ans">centroid <b>x&#772; = 175.6 mm, y&#772; = 94.4 mm</b> - nearer piece 2, the bigger one. Sanity check passes.</div>
		</div>
	</section>

	<!-- ================= LESSON 2 ================= -->
	<section class="lesson" id="l2">
		<div class="lesson-h">Lesson 2</div>
		<div class="lesson-title">Friction: surfaces, bearings &amp; belts</div>
		<div class="lesson-date">27 October &middot; dry friction laws, journal bearings, belt friction</div>

		<div class="callout c-text">
			<span class="lab">from the textbook &middot; VM &sect;8.1A-B <span class="cite">p.433</span></span>
			Push a block with force P and static friction F grows to match, up to a ceiling F&#7524; = &mu;&#8347;N
			(eq. 8.1). Push past it and friction drops to the kinetic value F&#8342; = &mu;&#8342;N (eq. 8.2,
			about 25% lower). The coefficients do <b>not</b> depend on contact area. Combine N and F into one
			resultant tilted by the <b>angle of friction</b> tan&phi;&#8347; = &mu;&#8347; (eq. 8.3); tilt a board
			until the block slips and that tilt - the <b>angle of repose</b> - equals &phi;&#8347;.
		</div>
		<div class="formula"><Sym def="maximum static friction force before it slips (N)">F&#7524;</Sym> = <Sym def="coefficient of static friction (how grippy the surfaces are)">&mu;&#8347;</Sym><Sym def="normal force pressing the surfaces together (N)">N</Sym> &nbsp;&nbsp;|&nbsp;&nbsp; <Sym def="kinetic friction force once sliding (N)">F&#8342;</Sym> = <Sym def="coefficient of kinetic friction (lower than static)">&mu;&#8342;</Sym>N &nbsp;&nbsp;|&nbsp;&nbsp; tan<Sym def="angle of friction - the tilt at which it just slips">&phi;&#8347;</Sym> = &mu;&#8347;</div>

		<figure>
			<span class="figtag">figure 2.1 &middot; free-body diagram + F vs P</span>
			<svg viewBox="0 0 560 240" class="svgtext" aria-label="friction free body and graph">
				<rect x="40" y="95" width="90" height="55" rx="4" fill="#dcebe4" stroke="#0e6b63" />
				<line x1="55" y1="150" x2="185" y2="150" stroke="#6a645a" stroke-width="3" />
				<line x1="85" y1="95" x2="85" y2="45" stroke="#201d18" stroke-width="2" marker-end="url(#f2a)" /><text x="72" y="40" fill="#6a645a" font-size="11">W</text>
				<line x1="85" y1="150" x2="85" y2="200" stroke="#201d18" stroke-width="2" marker-end="url(#f2a)" /><text x="92" y="190" fill="#6a645a" font-size="11">N</text>
				<line x1="130" y1="122" x2="182" y2="122" stroke="#b5631f" stroke-width="2.5" marker-end="url(#f2b)" /><text x="160" y="116" fill="#b5631f" font-size="11">P</text>
				<line x1="40" y1="122" x2="5" y2="122" stroke="#9a3b2e" stroke-width="2.5" marker-end="url(#f2c)" /><text x="8" y="140" fill="#9a3b2e" font-size="11">F</text>
				<g transform="translate(250,0)">
					<line x1="40" y1="200" x2="300" y2="200" stroke="#201d18" stroke-width="1.5" marker-end="url(#f2x)" />
					<line x1="40" y1="200" x2="40" y2="30" stroke="#201d18" stroke-width="1.5" marker-end="url(#f2y)" />
					<text x="250" y="222" fill="#6a645a" font-size="12">applied push P</text>
					<text x="8" y="40" fill="#6a645a" font-size="12">F</text>
					<line x1="40" y1="200" x2="170" y2="80" stroke="#0e6b63" stroke-width="2.5" />
					<circle cx="170" cy="80" r="4" fill="#9a3b2e" />
					<text x="118" y="68" fill="#9a3b2e" font-size="12">F&#7524; = &mu;&#8347;N</text>
					<line x1="170" y1="80" x2="170" y2="108" stroke="#6a645a" stroke-dasharray="3 3" />
					<line x1="170" y1="108" x2="295" y2="108" stroke="#b5631f" stroke-width="2.5" />
					<text x="196" y="100" fill="#b5631f" font-size="12">F&#8342; (moving)</text>
				</g>
				<defs>
					<marker id="f2a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#201d18" /></marker>
					<marker id="f2b" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#b5631f" /></marker>
					<marker id="f2c" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#9a3b2e" /></marker>
					<marker id="f2x" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#201d18" /></marker>
					<marker id="f2y" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#201d18" /></marker>
				</defs>
			</svg>
			<figcaption>Static friction rises to meet whatever you apply, up to &mu;&#8347;N, then drops to the kinetic plateau at breakaway - why starting a slide is harder than keeping it going.</figcaption>
		</figure>

		<figure>
			<span class="figtag">figure 2.2 &middot; animated &middot; angle of repose</span>
			<svg viewBox="0 0 460 260" class="svgtext" aria-label="plank tilting until block slips">
				<g>
					<animateTransform attributeName="transform" type="rotate" from="0 80 210" to="-26 80 210" dur="2.4s" values="0 80 210; 0 80 210; -26 80 210; -26 80 210; 0 80 210" keyTimes="0;0.15;0.5;0.8;1" repeatCount="indefinite" />
					<line x1="80" y1="210" x2="420" y2="210" stroke="#6a645a" stroke-width="6" stroke-linecap="round" />
					<rect x="250" y="170" width="52" height="40" rx="4" fill="#dcebe4" stroke="#0e6b63" />
					<line x1="276" y1="190" x2="276" y2="235" stroke="#201d18" stroke-width="2" marker-end="url(#f22)" />
				</g>
				<text x="150" y="245" fill="#6a645a" font-size="12">tilt &phi; grows until the block breaks away</text>
				<text x="300" y="150" fill="#0e6b63" font-size="13" font-weight="600">repose &phi;&#8347; = tan&#8315;&sup1;&mu;&#8347;</text>
				<defs><marker id="f22" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#201d18" /></marker></defs>
			</svg>
			<figcaption>At the angle of repose the tilt exactly equals &phi;&#8347;; one degree more and it slides.</figcaption>
		</figure>

		<div class="callout c-trap">
			<span class="lab">common trap &middot; "&mu; can't exceed 1"</span>
			Only true for the idealised dry model. Sticky race tyres effectively glue to the road (not dry
			friction), &mu; &gt; 1; motorbikes lean past 45&deg; which tan&#8315;&sup1;(1) = 45&deg; would forbid.
		</div>

		<h3 id="bearings">Journal bearings &amp; the friction circle</h3>
		<div class="callout c-text">
			<span class="lab">from the textbook &middot; VM &sect;8.3A <span class="cite">p.462</span></span>
			A turning axle <b>climbs its bearing</b> until it slips back and settles, so contact is offset from
			the bottom. The reaction is tangent to a small <b>friction circle</b> of radius r&#8355; = r&middot;sin&phi;&#8342;
			&asymp; r&mu;&#8342; (eq. 8.7), and the moment to keep it turning is M = R&middot;r&#8355; (eq. 8.5). Smaller
			shaft &rarr; smaller r&#8355; &rarr; less friction, which is why precision bearings use thin axles.
		</div>

		<figure>
			<span class="figtag">figure 2.3 &middot; animated</span>
			<svg viewBox="0 0 320 280" class="svgtext" aria-label="shaft in journal bearing">
				<circle cx="160" cy="150" r="95" fill="#f7f4ee" stroke="#6a645a" stroke-width="2" />
				<g><animateTransform attributeName="transform" type="rotate" from="0 160 150" to="360 160 150" dur="6s" repeatCount="indefinite" />
					<circle cx="160" cy="150" r="62" fill="#eef5f1" stroke="#0e6b63" stroke-width="2" />
					<line x1="160" y1="150" x2="160" y2="92" stroke="#0e6b63" stroke-width="2" /></g>
				<circle cx="160" cy="150" r="16" fill="none" stroke="#9a3b2e" stroke-dasharray="3 3" />
				<text x="180" y="150" fill="#9a3b2e" font-size="12">r&#8355;</text>
				<circle cx="140" cy="212" r="4" fill="#b5631f" />
				<text x="140" y="235" fill="#b5631f" font-size="12">line of contact</text>
			</svg>
			<figcaption>Friction drags the shaft up its bore. The reaction stays tangent to the friction circle r&#8355;; the offset is what resists turning.</figcaption>
		</figure>

		<h3 id="belt">Belt &amp; rope friction</h3>
		<div class="callout c-text">
			<span class="lab">from the textbook &middot; VM &sect;8.4 <span class="cite">p.471</span></span>
			Taking a small belt element and letting it shrink, the equilibrium integrates to T&#8322;/T&#8321; =
			e^(&mu;&#8347;&beta;) (eq. 8.14). T&#8322; is always the larger (pulling) side, &beta; must be in
			<b>radians</b>, and for n full wraps &beta; = 2&pi;n.
		</div>
		<div class="formula"><Sym def="tight-side tension - the bigger belt pull (N)">T&#8322;</Sym> / <Sym def="slack-side tension - the smaller belt pull (N)">T&#8321;</Sym> = e^(<Sym def="coefficient of static friction between belt and surface">&mu;&#8347;</Sym><Sym def="wrap angle: how far the belt hugs the surface, in radians">&beta;</Sym>) &nbsp;&nbsp; (&beta; in radians, T&#8322; = tight side)</div>
		<div class="callout c-intuit">
			<span class="lab">intuition &middot; the bollard</span>
			VM's own example (Sample Prob 8.8): a hawser wrapped <b>two</b> turns holds 7500 N against a 150 N
			pull (&mu;&#8347; = 0.311); wrap it <b>three</b> turns and the same 150 N holds <b>52.7 kN</b>. The
			pulley with the smaller wrap angle slips first.
		</div>
	</section>

	<!-- ================= LESSON 3 ================= -->
	<section class="lesson" id="l3">
		<div class="lesson-h">Lesson 3</div>
		<div class="lesson-title">Moments of inertia &amp; the parallel axis theorem</div>
		<div class="lesson-date">28 October &middot; second moment of area, parallel axis theorem, composites</div>

		<div class="two">
			<div class="card-t"><h4 style="margin-top:0">mass moment of inertia</h4><p style="margin:0">I = &int;r&sup2; dm (eq. 9.28). Resistance to <b>angular acceleration</b>. Units kg&middot;m&sup2;.</p></div>
			<div class="card-t"><h4 style="margin-top:0">second moment of area</h4><p style="margin:0">I = &int;y&sup2; dA (&sect;9.1). How <b>stiff</b> a cross-section is in bending. Units m&#8308;.</p></div>
		</div>

		<div class="callout c-intuit">
			<span class="lab">intuition &middot; distance squared dominates</span>
			I grows as the <b>square</b> of distance, so mass far out counts for far more. Flywheels put mass at
			the rim; a thin-walled large tube is far stiffer than a solid wire of the same material.
		</div>

		<h3 id="pat">The parallel axis theorem</h3>
		<p>He called this <b>"the most important thing I'm going to say."</b></p>
		<div class="callout c-text">
			<span class="lab">from the textbook &middot; VM &sect;9.2A / &sect;9.5B <span class="cite">p.497</span></span>
			Write y = y&prime; + d, expand &int;y&sup2;dA = &int;y&prime;&sup2;dA + 2d&int;y&prime;dA + d&sup2;&int;dA.
			The middle integral is the first moment about the <b>centroidal</b> axis, which is zero - that is why
			the cross term vanishes. What is left is I = I&#772; + Ad&sup2; (eq. 9.9) for areas, and identically
			I = I&#772; + md&sup2; (eq. 9.33) for mass. You <b>add</b> Ad&sup2; moving away from a centroidal axis
			and <b>subtract</b> it moving to one; it only works if one axis is centroidal.
		</div>
		<div class="formula"><Sym def="moment of inertia about the new, offset axis">I</Sym> = <Sym def="moment of inertia about the centroidal (centre-of-mass) axis">I&#8339;&#8344;</Sym> + <Sym def="mass of the body (kg)">m</Sym>&middot;<Sym def="distance between the two parallel axes (m)">d</Sym>&sup2; &nbsp;(mass) &nbsp;&nbsp;|&nbsp;&nbsp; I = <Sym def="second moment of area about the centroidal axis">I&#772;</Sym> + <Sym def="cross-sectional area">A</Sym>&middot;d&sup2; &nbsp;(area)</div>

		<figure>
			<span class="figtag">figure 3.1 &middot; animated</span>
			<svg viewBox="0 0 460 300" class="svgtext" aria-label="parallel axis swinging disc">
				<circle cx="230" cy="55" r="5" fill="#201d18" />
				<text x="240" y="52" fill="#201d18" font-size="12">offset axis</text>
				<g><animateTransform attributeName="transform" type="rotate" from="-32 230 55" to="32 230 55" dur="2.6s" values="-32 230 55;32 230 55;-32 230 55" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" repeatCount="indefinite" />
					<line x1="230" y1="55" x2="230" y2="205" stroke="#6a645a" stroke-dasharray="4 4" stroke-width="1.5" />
					<circle cx="230" cy="205" r="46" fill="#eef5f1" stroke="#0e6b63" stroke-width="2" />
					<circle cx="230" cy="205" r="4" fill="#0e6b63" />
					<text x="242" y="208" fill="#0e6b63" font-size="12">I&#8339;&#8344;</text>
					<line x1="205" y1="55" x2="205" y2="205" stroke="#b5631f" stroke-width="1" marker-start="url(#p31)" marker-end="url(#p31)" />
					<text x="183" y="135" fill="#b5631f" font-size="13">d</text></g>
				<text x="105" y="285" fill="#6a645a" font-size="12">I about pivot = I&#8339;&#8344; (own spin) + m&middot;d&sup2; (swing of the mass)</text>
				<defs><marker id="p31" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#b5631f" /></marker></defs>
			</svg>
			<figcaption>Hang a body whose I&#8339;&#8344; you know on a chain of length d and swing it. The inertia about the pivot is its own I&#8339;&#8344; plus m&middot;d&sup2;.</figcaption>
		</figure>

		<h3 id="shapes">Standard shapes - look them up</h3>
		<table class="ref"><tbody>
			<tr><th>shape</th><th>axis</th><th>I</th></tr>
			<tr><td>rectangular plate (a, b)</td><td>in-plane centroidal</td><td>1/12 m a&sup2; &nbsp;/&nbsp; 1/12 m b&sup2;</td></tr>
			<tr><td>rectangular prism (b, c)</td><td>centroidal</td><td>1/12 m (b&sup2; + c&sup2;)</td></tr>
			<tr><td>circular disc (r)</td><td>diameter / central z</td><td>1/4 m r&sup2; &nbsp;/&nbsp; 1/2 m r&sup2;</td></tr>
			<tr><td>cylinder (a, L)</td><td>own axis / transverse</td><td>1/2 m a&sup2; &nbsp;/&nbsp; 1/12 m (3a&sup2; + L&sup2;)</td></tr>
		</tbody></table>
		<div class="callout c-book">
			<span class="lab">read the book</span>
			Standard-shape values are tabulated at VM Fig. 9.28 <span class="cite">p.538</span> - look them up, do
			not derive. Thin-plate link I(mass) = &rho;t&middot;I(area) and the composite rule (sum the parts, subtract
			holes) are &sect;9.5C-E.
		</div>
	</section>

	<!-- ================= LESSON 4 ================= -->
	<section class="lesson" id="l4">
		<div class="lesson-h">Lesson 4</div>
		<div class="lesson-title">Belts, bollards &amp; second moment from scratch</div>
		<div class="lesson-date">03 November &middot; capstan friction, belt-drive torque, integrating a second moment</div>
		<LectureClip id={LEC_03NOV} start={632} label="capstan friction" />
		<LectureClip id={LEC_03NOV} start={1294} label="belt drive" />
		<LectureClip id={LEC_03NOV} start={2019} label="second moment" />

		<div class="worked">
			<span class="tag">worked example &middot; capstan, his board numbers</span>
			<p>Hanging mass <b>A = 12 kg</b>, &mu;&#8347; = 0.4 both contacts, wrap &beta; = &pi;/2. Smallest block mass B that holds?</p>
			<div class="step"><div class="n">1</div><div class="body">Block: W&#7355; = N&#7355;; at impending slip T&#7355; = &mu;&#8347;N&#7355; = 0.4 W&#7355;.</div></div>
			<div class="step"><div class="n">2</div><div class="body">Wrap, small over large: T&#7355; = T&#8336; e^(&minus;&mu;&#8347;&beta;), T&#8336; = 12g.</div></div>
			<div class="step"><div class="n">3</div><div class="body">T&#7355; = 12g &middot; e^(&minus;0.4&middot;&pi;/2) = 6.4g.</div></div>
			<div class="step"><div class="n">4</div><div class="body">W&#7355; = T&#7355; / 0.4 = 16g.</div></div>
			<div class="ans">minimum block mass <b>B = 16 kg</b>.</div>
		</div>

		<h3 id="belt-drive">Belt drive: maximum transmissible torque</h3>
		<figure>
			<span class="figtag">figure 4.1 &middot; animated</span>
			<svg viewBox="0 0 460 230" class="svgtext" aria-label="two pulleys with a belt">
				<line x1="150" y1="78" x2="310" y2="78" stroke="#b5631f" stroke-width="3" />
				<line x1="150" y1="152" x2="310" y2="152" stroke="#6a645a" stroke-width="2" />
				<g><animateTransform attributeName="transform" type="rotate" from="0 150 115" to="360 150 115" dur="4s" repeatCount="indefinite" />
					<circle cx="150" cy="115" r="37" fill="#eef5f1" stroke="#0e6b63" stroke-width="2" /><line x1="150" y1="115" x2="150" y2="78" stroke="#0e6b63" stroke-width="2" /></g>
				<g><animateTransform attributeName="transform" type="rotate" from="0 310 115" to="360 310 115" dur="4s" repeatCount="indefinite" />
					<circle cx="310" cy="115" r="37" fill="#eef5f1" stroke="#0e6b63" stroke-width="2" /><line x1="310" y1="115" x2="310" y2="78" stroke="#0e6b63" stroke-width="2" /></g>
				<text x="200" y="68" fill="#b5631f" font-size="12">T&#8322; tight</text>
				<text x="200" y="172" fill="#6a645a" font-size="12">T&#8321; slack</text>
			</svg>
			<figcaption>At impending slip the ratio locks to e^(&mu;&#8347;&beta;); the couple transmitted is (T&#8322; &minus; T&#8321;)&middot;r.</figcaption>
		</figure>
		<div class="worked">
			<span class="tag">worked example &middot; his board numbers</span>
			<p>r = 60 mm, axle force P = 900 N, &mu;&#8347; = 0.35, wrap &beta; = &pi;.</p>
			<div class="step"><div class="n">1</div><div class="body">T&#8322;/T&#8321; = e^(0.35&pi;) = 3.0028.</div></div>
			<div class="step"><div class="n">2</div><div class="body">T&#8321; + T&#8322; = P = 900 &rArr; 4.0028 T&#8321; = 900.</div></div>
			<div class="step"><div class="n">3</div><div class="body">T&#8321; &asymp; 225, T&#8322; &asymp; 675 N.</div></div>
			<div class="step"><div class="n">4</div><div class="body">M = (T&#8322; &minus; T&#8321;)r = 450 &times; 0.06.</div></div>
			<div class="ans">max tension <b>T&#8322; &asymp; 675 N</b>, max couple <b>M = 27.0 N&middot;m</b>.</div>
		</div>

		<h3 id="smoa">Second moment of area from first principles</h3>
		<div class="callout c-text">
			<span class="lab">from the textbook &middot; VM &sect;9.1A-B <span class="cite">p.487</span></span>
			Before the table, this is where the values come from: I = &int;y&sup2; dA, each strip's area times its
			distance-squared from the axis. He did the area under y = kx&sup3; about the y-axis.
		</div>
		<div class="worked">
			<span class="tag">worked example &middot; his setup</span>
			<div class="step"><div class="n">1</div><div class="body">Strip dA = y dx; distance to y-axis is x, so dI&#7527; = x&sup2; y dx.</div></div>
			<div class="step"><div class="n">2</div><div class="body">Sub y = (b/a&sup3;) x&sup3;: dI&#7527; = (b/a&sup3;) x&#8309; dx.</div></div>
			<div class="step"><div class="n">3</div><div class="body">Integrate 0 to a: I&#7527; = (b/a&sup3;)(a&#8310;/6).</div></div>
			<div class="ans">I&#7527; = a&sup3;b / 6.</div>
		</div>
	</section>

	<!-- ================= LESSON 5 ================= -->
	<section class="lesson" id="l5">
		<div class="lesson-h">Lesson 5</div>
		<div class="lesson-title">Stress &amp; strain: will it break?</div>
		<div class="lesson-date">04 November &middot; normal &amp; shear stress, Young, Poisson, factors of safety</div>
		<LectureClip id={LEC_04NOV} start={0} label="normal stress" />
		<LectureClip id={LEC_04NOV} start={684} label="shear stress" />
		<LectureClip id={LEC_04NOV} start={1347} label="Young &amp; Poisson" />

		<p>
			New book (Mechanics of Materials). Statics asked "is it in equilibrium?"; this asks "does the
			material survive the loads flowing through it?" His framing problem is the hydraulic crane - will the
			ram shaft crush, will the pin shear?
		</p>

		<div class="callout c-text">
			<span class="lab">from the textbook &middot; MoM &sect;1.2A <span class="cite">p.7</span></span>
			The internal force spread over the cross-section has intensity <b>normal stress</b> &sigma; = P/A
			(eq. 1.5), in pascals. This is the <i>average</i>; it is only uniform away from the load points, when
			the load acts through the centroid (<b>centric</b> loading).
		</div>
		<div class="formula"><Sym def="normal stress - internal force spread over the area (Pa)">&sigma;</Sym> = <Sym def="axial force carried by the member (N)">P</Sym> / <Sym def="cross-sectional area the force acts over (m&sup2;)">A</Sym> &nbsp;&nbsp;|&nbsp;&nbsp; A = &pi;<Sym def="bar diameter (m)">d</Sym>&sup2; / 4 &nbsp;(round bar)</div>
		<div class="callout c-trap">
			<span class="lab">common trap &middot; sanity-check the magnitude</span>
			Metal stresses run to hundreds of MPa; atmospheric pressure is ~0.1 MPa. If yours is not "up there",
			suspect a slip. Stress is a <b>pressure</b>, not a force.
		</div>
		<div class="worked">
			<span class="tag">worked example A &middot; his board numbers</span>
			<p>Ram shaft, diameter <b>20 mm</b>, carrying <b>P = 23.6 kN</b>.</p>
			<div class="step"><div class="n">1</div><div class="body">A = &pi;d&sup2;/4 = 3.14&times;10&#8315;&#8308; m&sup2;.</div></div>
			<div class="step"><div class="n">2</div><div class="body">&sigma; = 23,600 / 3.14&times;10&#8315;&#8308;.</div></div>
			<div class="ans">&sigma; &asymp; <b>75 MPa</b> - comfortably in the metal range.</div>
		</div>

		<h3 id="shear">Shear &amp; the double-shear trap</h3>
		<div class="callout c-text">
			<span class="lab">from the textbook &middot; MoM &sect;1.2B <span class="cite">p.10</span></span>
			Transverse forces give <b>shear stress</b> &tau; = V/A (eq. 1.8), in the plane of the cut. A bolt
			joining two plates is in single shear (&tau; = F/A); add splice plates and it is cut on two planes -
			<b>double shear</b> - so each plane carries half: &tau; = F/2A (eq. 1.10).
		</div>
		<figure>
			<span class="figtag">figure 5.1 &middot; single vs double shear</span>
			<svg viewBox="0 0 560 170" class="svgtext" aria-label="single vs double shear">
				<g>
					<text x="40" y="26" fill="#6a645a" font-size="12">single: &tau; = F/A</text>
					<rect x="40" y="52" width="100" height="22" fill="#e2dccf" stroke="#6a645a" />
					<rect x="100" y="77" width="100" height="22" fill="#e2dccf" stroke="#6a645a" />
					<rect x="118" y="42" width="14" height="68" rx="7" fill="#eef5f1" stroke="#0e6b63" stroke-width="1.5" />
					<line x1="125" y1="74" x2="125" y2="77" stroke="#9a3b2e" stroke-width="3" stroke-dasharray="2 2" />
					<text x="90" y="144" fill="#9a3b2e" font-size="11">1 shear plane</text>
				</g>
				<g transform="translate(290,0)">
					<text x="30" y="26" fill="#6a645a" font-size="12">double: &tau; = F/2A</text>
					<rect x="20" y="42" width="40" height="68" fill="#e2dccf" stroke="#6a645a" />
					<rect x="200" y="42" width="40" height="68" fill="#e2dccf" stroke="#6a645a" />
					<rect x="110" y="52" width="50" height="48" fill="#f6e2cf" stroke="#b5631f" />
					<rect x="20" y="70" width="220" height="14" rx="7" fill="#eef5f1" stroke="#0e6b63" stroke-width="1.5" />
					<line x1="78" y1="55" x2="78" y2="99" stroke="#9a3b2e" stroke-width="2" stroke-dasharray="3 2" />
					<line x1="182" y1="55" x2="182" y2="99" stroke="#9a3b2e" stroke-width="2" stroke-dasharray="3 2" />
					<text x="90" y="144" fill="#9a3b2e" font-size="11">2 shear planes</text>
				</g>
			</svg>
			<figcaption>Splice plates put the pin in double shear - two planes share the load, so size against &tau; = (P/2)/A.</figcaption>
		</figure>
		<div class="worked">
			<span class="tag">worked example B &middot; his board numbers</span>
			<p>Connecting bolt, diameter <b>8 mm</b>, <b>double</b> shear, total load <b>P = 23.6 kN</b>.</p>
			<div class="step"><div class="n">1</div><div class="body">Per plane V = P/2 = 11.8 kN.</div></div>
			<div class="step"><div class="n">2</div><div class="body">A = &pi;(0.008)&sup2;/4 = 50.3 mm&sup2;.</div></div>
			<div class="step"><div class="n">3</div><div class="body">&tau; = 11,800 / 50.3&times;10&#8315;&#8310; &asymp; 235 MPa.</div></div>
			<div class="step"><div class="n">4</div><div class="body">Steel yield 690 MPa, allowable shear 345 MPa. 235 &lt; 345: bare pass.</div></div>
			<div class="ans">&tau; &asymp; <b>235 MPa</b> vs 345 allowable - passes bare, but with a factor of safety (2-3) the margin is gone.</div>
		</div>

		<h3 id="elastic">Young, Poisson &amp; shear modulus</h3>
		<div class="callout c-text">
			<span class="lab">from the textbook &middot; MoM &sect;2.1, &sect;2.4-2.8 <span class="cite">p.57</span></span>
			Strain is deformation per length, &epsilon; = &delta;/L (eq. 2.1, dimensionless). In the straight part
			of the curve &sigma; = E&epsilon; (eq. 2.6) - <b>Hooke's law</b>, slope = Young's modulus. Stretch
			axially and the bar thins sideways: <b>Poisson's ratio</b> &nu; = &minus;&epsilon;(lat)/&epsilon;(axial)
			(eq. 2.17), and 0 &lt; &nu; &lt; 1/2. Shear has its own Hooke law &tau; = G&gamma; (eq. 2.27), with
			E = 2G(1 + &nu;) linking the three - only two are independent.
		</div>
		<div class="formula"><Sym def="strain - fractional stretch, dimensionless">&epsilon;</Sym> = <Sym def="change in length / extension (m)">&delta;</Sym>/<Sym def="original length (m)">L</Sym> &nbsp;|&nbsp; <Sym def="normal stress (Pa)">&sigma;</Sym> = <Sym def="Young's modulus - stiffness, slope of the elastic line (Pa)">E</Sym>&epsilon; &nbsp;|&nbsp; <Sym def="Poisson's ratio - sideways thinning per axial stretch">&nu;</Sym> = &minus;<Sym def="lateral (sideways) strain">&epsilon;&#8343;&#8336;&#8348;</Sym>/<Sym def="axial (along-load) strain">&epsilon;&#8336;&#8339;</Sym> &nbsp;|&nbsp; <Sym def="shear stress (Pa)">&tau;</Sym> = <Sym def="shear modulus - stiffness in shear (Pa)">G</Sym><Sym def="shear strain - angle of distortion (rad)">&gamma;</Sym> &nbsp;|&nbsp; E = 2G(1+&nu;)</div>

		<figure>
			<span class="figtag">figure 5.2 &middot; animated</span>
			<svg viewBox="0 0 520 250" class="svgtext" aria-label="bar stretching and stress-strain curve">
				<text x="70" y="40" fill="#6a645a" font-size="12">bar under tension</text>
				<rect x="60" y="60" width="30" height="120" rx="3" fill="#eef5f1" stroke="#0e6b63"><animate attributeName="height" values="120;150;120" dur="3s" repeatCount="indefinite" /></rect>
				<g transform="translate(200,0)">
					<line x1="40" y1="200" x2="300" y2="200" stroke="#201d18" stroke-width="1.5" marker-end="url(#e5x)" />
					<line x1="40" y1="200" x2="40" y2="40" stroke="#201d18" stroke-width="1.5" marker-end="url(#e5y)" />
					<text x="260" y="222" fill="#6a645a" font-size="12">strain &epsilon;</text>
					<text x="8" y="50" fill="#6a645a" font-size="12">&sigma;</text>
					<path d="M40 200 L150 90 C180 60 230 58 275 70" fill="none" stroke="#b5631f" stroke-width="2.5" />
					<line x1="150" y1="90" x2="150" y2="200" stroke="#6a645a" stroke-dasharray="3 3" />
					<text x="70" y="150" fill="#b5631f" font-size="11">elastic: &sigma;=E&epsilon;</text>
					<text x="175" y="55" fill="#6a645a" font-size="11">yield &rarr; necking</text>
					<circle r="5" fill="#9a3b2e"><animateMotion dur="3s" repeatCount="indefinite" keyPoints="0;0.55;0" keyTimes="0;0.5;1" calcMode="linear" path="M40 200 L150 90 C180 60 230 58 275 70" /></circle>
				</g>
				<defs><marker id="e5x" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#201d18" /></marker><marker id="e5y" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#201d18" /></marker></defs>
			</svg>
			<figcaption>As the bar stretches the dot climbs the curve. The straight part is Hooke's law (slope E); past yield it curves over, necks, ruptures.</figcaption>
		</figure>
		<div class="callout c-book">
			<span class="lab">read the book &middot; next up</span>
			Left for the text: non-uniform stress distribution, the bulk-modulus/dilatation derivation (&sect;2.6,
			<span class="cite">p.97</span>), and the material tables in Appendix B. Next lecture: <b>torsion</b> (MoM Ch.3).
		</div>
	</section>

	<!-- ================= REFERENCE ================= -->
	<section class="lesson" id="ref">
		<div class="lesson-h">Appendix</div>
		<div class="lesson-title">Formula reference</div>
		<table class="ref" style="margin-top:18px"><tbody>
			<tr><th>topic</th><th>formula</th><th>book</th></tr>
			<tr><td>Couple moment</td><td>M = F&middot;d, &nbsp;M = r &times; F</td><td>VM 3.45-3.46</td></tr>
			<tr><td>Composite centroid</td><td>x&#772; = &Sigma;x&#7522;A&#7522; / &Sigma;A&#7522;</td><td>VM &sect;5.1</td></tr>
			<tr><td>Dry friction</td><td>F&#7524; = &mu;&#8347;N, &nbsp;tan&phi;&#8347; = &mu;&#8347;</td><td>VM 8.1-8.3</td></tr>
			<tr><td>Journal bearing</td><td>r&#8355; = r&middot;sin&phi; &asymp; r&mu;</td><td>VM 8.5-8.7</td></tr>
			<tr><td>Belt / capstan</td><td><Sym def="tight-side tension (N)">T&#8322;</Sym>/<Sym def="slack-side tension (N)">T&#8321;</Sym> = e^(<Sym def="static friction coefficient">&mu;&#8347;</Sym><Sym def="wrap angle in radians">&beta;</Sym>)</td><td>VM 8.14</td></tr>
			<tr><td>Parallel axis</td><td>I = I&#8339;&#8344; + m&middot;d&sup2;</td><td>VM 9.9 / 9.33</td></tr>
			<tr><td>Second moment of area</td><td>I = &int;y&sup2; dA</td><td>VM &sect;9.1</td></tr>
			<tr><td>Normal / shear stress</td><td>&sigma; = P/A, &nbsp;&tau; = V/A</td><td>MoM 1.5 / 1.8</td></tr>
			<tr><td>Double shear</td><td>&tau; = F/2A</td><td>MoM 1.10</td></tr>
			<tr><td>Hooke / Poisson / shear</td><td>&sigma; = E&epsilon;, &nbsp;&nu; = &minus;&epsilon;&#8343;&#8336;&#8348;/&epsilon;&#8336;&#8339;, &nbsp;&tau; = G&gamma;</td><td>MoM 2.6 / 2.17 / 2.27</td></tr>
		</tbody></table>
		<p class="muted" style="font-size:13px;font-family:Inter,sans-serif;margin-top:24px">
			Lecture content from the WSA034 Panopto recordings (21 Oct - 4 Nov); worked-example numbers
			transcribed from the board. Textbook condensations cited to Beer &amp; Johnston, Vector Mechanics 12e
			and Mechanics of Materials 7e. "Watch the clip" links open the ReVIEW recording at that timestamp
			(needs your Loughborough login); lessons 1-3 (21-28 Oct) predate the recording-search window, so their
			clips aren't linked yet. Diagrams are original schematic study aids, not to scale.
		</p>
	</section>
</main>
