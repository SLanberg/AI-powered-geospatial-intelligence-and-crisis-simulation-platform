import { NextResponse } from "next/server";

export const revalidate = 60;

type Source = "ERR" | "Delfi";

interface MediaArticle {
  id: string;
  source: Source;
  title: string;
  url: string;
}

const sources: Record<Source, string> = {
  ERR: "https://www.err.ee/",
  Delfi: "https://www.delfi.ee/",
};

const fallbackArticles: MediaArticle[] = [
  { id: "err-home", source: "ERR", title: "Open the latest news from ERR", url: sources.ERR },
  { id: "delfi-home", source: "Delfi", title: "Open the latest news from Delfi", url: sources.Delfi },
];

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getArticles(source: Source, html: string): MediaArticle[] {
  const baseUrl = sources[source];
  const matches = source === "ERR"
    ? [...html.matchAll(/<a[^>]+href="(\/(?:\d+|[^"]*\d+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)]
    : [...html.matchAll(/<a[^>]+href="(\/artikkel\/\d+\/[^"?#]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/g)];
  const articles: MediaArticle[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const title = decodeHtml(match[2]);
    const url = new URL(match[1], baseUrl).toString();
    if (title.length < 18 || seen.has(url)) continue;
    seen.add(url);
    articles.push({ id: `${source}-${articles.length}`, source, title, url });
    if (articles.length === 8) break;
  }

  return articles;
}

async function fetchSource(source: Source) {
  const response = await fetch(sources[source], {
    headers: { "User-Agent": "CitySignal Media Monitor/1.0" },
    next: { revalidate },
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error(`${source} returned ${response.status}`);
  return getArticles(source, await response.text());
}

export async function GET() {
  const results = await Promise.allSettled((["ERR", "Delfi"] as const).map(async (source) => [source, await fetchSource(source)] as const));
  const sourceStatus: Record<string, boolean> = {};
  const articles = results.flatMap((result) => {
    if (result.status !== "fulfilled") return [];
    const [source, items] = result.value;
    sourceStatus[source] = items.length > 0;
    return items;
  });

  for (const source of ["ERR", "Delfi"] as const) sourceStatus[source] ??= false;
  return NextResponse.json({
    articles: articles.length ? articles : fallbackArticles,
    fetchedAt: new Date().toISOString(),
    sourceStatus,
  });
}
