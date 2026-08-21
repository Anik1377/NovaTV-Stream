import { NextRequest, NextResponse } from 'next/server';

const cache = new Map<string, { data: ReturnType<typeof parseChapters>; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  // Check cache
  const cached = cache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // Try multiple URL formats for Project Gutenberg plain text files
    const urls = [
      `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
      `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
      `https://www.gutenberg.org/files/${id}/${id}.txt`,
    ];

    let text = '';
    for (const url of urls) {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        text = await res.text();
        break;
      }
    }

    if (!text) {
      return NextResponse.json({ error: 'Could not fetch novel content' }, { status: 404 });
    }

    // Parse chapters/sections
    const chapters = parseChapters(text, id);

    // Cache the result
    cache.set(id, { data: chapters, timestamp: Date.now() });

    // Limit cache size to prevent memory leaks
    if (cache.size > 50) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey as string);
      }
    }

    return NextResponse.json(chapters);
  } catch (error) {
    console.error('Novel fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch novel' }, { status: 500 });
  }
}

interface Chapter {
  title: string;
  start: number;
  content: string;
}

interface ParsedNovel {
  bookId: string;
  title: string;
  chapters: Chapter[];
}

function parseChapters(text: string, bookId: string): ParsedNovel {
  const lines = text.split('\n');

  // Find the start of actual content (skip Gutenberg header)
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 100); i++) {
    if (
      lines[i].match(/^(CHAPTER|Chapter|PART|Part|SECTION|Section|BOOK|Book)\s/i) ||
      lines[i].match(/^I{1,3}\.\s/i) ||
      (lines[i].match(/^[A-Z][A-Z\s]+$/) && i > 5 && lines[i].length < 60)
    ) {
      startIdx = i;
      break;
    }
  }

  // If no chapter markers found, try to find where the actual story starts
  if (startIdx === 0) {
    for (let i = 0; i < Math.min(lines.length, 150); i++) {
      const line = lines[i].trim();
      if (line.length > 50 && !line.startsWith('*') && !line.startsWith('The Project')) {
        startIdx = i;
        break;
      }
    }
  }

  // Chapter detection patterns
  const chapterRegex = /^(CHAPTER|Chapter|PART|Part|SECTION|Section)\s+(\d+|[IVXLCDM]+|[A-Za-z]+)/i;
  const romanRegex = /^(I{1,3})\.\s+(.+)/;

  const chapters: Chapter[] = [];
  let currentChapter: Chapter = { title: 'Beginning', start: startIdx, content: '' };

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if ((chapterRegex.test(trimmed) || romanRegex.test(trimmed)) && i > startIdx + 5) {
      if (currentChapter.content.length > 100) {
        chapters.push({ ...currentChapter });
      }
      const match = trimmed.match(chapterRegex) || trimmed.match(romanRegex);
      currentChapter = {
        title: match ? trimmed.substring(0, Math.min(80, trimmed.length)) : trimmed,
        start: i,
        content: '',
      };
    } else {
      currentChapter.content += line + '\n';
    }
  }

  // Push last chapter
  if (currentChapter.content.length > 100) {
    chapters.push(currentChapter);
  }

  // If no chapters found, split into chunks of ~150 lines
  if (chapters.length === 0) {
    const contentLines = lines.slice(startIdx);
    const chunkSize = 150;
    for (let i = 0; i < contentLines.length; i += chunkSize) {
      const chunk = contentLines.slice(i, i + chunkSize).join('\n');
      chapters.push({
        title: i === 0 ? 'Chapter 1' : `Chapter ${Math.floor(i / chunkSize) + 1}`,
        start: i + startIdx,
        content: chunk,
      });
    }
  }

  // Extract book title from first meaningful line
  let title = `Book ${bookId}`;
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const line = lines[i].trim();
    if (line.length > 5 && line.length < 100 && !line.startsWith('*') && !line.startsWith('The Project')) {
      title = line;
      break;
    }
  }

  return { bookId, title, chapters };
}
