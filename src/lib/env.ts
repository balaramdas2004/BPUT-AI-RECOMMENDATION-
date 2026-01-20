function normalizeEnvValue(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  if (!trimmed) return undefined;
  if (trimmed === 'undefined' || trimmed === 'null') return undefined;
  return trimmed;
}

export const env = {
  supabaseUrl: normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: normalizeEnvValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
};

function looksLikeSupabaseUrl(url?: string) {
  return typeof url === 'string' && /^https?:\/\/.+/i.test(url);
}

function looksLikeAnonKey(key?: string) {
  // Supabase anon keys are long JWT-ish strings; treat short values as invalid.
  return typeof key === 'string' && key.length > 50;
}

export const isSupabaseConfigured = looksLikeSupabaseUrl(env.supabaseUrl) && looksLikeAnonKey(env.supabaseAnonKey);


