const CHAR = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
export const zone = CHAR.concat(
	CHAR.map((C) => `${C}1`),
	CHAR.map((C) => `${C}2`),
);
