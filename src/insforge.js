import { createClient } from '@supabase/supabase-js';

// Usamos el prefijo VITE_ si lo renombramos en el entorno, 
// o NEXT_PUBLIC_ si vite.config.js está configurado para leerlo.
const supabaseUrl = import.meta.env.NEXT_PUBLIC_INSFORGE_URL || import.meta.env.VITE_INSFORGE_URL;
const supabaseKey = import.meta.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || import.meta.env.VITE_INSFORGE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan las variables de entorno de InsForge.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
