// Composite N angled books into a stack with correct occlusion: each higher book
// is drawn last, and its whole silhouette (outline + interior) overwrites the
// books beneath, so the book above hides the back face of the one below.
const BOOK = [
	'        _.-"\\',
	'    _.-"     \\',
	' ,-"          \\',
	'( \\            \\',
	' \\ \\            \\',
	'  \\ \\            \\',
	'   \\ \\         _.-;',
	'    \\ \\    _.-"   :',
	'     \\ \\,-"    _.-"',
	'      \\(   _.-"   ',
	'       `--"'
];

const DX = Number(process.argv[2] ?? 5); // horizontal shift per book
const DY = Number(process.argv[3] ?? 3); // vertical shift per book
const N = Number(process.argv[4] ?? 3); // book count

const bookH = BOOK.length;
const bookW = Math.max(...BOOK.map((l) => l.length));
// Per-row silhouette span (first..last non-space) — interior counts as opaque.
const span = BOOK.map((l) => {
	const s = l.search(/\S/);
	if (s < 0) return null;
	let e = l.length - 1;
	while (e >= 0 && l[e] === ' ') e--;
	return [s, e];
});

const H = bookH + (N - 1) * DY;
const W = bookW + (N - 1) * DX;
const grid = Array.from({ length: H }, () => Array(W).fill(' '));
const anchors = []; // title row per book (its exposed front edge)

// j = 0 is the TOP book; draw bottom→top so the top occludes.
for (let j = N - 1; j >= 0; j--) {
	const rowOff = j * DY;
	const colOff = j * DX;
	for (let r = 0; r < bookH; r++) {
		if (!span[r]) continue;
		const [s, e] = span[r];
		for (let c = s; c <= e; c++) {
			grid[rowOff + r][colOff + c] = BOOK[r][c];
		}
	}
	anchors[j] = rowOff + bookH - 3; // beside the page edge
}

const art = grid.map((row) => row.join('').replace(/\s+$/, '')).join('\n');
console.log(art);
console.log('\nanchors(rows):', anchors.join(','), '| size', W, 'x', H);
