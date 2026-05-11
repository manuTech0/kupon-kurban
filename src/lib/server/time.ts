export function getSlot(date = new Date()) {
	const start = 10 * 60;
	const range = 8 * 60;
	const interval = 15;
	const offset = Math.floor(Math.random() * 200) + 1;
	const now = date.getHours() * 60 + date.getMinutes();

	const base = (((now - start) % range) + range) % range;

	// tambah offset (berbasis urutan)
	const shifted = (base + offset * interval) % range;

	const snapped = Math.floor(shifted / interval) * interval;

	const result = start + snapped;

	const h = Math.floor(result / 60);
	const m = result % 60;

	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
