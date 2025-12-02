import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite';
import svg from '@poppanator/sveltekit-svg';

export default defineConfig({
	plugins: [
		sveltekit(),
		svg(),
		Icons({ compiler: 'svelte', autoInstall: true })
	],
	// bits-ui ships Svelte source; ensure Vite handles it in SSR
	ssr: {
		noExternal: ['bits-ui']
	}
});
