import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load ALL env vars (not just VITE_) so we can read server-only secrets like GEMINI_API_KEY
  const env = loadEnv(mode, process.cwd(), "");
  const geminiKey = env.GEMINI_API_KEY;

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      {
        name: "gemini-dev-proxy",
        configureServer(server) {
          server.middlewares.use("/api/gemini/chat", async (req, res) => {
            try {
              if (req.method !== "POST") {
                res.statusCode = 405;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Method not allowed" }));
                return;
              }

              if (!geminiKey) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "GEMINI_API_KEY is not set. See ENV_SETUP.txt" }));
                return;
              }

              let raw = "";
              req.on("data", (chunk) => (raw += chunk));
              await new Promise<void>((resolve) => req.on("end", () => resolve()));
              const body = raw ? JSON.parse(raw) : {};
              const prompt = body?.prompt;

              if (!prompt || typeof prompt !== "string") {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Missing prompt" }));
                return;
              }

              const url =
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent" +
                `?key=${encodeURIComponent(geminiKey)}`;

              const upstream = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ role: "user", parts: [{ text: prompt }] }],
                }),
              });

              const text = await upstream.text();
              res.statusCode = upstream.status;
              res.setHeader("Content-Type", "application/json");
              res.end(text);
            } catch (e: any) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: e?.message ?? "Gemini proxy error" }));
            }
          });
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
