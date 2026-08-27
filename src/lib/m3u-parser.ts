// M3U playlist parser for iptv-org format

export interface M3UChannel {
  name: string;
  url: string;
  group: string;
  tvgId: string;
  tvgName: string;
  tvgLogo: string;
  country: string;
  language: string;
}

export function parseM3U(content: string): M3UChannel[] {
  const channels: M3UChannel[] = [];
  const lines = content.split('\n');
  let current: Partial<M3UChannel> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('#EXTINF:')) {
      current = parseExtInf(trimmed);
    } else if (trimmed && !trimmed.startsWith('#') && current) {
      channels.push({
        name: current.name || 'Unknown',
        url: trimmed,
        group: current.group || 'Other',
        tvgId: current.tvgId || '',
        tvgName: current.tvgName || '',
        tvgLogo: current.tvgLogo || '',
        country: current.country || '',
        language: current.language || '',
      });
      current = null;
    }
  }

  return channels;
}

function parseExtInf(line: string): Partial<M3UChannel> {
  const result: Partial<M3UChannel> = {};

  // Extract attributes like tvg-id="..." tvg-name="..." etc.
  const attrRegex = /(\w[-\w]*)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(line)) !== null) {
    const [, key, value] = match;
    switch (key.toLowerCase()) {
      case 'tvg-id':
        result.tvgId = value;
        break;
      case 'tvg-name':
        result.tvgName = value;
        break;
      case 'tvg-logo':
        result.tvgLogo = value;
        break;
      case 'group-title':
        result.group = value;
        break;
      case 'tvg-country':
        result.country = value;
        break;
      case 'tvg-language':
        result.language = value;
        break;
    }
  }

  // Extract channel name (after the last comma in the line)
  const commaIdx = line.lastIndexOf(',');
  if (commaIdx !== -1) {
    result.name = line.substring(commaIdx + 1).trim();
  }

  return result;
}

// Filter channels to only include HLS streams
export function filterHlsChannels(channels: M3UChannel[]): M3UChannel[] {
  return channels.filter(c =>
    c.url.includes('.m3u8') ||
    c.url.includes('/live/') ||
    c.url.includes('m3u8')
  );
}
