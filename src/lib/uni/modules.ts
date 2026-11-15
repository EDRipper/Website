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
		summary: 'Logic gates, Boolean algebra, Karnaugh maps, flip-flops and sequential logic.',
		status: 'building',
		lessons: []
	},
	{
		slug: 'programming',
		code: 'WSA032',
		title: 'Programming & Software Engineering',
		accent: '#2f6d3b',
		summary: 'Programming fundamentals and the software-engineering workflow.',
		status: 'building',
		lessons: []
	},
	{
		slug: 'core-maths',
		code: 'MAA401',
		title: 'Core Mathematics',
		accent: '#9a3b2e',
		summary: 'The mathematical toolkit underpinning the engineering modules.',
		status: 'building',
		lessons: []
	},
	{
		slug: 'applied-engineering',
		code: 'WSA070',
		title: 'Applied Engineering',
		accent: '#6a645a',
		summary: 'Design, build and presentation work across the engineering disciplines.',
		status: 'building',
		lessons: []
	}
];
