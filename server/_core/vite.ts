import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Server } from "node:http";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    configFile: path.resolve(PROJECT_ROOT, "vite.config.ts"),
    server: { middlewareMode: true, hmr: { server } },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use(/.*/, async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplatePath = path.resolve(PROJECT_ROOT, "client", "index.html");
      let template = fs.readFileSync(clientTemplatePath, "utf-8");
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find build directory: ${distPath}, run "pnpm run build" first`);
  }
  app.use(express.static(distPath));
  app.use(/.*/, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
