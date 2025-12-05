import { NextRequest, NextResponse } from 'next/server';
import { getOssService } from '@/lib/oss';
import { JWTService } from '@/lib/jwt';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // 验证 JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = JWTService.verify(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'token 无效或已过期' },
        { status: 401 }
      );
    }

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
