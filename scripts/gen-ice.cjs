// One-off: convert ice.png into an ASCII portrait module with the (light, icy)
// background removed via a flood-fill from the borders. Outputs src/lib/ice-ascii.ts.
const fs = require('fs');
const { PNG } = require('pngjs');

const SRC = 'C:/Users/Euan Ripper/OneDrive/Pictures/Screenshots/ice.png';
const COLS = 160;
const ROWS = 65;
// Light → dark density ramp (space is "no ink").
const RAMP = ' .,:;-~=+ox*csaeOQ0Zmwqpdbkh#MW8B@';

const png = PNG.sync.read(fs.readFileSync(SRC));
const { width: W, height: H, data } = png;
const lum = (i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

// ── Background removal: flood fill from the border over "light" pixels. ──
const bg = new Uint8Array(W * H); // 1 = background
const stack = [];
const pushIf = (x, y) => {
	if (x < 0 || y < 0 || x >= W || y >= H) return;
	const p = y * W + x;
	if (bg[p]) return;
	if (lum(p * 4) > 132) {
		bg[p] = 1;
		stack.push(p);
	}
};
for (let x = 0; x < W; x++) {
	pushIf(x, 0);
	pushIf(x, H - 1);
}
for (let y = 0; y < H; y++) {
	pushIf(0, y);
	pushIf(W - 1, y);
}
while (stack.length) {
	const p = stack.pop();
	const x = p % W,
		y = (p / W) | 0;
	pushIf(x + 1, y);
	pushIf(x - 1, y);
	pushIf(x, y + 1);
	pushIf(x, y - 1);
}

// ── Downsample into the character grid. ──
let chars = '';
const rgb = Buffer.alloc(COLS * ROWS * 3);
let ci = 0;
for (let r = 0; r < ROWS; r++) {
	const y0 = Math.floor((r * H) / ROWS),
		y1 = Math.max(y0 + 1, Math.floor(((r + 1) * H) / ROWS));
	for (let c = 0; c < COLS; c++, ci++) {
		const x0 = Math.floor((c * W) / COLS),
			x1 = Math.max(x0 + 1, Math.floor(((c + 1) * W) / COLS));
		let rr = 0,
			gg = 0,
			bb = 0,
			n = 0,
			tot = 0;
		for (let y = y0; y < y1; y++) {
			for (let x = x0; x < x1; x++, tot++) {
				const p = y * W + x;
				if (bg[p]) continue;
				const i = p * 4;
				rr += data[i];
				gg += data[i + 1];
				bb += data[i + 2];
				n++;
			}
		}
		// Mostly background → transparent cell (no ink, no colour).
		if (n / Math.max(1, tot) < 0.45) {
			chars += ' ';
			continue;
		}
		rr = (rr / n) | 0;
		gg = (gg / n) | 0;
		bb = (bb / n) | 0;
		rgb[ci * 3] = rr;
		rgb[ci * 3 + 1] = gg;
		rgb[ci * 3 + 2] = bb;
		const b = 0.299 * rr + 0.587 * gg + 0.114 * bb;
		const idx = Math.round((1 - b / 255) * (RAMP.length - 1));
		chars += RAMP[idx] === ' ' ? '.' : RAMP[idx]; // never blank an ink cell
	}
	chars += '\n';
}

const out = `// Auto-generated ASCII portrait of ice.png (${COLS}x${ROWS}), icy background removed.
// Light-mode model view. Regenerate with scripts/gen-ice.cjs.
export const iceCols = ${COLS};
export const iceRows = ${ROWS};
export const iceChars = ${JSON.stringify(chars)};
export const iceColors = ${JSON.stringify(rgb.toString('base64'))};
`;
fs.writeFileSync('src/lib/ice-ascii.ts', out);
console.log('wrote src/lib/ice-ascii.ts', COLS, 'x', ROWS, 'bytes', out.length);
