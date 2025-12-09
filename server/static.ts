import express, { type Express, type Request } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Use process.cwd() for reliable path resolution in production
  // When running `node dist/index.cjs` from project root, cwd = project root
  const distPath = path.resolve(process.cwd(), "dist", "public");
  
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files with proper MIME types
  app.use(express.static(distPath, {
    maxAge: '1y',
    etag: true,
    index: false, // Don't auto-serve index.html for directories
  }));

  // SPA catch-all: only serve index.html for non-asset, non-API routes
  app.use("*", (req: Request, res) => {
    // Skip if request looks like a file (has extension)
    const reqPath = req.originalUrl || req.path;
    if (reqPath.match(/\.[a-zA-Z0-9]+$/)) {
      // File request that wasn't found by static middleware - return 404
      return res.status(404).send('Not found');
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
