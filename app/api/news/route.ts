// app/api/news/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim() || "";
  const scope = searchParams.get("scope") || "local";

  let rssUrl = "";

  // PRIORITY ORDER — world > country > local
  if (scope === "world") {
    rssUrl = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"; // TRUE global
  }
  else if (scope === "country") {
    rssUrl = "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en"; // India national
  }
  else {
    // Only local uses city
    const query = city ? `${city} india` : "india";
    rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  }

  console.log("Final RSS URL:", rssUrl); // ← CHECK THIS IN CONSOLE!

  try {
    const res = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/xml, text/xml, */*",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error("Fetch failed");

    const text = await res.text();
    const entries = text.match(/<item>[\s\S]*?<\/item>/g) || [];

    const seen = new Set<string>();
    const headlines: string[] = [];

    for (const item of entries) {
      const titleMatch = item.match(/<title>(<!\[CDATA\[)?(.*?)(]]>)?<\/title>/i);
      if (!titleMatch?.[2]) continue;

      const title = titleMatch[2]
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim()
        .split(" - ")[0]
        .trim();

      const key = title.toLowerCase().replace(/[^\w]/g, "");
      if (seen.has(key) || title.length < 20) continue;
      seen.add(key);

      headlines.push(title);
      if (headlines.length >= 10) break;
    }

    const newsText = headlines.length > 0 ? headlines.join(" • ") : "No headlines right now.";

    return NextResponse.json({ news: newsText });
  } catch (error) {
    console.error("News error:", error);
    return NextResponse.json({ 
      news: "Latest updates from around the world." 
    });
  }
}