import { NextRequest } from 'next/server';

process.env.YTDL_NO_UPDATE = '1';

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.in.projectsegfau.lt',
];

async function tryYtdl(videoId: string) {
  const ytdl = (await import('@distube/ytdl-core')).default;
  const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
  const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
  if (!format?.url) return null;
  return { url: format.url, duration: info.videoDetails.lengthSeconds };
}

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

  let result = null;
  try { result = await tryYtdl(videoId); } catch {}
  if (!result) result = await tryPiped(videoId);
  if (!result) return Response.json({ error: 'Failed to extract audio' }, { status: 500 });

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
  });
}
