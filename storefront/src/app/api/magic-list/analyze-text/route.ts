/**
 * POST /api/magic-list/analyze-text
 *
 * Extracts grocery items from user-typed text via Google Gemini AI.
 *
 * Auth: HTTP-only cookie `freshlife_auth` required
 *
 * Request body:
 *   text: string — grocery list text (one item per line or comma-separated)
 *
 * Response 200:
 *   { items: Array<{ name: string, qty: number, unit: string }> }
 *
 * Response 4xx/5xx:
 *   { error: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get('freshlife_auth')?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { text } = await request.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY!;
  const model = 'gemini-2.0-flash-lite';

  const prompt = `Extract grocery items from this list as JSON.
Return: { "items": [{ "name": string, "qty": number, "unit": string }] }
List: ${text}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  const geminiData = await geminiRes.json();
  const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{"items":[]}';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [] };

  return NextResponse.json(parsed);
}
