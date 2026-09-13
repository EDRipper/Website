// The facts about Euan, in one place. The homepage renders these, and the same
// data feeds the markdown views, llms.txt and the JSON-LD, so a person, a search
// engine and an AI agent all get the same story. Edit here, not in the page.

export const SITE_URL = 'https://www.euans.life';
export const absolute = (path: string) => new URL(path, SITE_URL).href;

export const profile = {
	name: 'Euan Ripper',
	givenName: 'Euan',
	familyName: 'Ripper',
	email: 'euanripper2@gmail.com',
	image: { src: '/images/euan.jpg', width: 866, height: 621, alt: 'Photo of Euan Ripper at dusk above a beach' },
	location: 'Vermont, USA',
	hometown: 'rural England',
	tagline: "I'm an outdoorsy nerd, I like circus arts, robotics, and organising events for creatives",
	summary:
		'Euan Ripper is a maker from rural England. As a Hack Club fellow he spent a year in America building programs and running hackathons that got teenagers coding, and he is heading home to study Mechatronics and Robotics Engineering at Loughborough.',
	studies: 'Mechatronics and Robotics Engineering at Loughborough (starting soon)',
	interests: ['robotics', 'mechatronics', 'circus arts', 'unicycling', 'ultrarunning', 'hiking', 'hackathons', 'technical education', 'maths and art'],
	affiliation: { name: 'Hack Club', url: 'https://hackclub.com' },
	socials: [
		{ name: 'GitHub', url: 'https://github.com/edRipper', note: 'code and projects' },
		{ name: 'LinkedIn', url: 'https://www.linkedin.com/in/euan-ripper-ab876528b/', note: 'work and experience' },
		{ name: 'Instagram', url: 'https://www.instagram.com/euanripper/', note: 'photos and life' }
	]
};

export const funFacts =
	"I can ride a unicycle (and do tricks), I've run ultramarathons, and I've addressed the floor at the European Parliament!";

// Favorite songs (linked to a Spotify search); visitors can suggest one back.
// `start`: seconds into the 30s preview clip where the snippet begins.
export type Song = { title: string; artist: string; start?: number };
export const songs: Song[] = [
	{ title: 'Creature (w/ Orchestra)', artist: 'half·alive', start: 17 },
	{ title: 'Nobody', artist: 'Hozier' },
	{ title: 'Ankles', artist: 'Lucy Dacus' },
	{ title: 'Banana Pancakes', artist: 'Jack Johnson' },
	{ title: 'Fade Into You', artist: 'Mazzy Star' },
	{ title: 'Angry Young Man', artist: 'Billy Joel' },
	{ title: 'First Love / Late Spring', artist: 'Mitski' },
	{ title: 'Vampire Empire', artist: 'Big Thief' }
];

// Tools in the "inventory". Most logos come from the Simple Icons CDN (by
// slug); a couple use self-hosted full-colour SVGs via `src`.
export type Tool = { name: string; slug?: string; src?: string };
export const inventory: Tool[] = [
	{ name: 'Svelte', slug: 'svelte' },
	{ name: 'PostgreSQL', slug: 'postgresql' },
	{ name: 'Airtable', src: '/images/airtable.svg' },
	{ name: 'Python', src: '/images/python.svg' },
	{ name: 'JavaScript', slug: 'javascript' },
	{ name: 'Metabase', slug: 'metabase' },
	{ name: 'NestJS', slug: 'nestjs' },
	{ name: 'Fusion 360', src: '/images/fusion360.svg' }
];

export const story = [
	`Started programming at 16 to automate my very boring warehouse job, and got hooked on the intersection of maths and art — using code as a tool to explore it. I quickly realised that no community of makers existed in my area of rural England, so I started one. I taught a class, won a competition and was offered a $50,000 fellowship with Hack Club. At 18, I moved to America to build the future of technical education for teens.`,
	`Over that year in America I ran hackathons with the creators that first showed me coding, travelled all across America and Europe to mentor at events, and got teens to program for 10,000 hours — tracked using Hackatime.`,
	`Now I have flown the other way. Home to England to study Robotics and Mechatronic Engineering at Lboro Uni. We are yet to see where that will go...`
];

// `published`: set once the /blog write-up really exists. Until then the post
// page is a placeholder, kept out of search indexes and the sitemap.
export type Status = 'COMPLETE' | 'IN PROGRESS';
export type Mission = {
	name: string;
	status: Status | 'OPEN';
	brief: string;
	href?: string;
	image?: string;
	contain?: boolean;
	published?: boolean;
};

export const missions: Mission[] = [
	{
		name: 'Hack Club Fellowship',
		status: 'COMPLETE',
		brief:
			'Move across the world at 18 to spend a year scaling the mission of Hack Club — building programs and running events that inspire thousands of teens to learn coding.',
		href: '/blog/hack-club-fellowship',
		image: '/images/fellowship.png'
	},
	{
		name: 'StrandBeest',
		status: 'IN PROGRESS',
		brief:
			'Design, manufacture and build a mechanical walking sculpture, and meet the inspiration Theo Jansen.',
		href: '/blog/strandbeest',
		image: '/images/strandbeest.png'
	},
	{
		name: 'Beest Hackathon',
		status: 'IN PROGRESS',
		brief:
			'Convince 30 teens to fly to the Netherlands to watch the StrandBeest exhibition.',
		href: '/blog/beest-hackathon',
		image: '/images/beest-hackathon.png'
	},
	{
		name: 'You Ship, We Ship',
		status: 'IN PROGRESS',
		brief:
			'Create and execute programs that reward teens for building personal projects. Goal: 10,000 hours of tracked learning.',
		href: '/blog/you-ship-we-ship',
		image: '/images/you-ship-we-ship.png'
	},
	{
		name: 'Flagship Hackathon',
		status: 'COMPLETE',
		brief:
			'Get 10 of the biggest technical YouTubers together for a game jam in LA.',
		href: '/blog/flagship-hackathon',
		image: '/images/flagship-hackathon.png'
	},
	{
		name: 'Stickers',
		status: 'IN PROGRESS',
		brief:
			'Build a platform to track historical sticker designs by Hack Club — starting as an internal tool and becoming a full-fledged distribution platform.',
		href: '/blog/stickers',
		image: '/images/sticker.png',
		contain: true
	},
	{
		name: 'Create a coding club, win a competition!',
		status: 'COMPLETE',
		brief:
			'Start teaching kids coding from 0 — raise your own budget, beat the well-funded schools.',
		href: '/blog/coding-club',
		image: '/images/coding-club.png'
	},
	{
		name: 'New Mission',
		status: 'OPEN',
		brief: 'Want to work on another mission with me? Reach out with your pitch — euanripper2@gmail.com',
		href: 'mailto:euanripper2@gmail.com'
	}
];

export type Sidequest = { name: string; href: string; brief?: string; image?: string; published?: boolean };

export const sidequests: Sidequest[] = [
	{
		name: 'Learn to unicycle',
		brief:
			'Over lockdown you find yourself with a lot of time, a lot of boredom, and a rusty old unicycle in the back of a shed...',
		href: '/blog/learn-to-unicycle',
		image: '/images/unicycle.png'
	},
	{
		name: 'Hike 55 miles with the British Army',
		brief:
			"Over 3 years, take on progressively harder hikes, culminating in leading a team of 6 across 55 miles through 10 checkpoints for the army's Ten Tors challenge.",
		href: '/blog/hike-55-miles-british-army',
		image: '/images/hike-army.jpg'
	},
	{
		name: 'Attend Hackathons',
		brief:
			'I love being in a technical community, and the best way to meet people is at hackathons — fortunately my work runs a lot of them!',
		href: '/blog/attend-hackathons',
		image: '/images/headshot.png'
	},
	{
		name: 'Run an ultramarathon',
		brief:
			"Go from couch potato to ultramarathon runner — run across a national park to complete the quest. Time doesn't matter, finishing matters!",
		href: '/blog/run-an-ultramarathon',
		image: '/images/ultramarathon.webp'
	},
	{
		name: 'Learn how differential equations govern the spots and stripes on fish.',
		brief:
			'Build a visualisation of Turing\'s "The chemical basis of morphogenesis" paper using Python to simulate why some animals get spots and others stripes.',
		href: '/blog/turing-patterns',
		image: '/images/fish.png'
	},
	{
		name: 'Speak at the European Parliament in Strasbourg',
		brief: 'Convince the European Parliament to let your school visit, even after Brexit...',
		href: '/blog/european-parliament',
		image: '/images/european-parliament.webp'
	}
];

// Every /blog/<slug> page, derived from the missions and sidequests that link to one.
export type Post = {
	slug: string;
	title: string;
	brief: string;
	kind: 'Mission' | 'Sidequest';
	status: Status;
	published: boolean;
};

const BLOG = '/blog/';
export const posts: Post[] = [
	...missions.flatMap((m): Post[] =>
		m.href?.startsWith(BLOG) && m.status !== 'OPEN'
			? [{ slug: m.href.slice(BLOG.length), title: m.name, brief: m.brief, kind: 'Mission', status: m.status, published: !!m.published }]
			: []
	),
	...sidequests.flatMap((q): Post[] =>
		q.href.startsWith(BLOG)
			? [{ slug: q.href.slice(BLOG.length), title: q.name, brief: q.brief ?? '', kind: 'Sidequest', status: 'COMPLETE', published: !!q.published }]
			: []
	)
];

export const findPost = (slug: string) => posts.find((p) => p.slug === slug);
