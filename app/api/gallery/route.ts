import { NextRequest, NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import PixivImage from '@/models/PixivImage';
import { getOssService } from '@/lib/oss';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const tag = searchParams.get('tag');
    const tags = searchParams.get('tags'); // 多标签筛选（逗号分隔）
    const visible = searchParams.get('visible');
    const author = searchParams.get('author');
    const authorId = searchParams.get('author_id');
    const illustId = searchParams.get('illust_id');

    const skip = (page - 1) * limit;

    // 构建查询条件
    const query: any = { del_flag: false };

    if (visible !== null && visible !== undefined) {
      query.visible = visible === 'true';
    }

    // 单标签筛选
    if (tag) {
      query['multi_tags.name'] = tag;
    }

    // 多标签筛选（所有标签都要匹配）
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
      if (tagArray.length > 0) {
        query['multi_tags.name'] = { $all: tagArray };
      }
    }

    // 作者名称筛选（模糊匹配）
    if (author) {
      query.author = { $regex: author, $options: 'i' };
    }

    // 作者ID筛选
    if (authorId) {
      query.author_id = authorId;
    }

    // 作品ID筛选
    if (illustId) {
      query.illust_id = parseInt(illustId);
    }

    // 查询图片
    const [images, total] = await Promise.all([
      PixivImage.find(query)
        .sort({ create_time: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
      PixivImage.countDocuments(query),
    ]);

    // 为每张图片添加 URL
    const ossService = getOssService();
    const imagesWithUrl = await Promise.all(
      images.map(async (image: any) => {
        const imageUrl = await ossService.findUrl(image.tos_file_name);
        return {
          ...image,
          show_url: imageUrl.show_url,
          download_url: imageUrl.download_url,
        };
      })
    );

    return NextResponse.json({
      data: imagesWithUrl,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Gallery fetch error:', error);
    return NextResponse.json(
      { error: '获取图库数据失败' },
      { status: 500 }
    );
  }
}
