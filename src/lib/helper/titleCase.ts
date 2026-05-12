export function toTitleCase(name: string) {
	return name
		.toLocaleLowerCase()
		.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
}
