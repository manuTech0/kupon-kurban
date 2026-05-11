const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;
export function isWithin3Months(dateStr: Date | undefined): boolean {
	if (!dateStr) return false;
	return Date.now() - new Date(dateStr).getTime() <= THREE_MONTHS_MS;
}
