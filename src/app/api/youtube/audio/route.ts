import { NextRequest } from 'next/server';

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.in.projectsegfau.lt',
];

async function tryPiped(videoId: string) {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/streams/${videoId}`, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const audio = data.audioStreams
        ?.filter((s: any) => s.mimeType?.startsWith('audio/'))
        ?.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
      if (audio?.length) return { url: audio[0].url, duration: data.duration || 0 };
    } catch { continue; }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId');
  if (!videoId) return Response.json({ error: 'Missing videoId' }, { status: 400 });

  const result = await tryPiped(videoId);
  if (!result) return Response.json({ error: 'Failed to extract audio' }, { status: 500 });

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
  });
}
