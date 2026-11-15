<script lang="ts">
	import TwosComplement from '$lib/uni/TwosComplement.svelte';
	import Sym from '$lib/uni/Sym.svelte';
</script>

<svelte:head><title>WSA033 Digital Systems - study notes</title></svelte:head>

<main class="m-wrap">
	<p class="m-kicker">WSA033 &middot; Digital Systems</p>
	<h1>Binary arithmetic &amp; combinational logic</h1>
	<p class="lede">
		The last stretch of combinational logic before sequential starts in week 8: doing arithmetic in
		base 2, representing negative numbers so a computer can subtract by <i>adding</i>, and reading logic
		off a timing diagram. His board examples in full, with a two's-complement explorer you can drag.
		Textbook: Floyd, Digital Fundamentals 11e (he set chapters 2 and 6).
	</p>

	<nav class="toc">
		<a href="#l1">1 &middot; binary addition</a>
		<a href="#l2">2 &middot; subtract, multiply, divide</a>
		<a href="#l3">3 &middot; negative numbers</a>
		<a href="#l4">4 &middot; subtraction by addition + hex</a>
		<a href="#l5">5 &middot; timing diagrams &amp; logic</a>
		<a href="#ref">reference</a>
	</nav>

	<!-- ================= LESSON 1 ================= -->
	<section class="lesson" id="l1">
		<div class="lesson-h">Lesson 1</div>
		<div class="lesson-title">Binary addition</div>
		<div class="lesson-date">03 November &middot; the four rules, carries, the OR-gate link</div>

		<p>
			His framing: binary addition is exactly decimal addition, just with base-2 carry rules. Start at the
			<b>least significant bit</b> and work left, carrying when a column overflows. He pointed out the first
			three rules look like an <b>OR gate</b> - that is not a coincidence, it is the half-adder you built
			in the lab.
		</p>

		<div class="callout c-text">
			<span class="lab">the four rules</span>
			0 + 0 = 0 &nbsp;&middot;&nbsp; 0 + 1 = 1 &nbsp;&middot;&nbsp; 1 + 0 = 1 &nbsp;&middot;&nbsp;
			<b>1 + 1 = 10</b> (sum 0, carry 1). And for three bits: 1 + 1 + 1 = 11 (sum 1, carry 1). The sum bit
			is the half-adder's XOR output; the carry is its AND output.
		</div>

		<div class="worked">
			<span class="tag">worked example &middot; his board numbers</span>
			<p>Decimal 3 + 3 = 6, as 4-bit numbers (0011 + 0011).</p>
			<div class="step"><div class="n">1</div><div class="body">LSB: 1 + 1 = 0, carry 1.</div></div>
			<div class="step"><div class="n">2</div><div class="body">Next: 1 + 1 + carry 1 = 1, carry 1.</div></div>
			<div class="step"><div class="n">3</div><div class="body">Next: 0 + 0 + carry 1 = 1. Top bit: 0.</div></div>
			<div class="ans">result <b>0110</b> = 4 + 2 = <b>6</b>. The carry rippling left is the full-adder chain.</div>
		</div>
	</section>

	<!-- ================= LESSON 2 ================= -->
	<section class="lesson" id="l2">
		<div class="lesson-h">Lesson 2</div>
		<div class="lesson-title">Subtraction, multiplication &amp; division</div>
		<div class="lesson-date">03 November &middot; borrowing, shift-and-add, long division</div>

		<p>
			All three mirror the decimal methods. <b>Subtraction</b> borrows from the next column when you hit
			0 &minus; 1. <b>Multiplication</b> is shift-and-add (it looks like an AND gate: anything times 0 is 0,
			so only the 1-rows survive). <b>Division</b> is long division in base 2.
		</p>

		<div class="worked">
			<span class="tag">worked example &middot; his board numbers</span>
			<p>Multiply 15 &times; 15 as 8-bit numbers (0000 1111 &times; 0000 1111).</p>
			<div class="step"><div class="n">1</div><div class="body">Only the four 1-bits produce rows; each is the multiplicand shifted one more place left.</div></div>
			<div class="step"><div class="n">2</div><div class="body">Four shifted rows: 1111, 11110, 111100, 1111000.</div></div>
			<div class="step"><div class="n">3</div><div class="body">Add them with the binary-addition rules from Lesson 1.</div></div>
			<div class="ans">result <b>11100001</b> = <b>225</b> (= 15&sup2;). He noted you can always check on a calculator, but must show each shift in the exam.</div>
		</div>

		<div class="callout c-trap">
			<span class="lab">common trap &middot; bit width</span>
			When a question says "as an 8-bit number", pad the value with zeros <b>on the most-significant side</b>
			first (15 &rarr; 0000 1111). Forgetting the width is where marks go missing.
		</div>
	</section>

	<!-- ================= LESSON 3 ================= -->
	<section class="lesson" id="l3">
		<div class="lesson-h">Lesson 3</div>
		<div class="lesson-title">Representing negative numbers</div>
		<div class="lesson-date">03-06 November &middot; signed magnitude, first &amp; second complement</div>

		<p>
			Three ways to write a negative in binary, and you must <b>state which one you are using</b> or the
			reader cannot tell your &minus;39 from some positive number.
		</p>

		<div class="callout c-text">
			<span class="lab">the three systems</span>
			<b>Signed magnitude:</b> the most significant bit is the sign (0 = positive, 1 = negative), the rest is
			the size. <b>First complement:</b> invert every bit (1&rarr;0, 0&rarr;1). <b>Second (two's) complement:</b>
			first complement, then add 1 to the least significant bit. Computers use <b>two's complement</b> almost
			everywhere.
		</div>

		<div class="formula">first complement = <Sym def="invert every bit: 1 becomes 0, 0 becomes 1">NOT(x)</Sym> &nbsp;|&nbsp; second complement = NOT(x) + 1 &nbsp;|&nbsp; range = <Sym def="largest positive 8-bit value">+2&#8311;&minus;1</Sym> to <Sym def="most negative 8-bit value - one extra on the negative side">&minus;2&#8311;</Sym></div>

		<h3>Drag a value - watch the complement build</h3>
		<p>His &minus;39 example is the default. Drag into the negatives and the three steps appear:</p>

		<TwosComplement />

		<div class="callout c-intuit">
			<span class="lab">intuition &middot; why two's complement wins</span>
			For a positive number, its two's complement <b>is</b> its plain binary - nothing changes. For a
			negative, the pattern is built so that adding it to a positive just <i>works</i> on the same adder
			hardware. One representation of zero, and the widest range for the bits - that is why it beats signed
			magnitude and first complement.
		</div>
	</section>

	<!-- ================= LESSON 4 ================= -->
	<section class="lesson" id="l4">
		<div class="lesson-h">Lesson 4</div>
		<div class="lesson-title">Subtraction by addition, and hex</div>
		<div class="lesson-date">03-06 November &middot; two's-complement subtraction, hexadecimal addition</div>

		<p>
			The payoff: a computer never needs a subtractor. To do <b>a &minus; b</b>, take the two's complement
			of b and <b>add</b>. Any carry past the bit width is the <b>overflow</b> - throw it away.
		</p>

		<div class="worked">
			<span class="tag">worked example &middot; his board numbers</span>
			<p>18 &minus; 7 as 8-bit two's complement.</p>
			<div class="step"><div class="n">1</div><div class="body">18 = 0001 0010; 7 = 0000 0111.</div></div>
			<div class="step"><div class="n">2</div><div class="body">Two's complement of 7: invert &rarr; 1111 1000, +1 &rarr; 1111 1001 (= &minus;7).</div></div>
			<div class="step"><div class="n">3</div><div class="body">Add: 0001 0010 + 1111 1001 = 1 0000 1011.</div></div>
			<div class="step"><div class="n">4</div><div class="body">Drop the 9th-bit overflow (we are in 8 bits).</div></div>
			<div class="ans">result <b>0000 1011</b> = <b>11</b> = 18 &minus; 7. He ran 21 &minus; 13 the same way &rarr; 0000 1000 = <b>8</b>.</div>
		</div>

		<div class="worked">
			<span class="tag">worked example &middot; hex addition, his shortcut</span>
			<p>23&#8321;&#8326; + 16&#8321;&#8326;. Add column by column; if a column is awkward, drop to base 10 and convert back.</p>
			<div class="step"><div class="n">1</div><div class="body">Right column: 3 + 6 = 9.</div></div>
			<div class="step"><div class="n">2</div><div class="body">Left column: 2 + 1 = 3.</div></div>
			<div class="ans">result <b>39&#8321;&#8326;</b>. His stretch task D&#8321;&#8326; + AC&#8321;&#8326;: 13 + 172 = 185 = <b>B9&#8321;&#8326;</b> (carry the letters via base 10).</div>
		</div>
	</section>

	<!-- ================= LESSON 5 ================= -->
	<section class="lesson" id="l5">
		<div class="lesson-h">Lesson 5</div>
		<div class="lesson-title">Timing diagrams, serial vs parallel &amp; combinational logic</div>
		<div class="lesson-date">06 November &middot; pulses, bit time, the one rule of combinational logic</div>

		<p>
			A <b>timing diagram</b> draws a signal as it changes over time: a <b>rising (leading) edge</b> from
			low to high, a <b>falling (trailing) edge</b> from high to low. The ideal pulse is a clean square;
			a real one ramps up and down (you meet this again in the signals module).
		</p>

		<figure>
			<span class="figtag">figure 5.1 &middot; ideal vs real pulse, and edges</span>
			<svg viewBox="0 0 520 180" class="svgtext" aria-label="timing diagram pulse">
				<line x1="30" y1="150" x2="500" y2="150" stroke="#201d18" stroke-width="1.2" />
				<text x="40" y="168" font-size="11" fill="#6a645a">time &rarr;</text>
				<!-- ideal pulse -->
				<text x="60" y="26" font-size="12" fill="#0e6b63">ideal</text>
				<polyline points="40,120 110,120 110,50 200,50 200,120 250,120" fill="none" stroke="#0e6b63" stroke-width="2.4" />
				<text x="86" y="44" font-size="10" fill="#9a3b2e">rising</text>
				<text x="176" y="44" font-size="10" fill="#9a3b2e">falling</text>
				<line x1="110" y1="50" x2="110" y2="120" stroke="#9a3b2e" stroke-width="1" stroke-dasharray="2 2" />
				<line x1="200" y1="50" x2="200" y2="120" stroke="#9a3b2e" stroke-width="1" stroke-dasharray="2 2" />
				<!-- real pulse -->
				<text x="300" y="26" font-size="12" fill="#b5631f">real</text>
				<path d="M300 120 Q 330 120 350 54 Q 360 50 370 50 L 430 50 Q 445 50 455 116 Q 460 120 470 120 L 490 120" fill="none" stroke="#b5631f" stroke-width="2.4" />
				<text x="36" y="55" font-size="10" fill="#6a645a">1</text>
				<text x="36" y="125" font-size="10" fill="#6a645a">0</text>
			</svg>
			<figcaption>Both carry the same bits; the real pulse just takes finite time to rise and fall. "Bit time" is how long the signal holds one value - the clock sets it.</figcaption>
		</figure>

		<div class="callout c-text">
			<span class="lab">serial vs parallel</span>
			<b>Serial</b> sends one bit at a time down a single line - bits spread across time 0 to 7.
			<b>Parallel</b> sends every bit at once on separate lines, so a whole byte lands in one bit-time.
			Parallel is faster; serial needs fewer wires. Getting your ID number through D / JK flip-flops in the
			coursework is exactly this - you clock the pattern (e.g. 0001) in bit by bit.
		</div>

		<div class="callout c-intuit">
			<span class="lab">the one rule of combinational logic</span>
			<b>Input directly translates to output</b>, in the same bit-time, through the gate. No memory, no delay
			to reason about: read the inputs at each bit, apply the gate (AND high only when both high, OR high when
			either, XOR high when they differ, XNOR high when they match), write the output in the same column. The
			clock is assumed inside the bit - sequential logic (week 8) is where the clock and memory start to matter.
		</div>

		<figure>
			<span class="figtag">figure 5.2 &middot; AND gate on a timing diagram</span>
			<svg viewBox="0 0 460 210" class="svgtext" aria-label="and gate timing diagram">
				<!-- A -->
				<text x="10" y="40" font-size="12" fill="#0e6b63">A</text>
				<polyline points="30,50 90,50 90,20 210,20 210,50 330,50 330,20 390,20 390,50 430,50" fill="none" stroke="#0e6b63" stroke-width="2" />
				<!-- B -->
				<text x="10" y="110" font-size="12" fill="#b5631f">B</text>
				<polyline points="30,120 150,120 150,90 270,90 270,120 390,120 390,90 430,90" fill="none" stroke="#b5631f" stroke-width="2" />
				<!-- C = A AND B -->
				<text x="10" y="180" font-size="12" fill="#9a3b2e">C = A&middot;B</text>
				<polyline points="30,190 150,190 150,160 210,160 210,190 330,190 330,160 390,160 390,190 430,190" fill="none" stroke="#9a3b2e" stroke-width="2.2" />
				<line x1="90" y1="14" x2="90" y2="196" stroke="#e2dccf" stroke-width="1" />
				<line x1="150" y1="14" x2="150" y2="196" stroke="#e2dccf" stroke-width="1" />
				<line x1="210" y1="14" x2="210" y2="196" stroke="#e2dccf" stroke-width="1" />
				<line x1="270" y1="14" x2="270" y2="196" stroke="#e2dccf" stroke-width="1" />
				<line x1="330" y1="14" x2="330" y2="196" stroke="#e2dccf" stroke-width="1" />
			</svg>
			<figcaption>C is high only in the bit-times where A and B are both high - the AND truth table read straight off the two input traces.</figcaption>
		</figure>
	</section>

	<!-- ================= REFERENCE ================= -->
	<section class="lesson" id="ref">
		<div class="lesson-h">Appendix</div>
		<div class="lesson-title">Reference</div>
		<table class="ref" style="margin-top:18px"><tbody>
			<tr><th>topic</th><th>rule</th><th>book</th></tr>
			<tr><td>Binary add</td><td>1 + 1 = 10 (sum 0, carry 1)</td><td>Floyd ch.2</td></tr>
			<tr><td>First complement</td><td>invert every bit</td><td>Floyd ch.2</td></tr>
			<tr><td>Second (two's) complement</td><td>invert, then + 1</td><td>Floyd ch.2</td></tr>
			<tr><td>Signed magnitude</td><td>MSB = sign bit</td><td>Floyd ch.2</td></tr>
			<tr><td>8-bit range</td><td>&minus;128 to +127</td><td>Floyd ch.2</td></tr>
			<tr><td>Subtraction</td><td>a + two's-complement(b), drop overflow</td><td>Floyd ch.2</td></tr>
			<tr><td>Multiplication</td><td>shift-and-add the 1-rows</td><td>Floyd ch.6</td></tr>
			<tr><td>Combinational logic</td><td>output = gate(input), same bit-time</td><td>Floyd ch.3-5</td></tr>
		</tbody></table>
		<p class="muted" style="font-size:13px;font-family:Inter,sans-serif;margin-top:24px">
			Lecture content from the WSA033 Digital Systems Panopto recordings (3 &amp; 6 November 2026);
			worked-example numbers transcribed from the board. Textbook references to Floyd, Digital Fundamentals
			11e, by the chapters the lecturer set (2 and 6). Diagrams are original schematic study aids.
		</p>
	</section>
</main>
