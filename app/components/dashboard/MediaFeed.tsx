"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Newspaper, RefreshCw, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MediaArticle {
  id: string;
  source: "ERR" | "Delfi";
  title: string;
  url: string;
}

interface MediaResponse {
  articles: MediaArticle[];
  fetchedAt: string;
  sourceStatus: Record<string, boolean>;
}

const sourceStyles = {
  ERR: "border-sky-900/70 bg-sky-950/40 text-sky-300",
  Delfi: "border-rose-900/70 bg-rose-950/40 text-rose-300",
};

export function MediaFeed() {
  const [data, setData] = useState<MediaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await fetch("/api/media", { cache: "no-store" });
      if (!response.ok) throw new Error("Media request failed");
      setData(await response.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  const updatedAt = data
    ? new Intl.DateTimeFormat("et-EE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(data.fetchedAt))
    : null;

  return (
    <section className="w-full max-w-6xl mx-auto space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <Newspaper className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold uppercase tracking-wider">Media monitor</h1>
                <Badge className="h-5 border-emerald-900/70 bg-emerald-950/40 px-1.5 text-[9px] font-mono text-emerald-400">
                  LIVE SOURCES
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest headlines from Estonia&apos;s public and independent newsrooms.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {updatedAt && <span className="font-mono text-[10px] text-muted-foreground">UPDATED {updatedAt}</span>}
            <Button variant="outline" size="sm" onClick={() => void loadArticles()} disabled={loading} className="h-8 gap-1.5 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-900/60 bg-rose-950/20 p-4 text-sm text-rose-300">
          <WifiOff className="h-4 w-4 shrink-0" />
          The news sources could not be reached. Try refreshing in a moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {(["ERR", "Delfi"] as const).map((source) => {
            const articles = data?.articles.filter((article) => article.source === source) ?? [];
            return (
              <div key={source} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border bg-muted/25 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`font-mono text-[10px] ${sourceStyles[source]}`}>{source}</Badge>
                    <span className="text-[11px] text-muted-foreground">{source === "ERR" ? "err.ee" : "delfi.ee"}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">{articles.length} HEADLINES</span>
                </div>
                <div className="divide-y divide-border">
                  {loading && !data
                    ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[69px] animate-pulse bg-muted/20" />)
                    : articles.map((article) => (
                        <a key={article.id} href={article.url} target="_blank" rel="noreferrer" className="group flex items-start gap-3 p-4 transition-colors hover:bg-muted/40">
                          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${source === "ERR" ? "bg-sky-400" : "bg-rose-400"}`} />
                          <span className="flex-1 text-sm font-medium leading-snug text-card-foreground group-hover:text-primary">{article.title}</span>
                          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </a>
                      ))}
                  {!loading && articles.length === 0 && <p className="p-4 text-sm text-muted-foreground">No headlines are available right now.</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
