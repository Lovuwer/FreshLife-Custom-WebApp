/**
 * POST /api/magic-list/analyze-image
 *
 * Extracts grocery items from a photograph/scan via Google Gemini multimodal AI.
 *
 * Auth: HTTP-only cookie `freshlife_auth` required
 *
 * Request body:
 *   imageBase64: string — base64-encoded image data (max ~5 MB)
 *   mimeType?: string — image MIME type (default: 'image/jpeg')
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

  const { imageBase64, mimeType = 'image/jpeg' } = await request.json();
  if (!imageBase64) {
    return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY!;
  const model = 'gemini-2.0-flash-lite';

  const prompt = `This is a grocery shopping list (photo/scan).
Extract all visible items as JSON.
Return: { "items": [{ "name": string, "qty": number, "unit": string }] }
If qty or unit is unclear, use 1 and "piece".`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        }],
      }),
    }
  );

  const geminiData = await geminiRes.json();
  const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{"items":[]}';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [] };

  return NextResponse.json(parsed);
}
