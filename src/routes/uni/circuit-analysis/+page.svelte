<script lang="ts">
	import MaxPowerCurve from '$lib/uni/MaxPowerCurve.svelte';
</script>

<svelte:head><title>WSA030 Circuit Analysis - study notes</title></svelte:head>

<main class="m-wrap">
	<p class="m-kicker">WSA030 &middot; Circuit Analysis</p>
	<h1>Maximum power transfer: the week-six finale</h1>
	<p class="lede">
		His last topic of the module, run across two sessions (3 &amp; 4 November). One idea with a sting in
		the tail: the load that draws the <i>most power</i> is only <b>50% efficient</b>. His three board
		examples are stepped out in full, and the power-vs-efficiency curve he kept sketching is a demo you
		can drag.
	</p>

	<nav class="toc">
		<a href="#l1">1 &middot; the theorem</a>
		<a href="#l2">2 &middot; power vs efficiency</a>
		<a href="#l3">3 &middot; Th&eacute;venin worked example</a>
		<a href="#l4">4 &middot; power as a function of R&#8343;</a>
		<a href="#ref">formula reference</a>
	</nav>

	<!-- ================= LESSON 1 ================= -->
	<section class="lesson" id="l1">
		<div class="lesson-h">Lesson 1</div>
		<div class="lesson-title">Maximum power transfer &amp; the matching condition</div>
		<div class="lesson-date">03 November &middot; the theorem, the peak-power equation</div>

		<p>
			Setup: a real source (a Th&eacute;venin voltage V&#8348;&#8341; behind an internal resistance R&#8348;&#8341;)
			driving a load R&#8343;. His question: <b>"what value load draws the most power?"</b> Too small a load and
			there is almost no voltage across it; too large and almost no current flows. Somewhere in between is a peak.
		</p>

		<div class="callout c-text">
			<span class="lab">from his notes &middot; the derivation he skipped</span>
			Load power is P = I&sup2;R&#8343; with I = V&#8348;&#8341;/(R&#8348;&#8341; + R&#8343;), so P = V&#8348;&#8341;&sup2;R&#8343; / (R&#8348;&#8341; + R&#8343;)&sup2;.
			Differentiate dP/dR&#8343; and set it to zero: the maximum lands exactly at <b>R&#8343; = R&#8348;&#8341;</b>. He said the
			full dP/dR&#8343; working "is in the notes, please have a look" - the result is all you carry forward.
		</div>

		<div class="formula">R&#8343; = R&#8348;&#8341; &nbsp;&nbsp;|&nbsp;&nbsp; P&#8339;&#8336;&#8339; = V&#8348;&#8341;&sup2; / 4R&#8348;&#8341; &nbsp;&nbsp;|&nbsp;&nbsp; P&#8339;&#8336;&#8339; = (V&#8338;&#8450;/2)(I&#8347;&#8450;/2)</div>

		<p>
			At the match the peak power is <b>P&#8339;&#8336;&#8339; = V&#8348;&#8341;&sup2;/4R&#8348;&#8341;</b>. He gave a second route to the same
			number: half the open-circuit voltage times half the short-circuit current. For a Norton source the
			same peak is I&#8345;&sup2;R&#8345;/4 - identical, since V&#8348;&#8341; = I&#8345;R&#8345;.
		</p>

		<div class="callout c-intuit">
			<span class="lab">intuition &middot; why it is the middle</span>
			Open circuit: all voltage, no current, so no power. Short circuit: all current, no voltage, so no
			power. Power is the product V&middot;I, so it has to peak somewhere between the two zeros - and the
			symmetry puts it dead centre, where the load matches the source.
		</div>
	</section>

	<!-- ================= LESSON 2 ================= -->
	<section class="lesson" id="l2">
		<div class="lesson-h">Lesson 2</div>
		<div class="lesson-title">The catch: power versus efficiency</div>
		<div class="lesson-date">03-04 November &middot; the 50% result, impedance matching trade-offs</div>

		<p>
			The twist that took up most of both sessions. When R&#8343; = R&#8348;&#8341; the two resistors are equal, the same
			current runs through both, so I&sup2;R heats each one equally - <b>half the generated power is lost as
			heat inside the source.</b> Maximum power and maximum efficiency are <b>competing</b> goals; you pick one.
		</p>

		<div class="formula">&eta; = P(load) / P(total) = R&#8343; / (R&#8343; + R&#8348;&#8341;) &nbsp;&rarr; at the match, &eta; = 50%</div>

		<h3>Drag the load - watch both move the wrong ways</h3>
		<p>
			This is the graph he kept redrawing (his numbers: V&#8348;&#8341; = 10 V, R&#8348;&#8341; = 4 &#8486;, so the peak is
			6.25 W at R&#8343; = 4 &#8486;, and total generated hits 25 W at short circuit). Slide the load:
		</p>

		<MaxPowerCurve vth={10} rth={4} />

		<div class="callout c-text">
			<span class="lab">his two real-world anchors</span>
			<b>Power station:</b> 50% efficiency is "bonkers" - you would sell only half of what you burn. So they
			drive the internal resistance as low as possible and run at high efficiency (~90%), deliberately
			<i>not</i> at maximum power transfer. <b>GPS antenna:</b> the satellite signal reaching the ground is
			so tiny that you squeeze out every microwatt - so you impedance-match the antenna to the amplifier and
			accept the poor efficiency. The application decides which end of this curve you design for.
		</div>
	</section>

	<!-- ================= LESSON 3 ================= -->
	<section class="lesson" id="l3">
		<div class="lesson-h">Lesson 3</div>
		<div class="lesson-title">Th&eacute;venin reduction, then peak power</div>
		<div class="lesson-date">04 November &middot; KVL, nulling sources, his worked challenge</div>

		<p>
			The routine for any max-power question: collapse everything the load sees into one Th&eacute;venin
			source (V&#8348;&#8341; and R&#8348;&#8341;), then drop the numbers into P&#8339;&#8336;&#8339; = V&#8348;&#8341;&sup2;/4R&#8348;&#8341;. Two passes:
			one for the open-circuit voltage, one for the resistance with sources killed.
		</p>

		<div class="worked">
			<span class="tag">worked example &middot; his board numbers</span>
			<p>
				Find V&#8348;&#8341; first. Remove the load; a 2 A current turns through the top 4 &#8486; resistor, and a
				mesh KVL round the lower loop (&minus;3(2 + I&#8321;) &minus; 6I&#8321; + 3 = 0) fixes the branch current.
			</p>
			<div class="step"><div class="n">1</div><div class="body">Top branch: V&#8324;&#8486; = I&middot;R = 2 &times; 4 = <b>8 V</b> (Ohm's law, the 2 A has nowhere to go but through it).</div></div>
			<div class="step"><div class="n">2</div><div class="body">Lower loop KVL &rarr; I&#8321; = &minus;1/3 A, so V&#8326;&#8486; = I&#8321;&middot;6 = &minus;1/3 &times; 6 = <b>&minus;2 V</b>.</div></div>
			<div class="step"><div class="n">3</div><div class="body">Add round the open-circuit mesh: V&#8348;&#8341; = V&#8324;&#8486; &minus; V&#8326;&#8486; = 8 &minus; (&minus;2) = <b>10 V</b>.</div></div>
			<div class="step"><div class="n">4</div><div class="body">R&#8348;&#8341;: null sources (voltage &rarr; short, current &rarr; open). Then 6 &#8741; 3 = (6&times;3)/(6+3) = 2 &#8486;, in series with 4 &#8486; &rarr; <b>R&#8348;&#8341; = 6 &#8486;</b>.</div></div>
			<div class="step"><div class="n">5</div><div class="body">Peak: P&#8339;&#8336;&#8339; = V&#8348;&#8341;&sup2;/4R&#8348;&#8341; = 10&sup2; / (4 &times; 6) = 100/24.</div></div>
			<div class="ans">P&#8339;&#8336;&#8339; = <b>25/6 &asymp; 4.17 W</b>, delivered when the load is set to R&#8343; = 6 &#8486;.</div>
		</div>

		<div class="callout c-trap">
			<span class="lab">common trap &middot; sign bookkeeping</span>
			Once you pick a current direction you are <b>locked in</b> to the + / &minus; labels that follow from
			it. A negative answer (his I&#8321; = &minus;1/3 A) is not a mistake - it just means the real current runs
			opposite to your arrow. Keep the minus signs in the algebra and only read the diagram at the end.
		</div>
	</section>

	<!-- ================= LESSON 4 ================= -->
	<section class="lesson" id="l4">
		<div class="lesson-h">Lesson 4</div>
		<div class="lesson-title">Power as a function of the load</div>
		<div class="lesson-date">04 November &middot; the closing tutorial, voltage divider for V&#8348;&#8341;</div>

		<p>
			His final challenge changed the ask: not <i>"what is the max power"</i> but <i>"give me an equation
			for the power in terms of R&#8343;"</i> - the whole green curve, not just its peak. Same Th&eacute;venin
			first step, then P = I&sup2;R&#8343; left as an expression.
		</p>

		<div class="worked">
			<span class="tag">worked example &middot; his board numbers</span>
			<p>30 V source; a 6 &#8486; branch to the load, with 4 &#8486; and 5 &#8486; in series feeding it, plus a 3 &#8486; that drops out.</p>
			<div class="step"><div class="n">1</div><div class="body">Open-circuit R&#8343;. The load voltage is across the 6 &#8486;, a voltage divider: V&#8348;&#8341; = 30 &times; 6/(6 + 4 + 5) = 30 &times; 6/15 = <b>12 V</b>.</div></div>
			<div class="step"><div class="n">2</div><div class="body">R&#8348;&#8341;: short the 30 V source; the 3 &#8486; is shorted out, leaving (4 + 5) &#8741; 6 = 9&times;6/(9+6) = 54/15 = <b>3.6 &#8486;</b>.</div></div>
			<div class="step"><div class="n">3</div><div class="body">Current into the load: I = V&#8348;&#8341;/(R&#8348;&#8341; + R&#8343;) = 12/(3.6 + R&#8343;).</div></div>
			<div class="step"><div class="n">4</div><div class="body">Power: P = I&sup2;R&#8343; = [12/(3.6 + R&#8343;)]&sup2; &middot; R&#8343;.</div></div>
			<div class="ans">P(R&#8343;) = <b>144 R&#8343; / (3.6 + R&#8343;)&sup2;</b> &nbsp;W &mdash; peaks at R&#8343; = 3.6 &#8486;, giving 144&times;3.6/7.2&sup2; = 10 W.</div>
		</div>

		<div class="callout c-book">
			<span class="lab">read ahead &middot; after reading week</span>
			He signed off here (his last lecture of the module). Next block moves to <b>AC analysis</b> - voltage
			and current flow with complex numbers (phasors, reactance). The drop-in catch-up session he mentioned
			runs in the STEM lab on the Monday after reading week.
		</div>
	</section>

	<!-- ================= REFERENCE ================= -->
	<section class="lesson" id="ref">
		<div class="lesson-h">Appendix</div>
		<div class="lesson-title">Formula reference</div>
		<table class="ref" style="margin-top:18px"><tbody>
			<tr><th>topic</th><th>formula</th><th>note</th></tr>
			<tr><td>Load power</td><td>P = V&#8348;&#8341;&sup2;R&#8343; / (R&#8348;&#8341; + R&#8343;)&sup2;</td><td>full curve</td></tr>
			<tr><td>Matching condition</td><td>R&#8343; = R&#8348;&#8341;</td><td>peak power</td></tr>
			<tr><td>Peak power</td><td>P&#8339;&#8336;&#8339; = V&#8348;&#8341;&sup2; / 4R&#8348;&#8341;</td><td>= (V&#8338;&#8450;/2)(I&#8347;&#8450;/2)</td></tr>
			<tr><td>Norton form</td><td>P&#8339;&#8336;&#8339; = I&#8345;&sup2;R&#8345; / 4</td><td>same peak</td></tr>
			<tr><td>Efficiency</td><td>&eta; = R&#8343; / (R&#8343; + R&#8348;&#8341;)</td><td>50% at the match</td></tr>
			<tr><td>Total generated</td><td>P&#8348;&#8338;&#8348; = V&#8348;&#8341;&sup2; / (R&#8348;&#8341; + R&#8343;)</td><td>max at short circuit</td></tr>
			<tr><td>Ohm's law</td><td>V = IR</td><td>per element</td></tr>
			<tr><td>Voltage divider</td><td>V&#8339; = V&middot;R&#8339; / &Sigma;R</td><td>series branch</td></tr>
		</tbody></table>
		<p class="muted" style="font-size:13px;font-family:Inter,sans-serif;margin-top:24px">
			Lecture content from the WSA030 Circuit Analysis Panopto recordings (3 &amp; 4 November 2026);
			worked-example numbers transcribed from the board. No set textbook for this module, so theory is
			condensed from the lecturer's own notes rather than cited to a page. Diagrams are original schematic
			study aids, not to scale.
		</p>
	</section>
</main>
