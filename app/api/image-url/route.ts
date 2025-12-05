import { NextRequest, NextResponse } from 'next/server';
import { getOssService } from '@/lib/oss';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json(
        { error: '缺少 fileName 参数' },
        { status: 400 }
      );
    }

    const ossService = getOssService();
    const imageUrl = await ossService.findUrl(fileName);

    return NextResponse.json({
      success: true,
      data: imageUrl,
    });
  } catch (error) {
    console.error('Image URL fetch error:', error);
    return NextResponse.json(
      { error: '获取图片链接失败' },
      { status: 500 }
    );
  }
}
