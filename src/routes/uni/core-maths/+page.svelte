<script lang="ts">
	import MatrixInverse2x2 from '$lib/uni/MatrixInverse2x2.svelte';
	import Sym from '$lib/uni/Sym.svelte';
	import LectureClip from '$lib/uni/LectureClip.svelte';
	// Panopto sessions these lessons are built from.
	const LEC_MATRICES = 'f9d16b69-f172-43f4-8363-b4f60189746d'; // 03 Nov lecture
	const LEC_SEMINAR = '2e5118c1-6547-4857-9f97-b4f8018aef21'; // 05 Nov exam-review seminar
</script>

<svelte:head><title>MAA401 Core Mathematics - study notes</title></svelte:head>

<main class="m-wrap">
	<p class="m-kicker">MAA401 &middot; Core Mathematics</p>
	<h1>Matrices, determinants &amp; the differentiation toolkit</h1>
	<p class="lede">
		The linear-algebra block (matrix multiplication through to solving simultaneous equations by
		inversion), plus the differentiation and vector rules he revised for the online test. His worked
		steps in full, with a 2x2 inverse calculator you can type into.
	</p>

	<nav class="toc">
		<a href="#l1">1 &middot; matrix multiplication</a>
		<a href="#l2">2 &middot; identity &amp; 2x2 inverse</a>
		<a href="#l3">3 &middot; 3x3 determinants</a>
		<a href="#l4">4 &middot; solving equations</a>
		<a href="#l5">5 &middot; differentiation &amp; vectors</a>
		<a href="#ref">reference</a>
	</nav>

	<!-- ================= LESSON 1 ================= -->
	<section class="lesson" id="l1">
		<div class="lesson-h">Lesson 1</div>
		<div class="lesson-title">Matrix operations &amp; multiplication</div>
		<div class="lesson-date">03 November &middot; add, scale, multiply, transpose</div>
		<LectureClip id={LEC_MATRICES} start={0} label="matrices &amp; multiplication" />

		<p>
			Addition, subtraction and scalar multiplication are entry-by-entry and need matching shapes.
			Multiplication is the one that trips people, so he gave the <b>ice-cream analogy</b>: run each
			<b>row</b> of the first along each <b>column</b> of the second, multiplying pairs and adding.
		</p>

		<div class="callout c-text">
			<span class="lab">the compatibility rule</span>
			A times B exists only when the number of <b>columns of A</b> equals the number of <b>rows of B</b>.
			The outer dimensions give the answer's size: an (m&times;n)(n&times;p) product is m&times;p. And order
			matters - <b>AB &ne; BA</b> in general, matrix multiplication is not commutative.
		</div>

		<div class="formula">(<Sym def="the product matrix">AB</Sym>)&#7522;&#11388; = <Sym def="sum over k: row i of A against column j of B">&Sigma;&#8342;</Sym> <Sym def="entry in row i, column k of A">A&#7522;&#8342;</Sym> <Sym def="entry in row k, column j of B">B&#8342;&#11388;</Sym> &nbsp;&nbsp;|&nbsp;&nbsp; (m&times;n)(n&times;p) &rarr; m&times;p &nbsp;&nbsp;|&nbsp;&nbsp; <Sym def="transpose: swap rows and columns">A&#7488;</Sym></div>

		<div class="worked">
			<span class="tag">worked example &middot; his board numbers</span>
			<p>The identity times a matrix leaves it unchanged - his demonstration of why the identity earns its name.</p>
			<div class="step"><div class="n">1</div><div class="body">I &middot; A with I = [[1,0],[0,1]], A = [[2,1],[&minus;5,3]].</div></div>
			<div class="step"><div class="n">2</div><div class="body">Top-left: 1&times;2 + 0&times;(&minus;5) = 2. Top-right: 1&times;1 + 0&times;3 = 1.</div></div>
			<div class="step"><div class="n">3</div><div class="body">Bottom-left: 0&times;2 + 1&times;(&minus;5) = &minus;5. Bottom-right: 0&times;1 + 1&times;3 = 3.</div></div>
			<div class="ans">result <b>[[2,1],[&minus;5,3]]</b> - exactly A back again. The identity is the matrix version of multiplying by 1.</div>
		</div>
	</section>

	<!-- ================= LESSON 2 ================= -->
	<section class="lesson" id="l2">
		<div class="lesson-h">Lesson 2</div>
		<div class="lesson-title">The identity &amp; the 2x2 inverse</div>
		<div class="lesson-date">03 November &middot; determinant, inverse, singular matrices</div>
		<LectureClip id={LEC_MATRICES} start={1545} label="identity matrix" />
		<LectureClip id={LEC_MATRICES} start={2045} label="the inverse" />

		<p>
			Just as a number has a reciprocal that multiplies back to 1, a matrix can have an
			<b>inverse</b> that multiplies back to the identity. For a 2x2 there is a one-line formula, and
			the quantity <b>ad &minus; bc</b> decides whether it exists at all.
		</p>

		<div class="formula">For A = [[a,b],[c,d]]: &nbsp; <Sym def="determinant - decides if the inverse exists">det A</Sym> = <Sym def="the a-d diagonal product minus the b-c diagonal product">ad &minus; bc</Sym> &nbsp;&nbsp;|&nbsp;&nbsp; <Sym def="the inverse matrix - undoes A, giving the identity">A&#8315;&sup1;</Sym> = (1/det A)&middot;[[d, &minus;b],[&minus;c, a]]</div>

		<div class="callout c-intuit">
			<span class="lab">intuition &middot; why it is called the determinant</span>
			The formula divides by ad &minus; bc. When ad &minus; bc = 0 you are dividing by zero, so the inverse
			<b>does not exist</b> - the matrix is <b>singular</b>. That single number <i>determines</i> whether
			the matrix can be undone, which is exactly where the name comes from.
		</div>

		<h3>Type a matrix - watch the determinant decide</h3>
		<p>His [[2,1],[&minus;5,3]] is the default. Change the entries and see the inverse build, or collapse when the determinant hits 0:</p>

		<MatrixInverse2x2 />
	</section>

	<!-- ================= LESSON 3 ================= -->
	<section class="lesson" id="l3">
		<div class="lesson-h">Lesson 3</div>
		<div class="lesson-title">3x3 determinants: minors &amp; cofactors</div>
		<div class="lesson-date">03 November &middot; the general method, expanding strategically</div>
		<LectureClip id={LEC_MATRICES} start={3063} label="3x3 method" />
		<LectureClip id={LEC_MATRICES} start={3888} label="minors &amp; cofactors" />

		<p>
			Beyond 2x2 there is no shortcut formula, so he introduced the systematic method that generalises
			to any size: <b>minors</b> and <b>cofactors</b>.
		</p>

		<div class="callout c-text">
			<span class="lab">the method</span>
			The <b>minor</b> of an entry is the determinant of the 2x2 left when you delete that entry's row and
			column. Its <b>cofactor</b> is the minor with a sign from the checkerboard pattern
			(+ &minus; + / &minus; + &minus; / + &minus; +). Expand along any row or column: multiply each entry
			by its cofactor and add. His tactic: <b>expand along the row or column with the most zeros</b>, since
			a zero entry kills its whole term and saves you a 2x2.
		</div>

		<div class="formula">det A = <Sym def="sum along a chosen row/column">&Sigma;</Sym> <Sym def="an entry of that row/column">a&#7522;&#11388;</Sym> <Sym def="its cofactor: signed minor">C&#7522;&#11388;</Sym>, &nbsp; <Sym def="cofactor = checkerboard sign times the minor">C&#7522;&#11388;</Sym> = (&minus;1)&#7522;&#8314;&#11388; <Sym def="minor: determinant of the 2x2 left after deleting row i, column j">M&#7522;&#11388;</Sym></div>

		<div class="callout c-intuit">
			<span class="lab">why only up to 3x3</span>
			He noted he stops at 3x3 not because bigger is too hard but because the method is identical - a 4x4
			just expands into 3x3s, which expand into 2x2s. 3x3 matters because we live in 3D, so they turn up
			everywhere in engineering.
		</div>
	</section>

	<!-- ================= LESSON 4 ================= -->
	<section class="lesson" id="l4">
		<div class="lesson-h">Lesson 4</div>
		<div class="lesson-title">Solving simultaneous equations by inversion</div>
		<div class="lesson-date">03 November &middot; the payoff for all the matrix machinery</div>
		<LectureClip id={LEC_MATRICES} start={5975} label="solving equations" />

		<p>
			The reason for all of it: a system of linear equations is a single matrix equation
			<b>Ax = b</b>, and once you can invert A you solve the whole system in one step.
		</p>

		<div class="formula"><Sym def="coefficient matrix - the numbers multiplying the unknowns">A</Sym><Sym def="column of unknowns">x</Sym> = <Sym def="column of right-hand-side constants">b</Sym> &nbsp;&rarr;&nbsp; x = <Sym def="inverse of the coefficient matrix">A&#8315;&sup1;</Sym>b</div>

		<div class="callout c-intuit">
			<span class="lab">intuition</span>
			It mirrors solving 5x = 10 by multiplying both sides by 1/5. Here you multiply both sides by
			A&#8315;&sup1;: A&#8315;&sup1;Ax = A&#8315;&sup1;b, and A&#8315;&sup1;A is the identity, so x = A&#8315;&sup1;b.
			If A is singular (determinant 0) the system has no unique solution - the algebra and the geometry agree.
		</div>
	</section>

	<!-- ================= LESSON 5 ================= -->
	<section class="lesson" id="l5">
		<div class="lesson-h">Lesson 5</div>
		<div class="lesson-title">Differentiation &amp; vectors (exam review)</div>
		<div class="lesson-date">05 November &middot; chain, product, quotient rules; perpendicular vectors</div>
		<LectureClip id={LEC_SEMINAR} start={42} label="chain rule" />
		<LectureClip id={LEC_SEMINAR} start={395} label="quotient rule" />
		<LectureClip id={LEC_SEMINAR} start={1175} label="product rule" />
		<LectureClip id={LEC_SEMINAR} start={2332} label="dot product" />

		<p>
			The seminar before the online test (12% of the module, ~40 min, 6-8 questions) revised the three
			differentiation rules and the two ways to find a perpendicular vector.
		</p>

		<div class="formula"><Sym def="chain rule: differentiate the outside, times the derivative of the inside">chain</Sym>: (f(g))&prime; = f&prime;(g)&middot;g&prime; &nbsp;|&nbsp; <Sym def="product rule: derivative of a product of two functions">product</Sym>: (uv)&prime; = u&prime;v + uv&prime; &nbsp;|&nbsp; <Sym def="quotient rule: derivative of one function over another">quotient</Sym>: (u/v)&prime; = (u&prime;v &minus; uv&prime;)/v&sup2;</div>

		<div class="callout c-intuit">
			<span class="lab">his two reminders</span>
			The <b>product and quotient rules reach the same answer</b> on a fraction - rewrite u/v as u&middot;v&#8315;&sup1;
			and the product rule works too, so use whichever you trust. For a vector <b>perpendicular</b> to others,
			the <b>dot product</b> method (set a&middot;x = 0) is the one that generalises to any number of dimensions,
			whereas the cross product is a 3D-only trick.
		</div>
	</section>

	<!-- ================= REFERENCE ================= -->
	<section class="lesson" id="ref">
		<div class="lesson-h">Appendix</div>
		<div class="lesson-title">Formula reference</div>
		<table class="ref" style="margin-top:18px"><tbody>
			<tr><th>topic</th><th>formula</th><th>note</th></tr>
			<tr><td>Matrix product</td><td>(AB)&#7522;&#11388; = &Sigma;&#8342; A&#7522;&#8342; B&#8342;&#11388;</td><td>cols A = rows B</td></tr>
			<tr><td>2x2 determinant</td><td>det A = ad &minus; bc</td><td>0 =&gt; singular</td></tr>
			<tr><td>2x2 inverse</td><td>A&#8315;&sup1; = (1/det)[[d,&minus;b],[&minus;c,a]]</td><td>swap, negate, divide</td></tr>
			<tr><td>3x3 determinant</td><td>&Sigma; a&#7522;&#11388; C&#7522;&#11388;, &nbsp; C&#7522;&#11388; = (&minus;1)&#7522;&#8314;&#11388; M&#7522;&#11388;</td><td>expand on zeros</td></tr>
			<tr><td>Linear system</td><td>Ax = b =&gt; x = A&#8315;&sup1;b</td><td>unique if det &ne; 0</td></tr>
			<tr><td>Product rule</td><td>(uv)&prime; = u&prime;v + uv&prime;</td><td>-</td></tr>
			<tr><td>Quotient rule</td><td>(u/v)&prime; = (u&prime;v &minus; uv&prime;)/v&sup2;</td><td>-</td></tr>
			<tr><td>Perpendicular vector</td><td>a&middot;x = 0</td><td>dot-product method</td></tr>
		</tbody></table>
		<p class="muted" style="font-size:13px;font-family:Inter,sans-serif;margin-top:24px">
			Lecture content from the MAA401 Core Mathematics Panopto recordings (3 Nov lecture, 5 Nov
			exam-review seminar); worked-example numbers transcribed from the board. No set textbook for this
			module, so theory is condensed from the lecturer's own notes rather than cited to a page. Each
			"watch the clip" link opens the ReVIEW recording at that timestamp (needs your Loughborough login).
			Diagrams are original schematic study aids.
		</p>
	</section>
</main>
