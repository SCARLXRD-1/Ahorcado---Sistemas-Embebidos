import { createClient } from '@insforge/sdk';

const baseUrl = import.meta.env.VITE_INSFORGE_BASE_URL || import.meta.env.NEXT_PUBLIC_INSFORGE_URL;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY || import.meta.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!baseUrl || !anonKey) {
  console.error("Faltan las variables de entorno de InsForge.");
}

export const insforge = baseUrl && anonKey ? createClient({ baseUrl, anonKey }) : null;
