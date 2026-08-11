import { NextRequest, NextResponse } from 'next/server';

interface ParsedChannel {
  name: string;
  logo: string;
  url: string;
  category: string;
}

function parseM3U(m3uContent: string): ParsedChannel[] {
  const channels: ParsedChannel[] = [];
  const lines = m3uContent.split('\n');
  let currentChannel: Partial<ParsedChannel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      // Parse EXTINF line
      currentChannel = { name: '', logo: '', url: '', category: 'Other' };

      // Extract group-title (category) - use first part if compound (e.g. "Business;News" -> "Business")
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      if (groupMatch) {
        const raw = groupMatch[1] || 'Other';
        currentChannel.category = raw.split(';')[0].trim() || 'Other';
      }

      // Extract tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      if (logoMatch) {
        currentChannel.logo = logoMatch[1] || '';
      }

      // Extract channel name (after the last comma)
      const commaIdx = line.lastIndexOf(',');
      if (commaIdx !== -1) {
        let name = line.substring(commaIdx + 1).trim();
        // Clean up resolution, geo-blocked, and quality info from name
        name = name.replace(/\s*\([\d]+[pi]?\)\s*/g, ' ').trim(); // (1080p), (720p), (576i)
        name = name.replace(/\s*\[Not\s+24\/7\]\s*/gi, ' ').trim();
        name = name.replace(/\s*\[Geo-blocked\]\s*/gi, ' ').trim();
        name = name.replace(/\s+/g, ' ').trim();
        if (name) {
          currentChannel.name = name;
        }
      }
    } else if (line && !line.startsWith('#') && currentChannel) {
      // This is the stream URL line
      const url = line.trim();
      // Only include HLS and playable streams
      if (
        url.includes('.m3u8') ||
        url.endsWith('.mp4') ||
        url.endsWith('.ts') ||
        url.includes('/live/') ||
        url.includes('/stream/')
      ) {
        currentChannel.url = url;
        channels.push(currentChannel as ParsedChannel);
      }
      currentChannel = null;
    }
  }

  return channels;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') || 'in';

  try {
    const m3uUrl = `https://iptv-org.github.io/iptv/countries/${country}.m3u`;
    const res = await fetch(m3uUrl, {
      next: { revalidate: 3600 },
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `No channels available for this country` },
        { status: 404 }
      );
    }

    const m3uContent = await res.text();
    const parsed = parseM3U(m3uContent);

    // Deduplicate by name, keeping first occurrence (usually highest quality)
    const seen = new Set<string>();
    const channels: ParsedChannel[] = [];

    for (const ch of parsed) {
      const key = ch.name.toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      if (!ch.name || !ch.url) continue;
      seen.add(key);
      channels.push({
        name: ch.name,
        logo: ch.logo || '',
        url: ch.url,
        category: ch.category || 'Other',
      });
    }

    return NextResponse.json({ channels });
  } catch (error) {
    console.error('Live TV API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live TV channels' },
      { status: 500 }
    );
  }
}
