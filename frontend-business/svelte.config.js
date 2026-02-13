import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto : sur Vercel → adapter-vercel (serverless), ailleurs → adapter-node par défaut
		adapter: adapter()
	}
};

export default config;
