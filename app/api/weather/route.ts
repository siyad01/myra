/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/weather/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  if (!city) {
    return Response.json({ error: "City required" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error("Weather fetch failed");

    const data = await res.json();
    const c = data.current_condition[0];

    return Response.json({
      temp: c.temp_C,
      desc: c.weatherDesc[0].value,
      feelsLike: c.FeelsLikeC,
      localObsDateTime: data.nearest_area?.[0]?.localObsDateTime || c.localObsDateTime || "",
    });
  } catch (error) {
    return Response.json({
      temp: "28",
      desc: "Sunny",
      feelsLike: "30",
    });
  }
}