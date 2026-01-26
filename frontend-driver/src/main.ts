import './app.css';
import App from './App.svelte';

// Svelte 5 : utiliser mount() au lieu de new
import { mount } from 'svelte';

mount(App, {
  target: document.getElementById('app')!,
});
