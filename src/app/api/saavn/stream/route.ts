import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route to stream JioTunePreview audio to the browser.
 * This avoids CORS issues with jiotunepreview.jio.com.
 */
export async function GET(request: NextRequest) {
  const audioUrl = request.nextUrl.searchParams.get('url');

  if (!audioUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Validate it's a jiotunepreview URL for security
  if (!audioUrl.startsWith('https://jiotunepreview.jio.com/')) {
    return NextResponse.json({ error: 'Invalid audio source' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(audioUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Audio source returned ' + res.status },
        { status: 502 },
      );
    }

    const contentType = res.headers.get('content-type') || 'audio/mpeg';
    const contentLength = res.headers.get('content-length');

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'Accept-Ranges': 'bytes',
    };
    if (contentLength) headers['Content-Length'] = contentLength;

    // Stream the audio data
    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (e) {
          // Stream aborted - that's ok
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to stream audio', details: message },
      { status: 500 },
    );
  }
}
