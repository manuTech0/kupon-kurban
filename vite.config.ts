import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		allowedHosts: [
			"unmodified-ghostlike-darius.ngrok-free.dev",
			"kurban.notoofly.my.id",
			"testkurban.notoofly.my.id",
		],
	},
});
