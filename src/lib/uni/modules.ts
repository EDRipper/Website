// Registry of university modules for the /uni study area.
// The background build loop appends to `lessons` and flips `status` to 'live'
// as each module page is written. Keep slugs stable - they are the route names.

export type Lesson = {
	title: string;
	date: string; // human date, e.g. '21 Oct'
	blurb: string;
};

export type Module = {
	slug: string; // route under /uni
	code: string; // e.g. WSA034
	title: string;
	accent: string; // card accent colour
	summary: string;
	status: 'live' | 'building';
	lessons: Lesson[];
};

export const modules: Module[] = [
	{
		slug: 'dynamic-systems',
		code: 'WSA034',
		title: 'Dynamic Systems Analysis',
		accent: '#0e6b63',
		summary: 'Statics and mechanics: moments, friction, moments of inertia, stress and strain.',
		status: 'live',
		lessons: [
			{ title: 'Moments & couples', date: '21 Oct', blurb: '3D moment vectors, the right-hand rule, composite centroids.' },
			{ title: 'Friction', date: '27 Oct', blurb: 'Dry friction laws, journal bearings, belt friction.' },
			{ title: 'Moments of inertia', date: '28 Oct', blurb: 'Second moment of area, the parallel axis theorem, composites.' },
			{ title: 'Belts & 2nd moment', date: '03 Nov', blurb: 'Capstan friction, belt-drive torque, integrating a second moment.' },
			{ title: 'Stress & strain', date: '04 Nov', blurb: 'Normal and shear stress, Young, Poisson, factors of safety.' }
		]
	},
	{
		slug: 'circuit-analysis',
		code: 'WSA030',
		title: 'Circuit Analysis',
		accent: '#b5631f',
		summary: 'Maximum power transfer, Thevenin equivalents and the power-vs-efficiency trade-off.',
		status: 'live',
		lessons: [
			{ title: 'The theorem', date: '03 Nov', blurb: 'Max power when R_L = R_th; the P = Vth squared / 4R_th peak.' },
			{ title: 'Power vs efficiency', date: '03 Nov', blurb: 'Why the matched load is only 50% efficient; power station vs antenna.' },
			{ title: 'Thevenin worked example', date: '04 Nov', blurb: 'KVL reduction to Vth = 10V, R_th = 6 ohm, peak 4.17W.' },
			{ title: 'Power as a function of R_L', date: '04 Nov', blurb: 'Voltage divider to Vth = 12V, R_th = 3.6 ohm, P(R_L) curve.' }
		]
	},
	{
		slug: 'digital-systems',
		code: 'WSA033',
		title: 'Digital Systems',
		accent: '#5a4a9e',
		summary: 'Binary arithmetic, two’s complement, hex and combinational logic timing.',
		status: 'live',
		lessons: [
			{ title: 'Binary addition', date: '03 Nov', blurb: 'The four rules, carries, the half/full-adder link; 3 + 3 = 6.' },
			{ title: 'Subtract, multiply, divide', date: '03 Nov', blurb: 'Borrowing, shift-and-add (15 x 15), long division in base 2.' },
			{ title: 'Negative numbers', date: '03-06 Nov', blurb: 'Signed magnitude, first & second complement; a draggable explorer.' },
			{ title: 'Subtraction by addition + hex', date: '03-06 Nov', blurb: 'Two’s-complement subtraction (18 - 7), overflow, hex addition.' },
			{ title: 'Timing diagrams & logic', date: '06 Nov', blurb: 'Pulses, bit time, serial vs parallel, the one rule of combinational logic.' }
		]
	},
	{
		slug: 'programming',
		code: 'WSA032',
		title: 'Programming & Software Engineering',
		accent: '#2f6d3b',
		summary: 'Python: decisions, loops, functions and writing code that survives bad input.',
		status: 'live',
		lessons: [
			{ title: 'Decisions', date: '27 Oct', blurb: 'if / elif / else, comparison & boolean operators, an interactive leap-year checker.' },
			{ title: 'Loops', date: '03 Nov', blurb: 'for vs while, avoiding infinite loops, break / continue, enumerate.' },
			{ title: 'Functions', date: '27 Oct - 03 Nov', blurb: 'Return values, tuple unpacking, default arguments, scope.' },
			{ title: 'Robust code', date: '27 Oct - 03 Nov', blurb: 'Verification against known answers, defensive programming, try / except.' },
			{ title: 'Putting it together', date: 'exercises', blurb: 'Modulo and floor division, three-digit multiples of 7.' }
		]
	},
	{
		slug: 'core-maths',
		code: 'MAA401',
		title: 'Core Mathematics',
		accent: '#9a3b2e',
		summary: 'Matrices, determinants, solving systems by inversion, and the differentiation rules.',
		status: 'live',
		lessons: [
			{ title: 'Matrix multiplication', date: '03 Nov', blurb: 'Row-by-column rule, compatibility, non-commutativity, transpose.' },
			{ title: 'Identity & 2x2 inverse', date: '03 Nov', blurb: 'det = ad - bc, the inverse formula, singular matrices; a live calculator.' },
			{ title: '3x3 determinants', date: '03 Nov', blurb: 'Minors, cofactors, the checkerboard signs, expanding on zeros.' },
			{ title: 'Solving equations', date: '03 Nov', blurb: 'Ax = b solved as x = A inverse b.' },
			{ title: 'Differentiation & vectors', date: '05 Nov', blurb: 'Chain, product, quotient rules; perpendicular vectors by dot product.' }
		]
	},
	{
		slug: 'applied-engineering',
		code: 'WSA070',
		title: 'Applied Engineering',
		accent: '#6a645a',
		summary: 'Sports engineering: impact absorption, restitution, the sweet spot and design trade-offs.',
		status: 'live',
		lessons: [
			{ title: 'Impact absorption', date: '02 Nov', blurb: 'Helmet design, foam density/thickness, single vs multiple impact, the PPE triangle.' },
			{ title: 'Coefficient of restitution', date: '19 Oct', blurb: 'Momentum transfer, energy loss, rebound = e² h - a live drop demo.' },
			{ title: 'The sweet spot', date: '19 Oct', blurb: 'Centre of mass, centre of percussion and vibration nodes - why it is an area.' },
			{ title: 'Design trade-offs', date: 'throughout', blurb: 'Flex vs stiffness, light vs durable, and conflicting stakeholder requirements.' },
			{ title: 'Testing & standards', date: 'throughout', blurb: 'Lab and player testing, and how standards drive equipment improvement.' }
		]
	}
];
