import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import type { NextConfig } from "next";

const configDir = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const maplibreDist = join(
  dirname(require.resolve("maplibre-gl/package.json")),
  "dist",
);
const publicMaplibre = join(configDir, "public", "maplibre");

mkdirSync(publicMaplibre, { recursive: true });
for (const file of [
  "maplibre-gl-worker.mjs",
  "maplibre-gl-shared.mjs",
] as const) {
  copyFileSync(join(maplibreDist, file), join(publicMaplibre, file));
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/maplibre/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "text/javascript; charset=utf-8",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
