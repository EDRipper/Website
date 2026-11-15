<script lang="ts">
	import LeapYear from '$lib/uni/LeapYear.svelte';
	import LectureClip from '$lib/uni/LectureClip.svelte';
	// Panopto session for the 3 Nov WSA032 lecture (the 27 Oct one aged out of search).
	const LEC_03NOV = 'c9528522-26aa-4e66-b320-b4f700096e63';
</script>

<svelte:head><title>WSA032 Programming &amp; Software Engineering - study notes</title></svelte:head>

<main class="m-wrap">
	<p class="m-kicker">WSA032 &middot; Programming &amp; Software Engineering</p>
	<h1>Python: decisions, loops, functions &amp; robust code</h1>
	<p class="lede">
		The building blocks of writing code that works: choosing with if, repeating with loops, packaging
		with functions, and making it survive bad input. Worked straight from the lectures, with the
		leap-year logic as a demo you can poke.
	</p>

	<nav class="toc">
		<a href="#l1">1 &middot; decisions</a>
		<a href="#l2">2 &middot; loops</a>
		<a href="#l3">3 &middot; functions</a>
		<a href="#l4">4 &middot; robust code</a>
		<a href="#l5">5 &middot; putting it together</a>
	</nav>

	<!-- ===== LESSON 1 ===== -->
	<section class="lesson" id="l1">
		<div class="lesson-h">Lesson 1</div>
		<div class="lesson-title">Decisions: if / elif / else</div>
		<div class="lesson-date">27 October &middot; conditionals, comparison &amp; boolean operators</div>

		<p>
			A program makes a choice by testing a condition that is either True or False. The big idea from
			the lecture: take a real requirement in words and translate it into those tests. His example was
			classifying a measured time constant as too slow, perfect, or too fast against thresholds.
		</p>

		<pre class="code">tau = 0.8
if tau &gt; 1.0:
    print("too slow")
elif tau &gt;= 0.5:
    print("perfect")
else:
    print("too fast")</pre>

		<div class="callout c-intuit">
			<span class="lab">intuition &middot; order matters</span>
			elif is checked only if the ones above it were False, so put the narrowest or highest-priority
			test first. Python stops at the first branch that is True and skips the rest.
		</div>

		<h3>Comparison &amp; boolean operators</h3>
		<table class="ref"><tbody>
			<tr><th>operator</th><th>means</th><th>example True when</th></tr>
			<tr><td><code>==</code> / <code>!=</code></td><td>equal / not equal</td><td>x == 5</td></tr>
			<tr><td><code>&lt;</code> <code>&lt;=</code> <code>&gt;</code> <code>&gt;=</code></td><td>ordering</td><td>x &gt;= 0</td></tr>
			<tr><td><code>and</code></td><td>both sides True</td><td>x &gt; 0 and x &lt; 10</td></tr>
			<tr><td><code>or</code></td><td>either side True</td><td>x &lt; 0 or x &gt; 100</td></tr>
			<tr><td><code>not</code></td><td>flips True/False</td><td>not finished</td></tr>
		</tbody></table>

		<h3>Worked example: leap-year logic</h3>
		<p>
			A year is a leap year if it is divisible by 4, <b>except</b> centuries, which must be divisible by
			400. That compound rule is one boolean expression - and a perfect illustration of combining
			<code>and</code>, <code>or</code> and <code>not</code>:
		</p>
		<pre class="code">def is_leap(year):
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)</pre>
		<p>Type a year and watch each clause evaluate:</p>

		<LeapYear />
	</section>

	<!-- ===== LESSON 2 ===== -->
	<section class="lesson" id="l2">
		<div class="lesson-h">Lesson 2</div>
		<div class="lesson-title">Loops: for vs while</div>
		<div class="lesson-date">03 November &middot; iteration, break/continue, enumerate</div>
		<LectureClip id={LEC_03NOV} start={20} label="while loops" />
		<LectureClip id={LEC_03NOV} start={1822} label="while vs for" />
		<LectureClip id={LEC_03NOV} start={3318} label="break &amp; continue" />

		<div class="two">
			<div class="card-t"><h4 style="margin-top:0">for loop</h4><p style="margin:0">Use when the number of steps is <b>known</b> - iterate over a range or a list.</p></div>
			<div class="card-t"><h4 style="margin-top:0">while loop</h4><p style="margin:0">Use when you repeat <b>until a condition changes</b> and the count is not known in advance (sensor input, convergence).</p></div>
		</div>

		<pre class="code"># for: known number of points
for i in range(0, 10):
    print(i)

# while: stop when a condition flips
x = 0.0
while x &lt;= 10.0:
    print("sin:", math.sin(x))
    x += 0.1</pre>

		<div class="callout c-trap">
			<span class="lab">common trap &middot; the infinite loop</span>
			A while loop needs two things or it never ends: the test variable must be <b>initialised before</b>
			the loop, and <b>changed inside</b> it. Forget the <code>x += 0.1</code> and the condition stays
			True forever.
		</div>

		<h3>break, continue &amp; enumerate</h3>
		<p>
			<code>break</code> leaves the loop immediately; <code>continue</code> skips to the next iteration.
			He warned that leaning on them too much makes code hard to read. <code>enumerate</code> gives you
			the index and the value together via tuple unpacking:
		</p>
		<pre class="code">for i, value in enumerate(readings):
    if value &lt; 0:
        continue          # skip bad samples
    if value &gt; limit:
        break             # stop at the first overload
    print(i, value)</pre>
	</section>

	<!-- ===== LESSON 3 ===== -->
	<section class="lesson" id="l3">
		<div class="lesson-h">Lesson 3</div>
		<div class="lesson-title">Functions: package &amp; reuse</div>
		<div class="lesson-date">27 Oct - 03 Nov &middot; return values, tuple unpacking, scope</div>
		<LectureClip id={LEC_03NOV} start={3917} label="enumerate &amp; tuple unpacking" />
		<LectureClip id={LEC_03NOV} start={3062} label="variable scope" />

		<p>
			A function names a block of code so you can reuse it and test it in isolation. The lecture
			stressed returning <b>multiple</b> values at once with tuple unpacking, and keeping variable scope
			tidy.
		</p>
		<pre class="code">def stats(values):
    return min(values), max(values), sum(values) / len(values)

lo, hi, mean = stats(data)      # unpack the three returned values
print("range:", lo, "to", hi)</pre>

		<div class="callout c-intuit">
			<span class="lab">intuition &middot; scope</span>
			A variable made inside a function lives only there - it does not leak out, and the function cannot
			see your other locals unless you pass them in as arguments. Pass data in, return results out;
			don't reach around the function.
		</div>

		<h3>Default arguments</h3>
		<pre class="code">def tolerance(value, pct=5.0):      # pct defaults to 5.0 if not given
    return value * pct / 100

tolerance(200)        # uses 5.0
tolerance(200, 1.0)   # overrides to 1.0</pre>
	</section>

	<!-- ===== LESSON 4 ===== -->
	<section class="lesson" id="l4">
		<div class="lesson-h">Lesson 4</div>
		<div class="lesson-title">Robust code: verify &amp; defend</div>
		<div class="lesson-date">27 Oct - 03 Nov &middot; verification, defensive programming, try / except</div>
		<LectureClip id={LEC_03NOV} start={4537} label="try / except" />

		<div class="callout c-intuit">
			<span class="lab">verification</span>
			Test with inputs whose answer you already know. If <code>stats([1, 2, 3])</code> does not give a
			mean of 2, the bug is yours to find now, not in the exam. He pushed this as the habit that catches
			most mistakes.
		</div>

		<p>
			<b>Defensive programming</b> means anticipating the inputs that would break your code - dividing by
			zero, the square root of a negative, a string where a number was expected - and handling them
			instead of crashing. Python does this with <code>try / except</code>:
		</p>
		<pre class="code">try:
    result = a / b
except ZeroDivisionError:
    print("cannot divide by zero")
    result = None</pre>

		<div class="callout c-trap">
			<span class="lab">common trap &middot; catching too much</span>
			A bare <code>except:</code> swallows every error, including the typo you want to see. Catch the
			specific error you expect (<code>ZeroDivisionError</code>, <code>ValueError</code>) so real bugs
			still surface.
		</div>
	</section>

	<!-- ===== LESSON 5 ===== -->
	<section class="lesson" id="l5">
		<div class="lesson-h">Lesson 5</div>
		<div class="lesson-title">Putting it together</div>
		<div class="lesson-date">exercises &middot; modulo, floor division, accumulation</div>

		<p>
			Two operators show up constantly in these exercises: <code>%</code> (modulo, the remainder) and
			<code>//</code> (floor division, the whole-number quotient). "Is n a multiple of 7?" is just
			<code>n % 7 == 0</code>.
		</p>
		<div class="worked">
			<span class="tag">worked example &middot; his exercise</span>
			<p>Print every three-digit number that is a multiple of 7.</p>
			<pre class="code">for n in range(100, 1000):
    if n % 7 == 0:
        print(n)</pre>
			<div class="step"><div class="n">1</div><div class="body"><code>range(100, 1000)</code> covers every three-digit number (100 up to 999).</div></div>
			<div class="step"><div class="n">2</div><div class="body"><code>n % 7 == 0</code> is True exactly when 7 divides n with no remainder.</div></div>
			<div class="ans">prints 105, 112, 119, ... 994 - the loop + conditional + modulo combined.</div>
		</div>

		<div class="callout c-intuit">
			<span class="lab">the thread running through all five</span>
			Every program is decisions, repetition and functions stacked together. Name things clearly,
			indent to show structure, test against known answers, and defend against the input that will break
			it. That is the whole of this module in one line.
		</div>
	</section>
</main>

<style>
	pre.code {
		background: #201d18;
		color: #ece7da;
		font-family: 'JetBrains Mono', monospace;
		font-size: 13.5px;
		line-height: 1.6;
		padding: 16px 18px;
		border-radius: 12px;
		overflow-x: auto;
		margin: 16px 0;
		border: 1px solid #3a352c;
	}
	:global(.uni .m-wrap p code),
	:global(.uni .m-wrap td code) {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9em;
		background: #efe9dd;
		padding: 1px 5px;
		border-radius: 5px;
	}
</style>
