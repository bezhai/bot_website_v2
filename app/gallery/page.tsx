'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface MultiTag {
  name: string;
  translation?: string;
  visible?: boolean;
}

interface PixivImage {
  _id: string;
  pixiv_addr: string;
  visible: boolean;
  author?: string;
  create_time: string;
  update_time: string;
  tos_file_name: string;
  illust_id: number;
  title?: string;
  del_flag: boolean;
  author_id?: string;
  image_key?: string;
  width?: number;
  height?: number;
  multi_tags: MultiTag[];
  show_url: string;
  download_url: string;
}

interface GalleryResponse {
  data: PixivImage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type TabType = 'all' | 'visible' | 'hidden';

interface FilterState {
  author: string;
  authorId: string;
  illustId: string;
  tags: string[];
}

export default function GalleryPage() {
  const router = useRouter();
  const [images, setImages] = useState<PixivImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [page, setPage] = useState(1);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PixivImage | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    author: '',
    authorId: '',
    illustId: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const fetchImages = async (tabType: TabType, pageNum: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      let url = `/api/gallery?page=${pageNum}&limit=20`;

      if (tabType === 'visible') {
        url += '&visible=true';
      } else if (tabType === 'hidden') {
        url += '&visible=false';
      }

      // 添加筛选参数
      if (filters.author) {
        url += `&author=${encodeURIComponent(filters.author)}`;
      }
      if (filters.authorId) {
        url += `&author_id=${encodeURIComponent(filters.authorId)}`;
      }
      if (filters.illustId) {
        url += `&illust_id=${encodeURIComponent(filters.illustId)}`;
      }
      if (filters.tags.length > 0) {
        url += `&tags=${encodeURIComponent(filters.tags.join(','))}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Token 失效，跳转到登录页
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data: GalleryResponse = await response.json();
      setImages(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages(activeTab, page);
  }, [activeTab, page, filters]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // 重置到第一页
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
      setPage(1);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      author: '',
      authorId: '',
      illustId: '',
      tags: [],
    });
    setTagInput('');
    setPage(1);
  };

  const hasActiveFilters = filters.author || filters.authorId || filters.illustId || filters.tags.length > 0;

  // 处理键盘事件（ESC 关闭弹窗）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  // 下载图片
  const handleDownload = async (image: PixivImage) => {
    try {
      const link = document.createElement('a');
      link.href = image.download_url;
      link.download = `${image.title || image.illust_id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // 打开图片详情
  const handleImageClick = (image: PixivImage) => {
    setSelectedImage(image);
  };

  // 从 pixiv_addr 提取作品 ID 并生成 Pixiv URL
  const getPixivUrl = (pixivAddr: string): string | null => {
    if (!pixivAddr) return null;

    // 提取 _ 之前的数字，例如从 "123456_p3.jpg" 提取 "123456"
    const match = pixivAddr.match(/^(\d+)_/);
    if (match && match[1]) {
      return `https://www.pixiv.net/artworks/${match[1]}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-light tracking-tight text-neutral-900 mb-8">
            图库
          </h1>

          {/* Minimalist Tabs */}
          <div className="flex gap-8 border-b border-neutral-200">
            {[
              { key: 'all', label: '全部' },
              { key: 'visible', label: '常规' },
              { key: 'hidden', label: 'R-18' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key as TabType)}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-900" />
                )}
              </button>
            ))}
          </div>

          {/* Filter Toggle Button */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors font-light"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              筛选
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full"></span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors font-light"
              >
                清除筛选
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 p-6 border border-neutral-200 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 作者名称 */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-2">
                    作者名称
                  </label>
                  <input
                    type="text"
                    value={filters.author}
                    onChange={(e) => handleFilterChange('author', e.target.value)}
                    placeholder="支持模糊搜索"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 focus:border-neutral-500 focus:outline-none transition-colors font-light"
                  />
                </div>

                {/* 作者ID */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-2">
                    作者ID
                  </label>
                  <input
                    type="text"
                    value={filters.authorId}
                    onChange={(e) => handleFilterChange('authorId', e.target.value)}
                    placeholder="精确匹配"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 focus:border-neutral-500 focus:outline-none transition-colors font-light"
                  />
                </div>

                {/* 作品ID */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-2">
                    作品ID
                  </label>
                  <input
                    type="text"
                    value={filters.illustId}
                    onChange={(e) => handleFilterChange('illustId', e.target.value)}
                    placeholder="精确匹配"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 focus:border-neutral-500 focus:outline-none transition-colors font-light"
                  />
                </div>

                {/* 标签（多选） */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-2">
                    标签（多选）
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="输入标签后回车添加"
                      className="flex-1 px-3 py-2 text-sm border border-neutral-300 focus:border-neutral-500 focus:outline-none transition-colors font-light"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 text-sm border border-neutral-300 hover:border-neutral-500 hover:bg-neutral-50 transition-colors font-light"
                    >
                      添加
                    </button>
                  </div>
                  {filters.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {filters.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 text-white text-xs font-light"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-neutral-300 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-32">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-neutral-900 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && images.length === 0 && (
          <div className="text-center py-32">
            <p className="text-neutral-400 text-sm font-light">暂无图片</p>
          </div>
        )}

        {/* Masonry Grid */}
        {!loading && images.length > 0 && (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {images.map((image) => (
                <div
                  key={image._id}
                  className="break-inside-avoid group cursor-pointer"
                  onMouseEnter={() => setHoveredImage(image._id)}
                  onMouseLeave={() => setHoveredImage(null)}
                  onClick={() => handleImageClick(image)}
                >
                  <div className="relative overflow-hidden bg-neutral-100">
                    {image.show_url ? (
                      <>
                        <Image
                          src={image.show_url}
                          alt={image.title || 'Gallery image'}
                          width={image.width || 400}
                          height={image.height || 400}
                          className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />

                        {/* Overlay on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent transition-opacity duration-300 ${
                          hoveredImage === image._id ? 'opacity-100' : 'opacity-0'
                        }`}>
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            {image.title && (
                              <h3 className="text-white text-sm font-medium mb-1 line-clamp-2">
                                {image.title}
                              </h3>
                            )}
                            {image.author && (
                              <p className="text-white/80 text-xs font-light">
                                {image.author}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-square flex items-center justify-center">
                        <span className="text-neutral-300 text-xs font-light">暂无图片</span>
                      </div>
                    )}
                  </div>

                  {/* Tags - visible on mobile, hidden on desktop unless hovered */}
                  {image.multi_tags && image.multi_tags.length > 0 && (
                    <div className={`mt-2 flex flex-wrap gap-1.5 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100`}>
                      {image.multi_tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-neutral-200 text-neutral-700 text-xs font-light"
                        >
                          {tag.translation || tag.name}
                        </span>
                      ))}
                      {image.multi_tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs font-light">
                          +{image.multi_tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Minimalist Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-16 pt-8 border-t border-neutral-200">
                <div className="flex justify-between items-center text-sm">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="text-neutral-900 hover:text-neutral-600 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors font-light"
                  >
                    ← 上一页
                  </button>

                  <div className="flex items-center gap-6">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        return (
                          p === 1 ||
                          p === pagination.totalPages ||
                          (p >= page - 1 && p <= page + 1)
                        );
                      })
                      .map((p, index, array) => (
                        <React.Fragment key={p}>
                          {index > 0 && array[index - 1] !== p - 1 && (
                            <span className="text-neutral-400">···</span>
                          )}
                          <button
                            onClick={() => handlePageChange(p)}
                            className={`transition-colors font-light ${
                              page === p
                                ? 'text-neutral-900 font-medium'
                                : 'text-neutral-400 hover:text-neutral-700'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="text-neutral-900 hover:text-neutral-600 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors font-light"
                  >
                    下一页 →
                  </button>
                </div>

                <div className="text-center mt-6 text-xs text-neutral-400 font-light">
                  共 {pagination.total} 张图片 · 第 {pagination.page} 页 / 共 {pagination.totalPages} 页
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 图片详情弹窗 */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative bg-white max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white text-neutral-900 transition-colors"
              aria-label="关闭"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* 左侧：图片 */}
              <div className="relative bg-neutral-100 flex items-center justify-center p-8">
                {selectedImage.show_url && (
                  <div className="relative w-full flex items-center justify-center">
                    <Image
                      src={selectedImage.show_url}
                      alt={selectedImage.title || 'Gallery image'}
                      width={selectedImage.width || 800}
                      height={selectedImage.height || 800}
                      className="max-w-full h-auto max-h-[70vh] object-contain"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  </div>
                )}
              </div>

              {/* 右侧：信息 */}
              <div className="p-8 flex flex-col">
                {/* 标题 */}
                <div className="mb-6">
                  <h2 className="text-xl font-light tracking-tight text-neutral-900 mb-2">
                    {selectedImage.title || '无标题'}
                  </h2>
                  {selectedImage.author && (
                    <p className="text-sm text-neutral-600 font-light">
                      作者：{selectedImage.author}
                      {selectedImage.author_id && (
                        <span className="text-neutral-400 ml-2">ID: {selectedImage.author_id}</span>
                      )}
                    </p>
                  )}
                </div>

                {/* 基本信息 */}
                <div className="mb-6 pb-6 border-b border-neutral-200">
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
                    基本信息
                  </h3>
                  <div className="space-y-2 text-sm font-light">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">作品ID</span>
                      <span className="text-neutral-900">{selectedImage.illust_id}</span>
                    </div>
                    {selectedImage.width && selectedImage.height && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">尺寸</span>
                        <span className="text-neutral-900">
                          {selectedImage.width} × {selectedImage.height}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-neutral-600">类型</span>
                      <span className="text-neutral-900">
                        {selectedImage.visible ? '常规' : 'R-18'}
                      </span>
                    </div>
                    {selectedImage.create_time && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">创建时间</span>
                        <span className="text-neutral-900">
                          {new Date(selectedImage.create_time).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 标签 */}
                {selectedImage.multi_tags && selectedImage.multi_tags.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-neutral-200">
                    <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
                      标签
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedImage.multi_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-light transition-colors"
                        >
                          {tag.translation || tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="mt-auto space-y-3">
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="w-full px-6 py-3 bg-neutral-900 text-white text-sm font-light hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    下载图片
                  </button>

                  {selectedImage.pixiv_addr && getPixivUrl(selectedImage.pixiv_addr) && (
                    <a
                      href={getPixivUrl(selectedImage.pixiv_addr)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-6 py-3 border border-neutral-300 text-neutral-900 text-sm font-light hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      在 Pixiv 查看
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
