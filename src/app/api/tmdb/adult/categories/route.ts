import { NextResponse } from 'next/server';

const DEFAULT_CATEGORIES = [
  { name: 'Amateur', slug: 'amateur-20' },
  { name: 'Anal', slug: 'anal' },
  { name: 'Asian', slug: 'asian_woman-39' },
  { name: 'Babe', slug: 'babe-41' },
  { name: 'BDSM', slug: 'bdsm-34' },
  { name: 'Big Ass', slug: 'big_ass-12' },
  { name: 'Big Tits', slug: 'big_tits-11' },
  { name: 'Blonde', slug: 'blonde-14' },
  { name: 'Blowjob', slug: 'blowjob-15' },
  { name: 'Brunette', slug: 'brunette-25' },
  { name: 'Creampie', slug: 'creampie-32' },
  { name: 'Cumshot', slug: 'cumshot-16' },
  { name: 'Gangbang', slug: 'gangbang-33' },
  { name: 'Hardcore', slug: 'hardcore-13' },
  { name: 'Interracial', slug: 'interracial-28' },
  { name: 'Latina', slug: 'latina-17' },
  { name: 'Lesbian', slug: 'lesbian-26' },
  { name: 'Masturbation', slug: 'masturbation-18' },
  { name: 'MILF', slug: 'milf-29' },
  { name: 'POV', slug: 'pov-30' },
  { name: 'Redhead', slug: 'redhead-31' },
  { name: 'Solo', slug: 'solo-27' },
  { name: 'Squirt', slug: 'squirt-43' },
  { name: 'Teen', slug: 'teen-19' },
  { name: 'Threesome', slug: 'threesome-35' },
  { name: 'Vintage', slug: 'vintage-42' },
];

export async function GET() {
  return NextResponse.json(DEFAULT_CATEGORIES);
}
