import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('freshlife_auth')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as { type: 'text' | 'image'; content: string };

    if (body.type === 'text') {
      const data = await erpnextFetch(
        '/api/method/freshlife.api.magic_list.analyze_text',
        { method: 'POST', body: { text: body.content }, userToken: token }
      );
      return NextResponse.json(data);
    }

    if (body.type === 'image') {
      const data = await erpnextFetch(
        '/api/method/freshlife.api.magic_list.analyze_image',
        { method: 'POST', body: { image: body.content }, userToken: token }
      );
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
