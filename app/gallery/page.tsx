'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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

type TabType = 'all' | 'favorites' | 'following';

type VisibilityFilter = 'all' | 'normal' | 'r18';

interface FilterState {
  author: string;
  authorId: string;
  illustId: string;
  tags: string[];
  visibility: VisibilityFilter;
}

export default function GalleryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
    visibility: 'normal', // 默认显示常规内容
  });
  const [tagInput, setTagInput] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // 滚动时自动收起筛选框
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 向下滚动超过50px时收起筛选框
      if (currentScrollY > lastScrollY && currentScrollY > 50 && showFilters) {
        setShowFilters(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showFilters]);

  // 从 URL 参数初始化筛选状态
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const visibilityParam = searchParams.get('visibility');
    const authorParam = searchParams.get('author');
    const authorIdParam = searchParams.get('author_id');
    const illustIdParam = searchParams.get('illust_id');
    const tagsParam = searchParams.get('tags');
    const tabParam = searchParams.get('tab');

    setPage(pageParam ? parseInt(pageParam, 10) : 1);
    setActiveTab((tabParam as TabType) || 'all');
    setFilters({
      visibility: (visibilityParam as VisibilityFilter) || 'normal',
      author: authorParam || '',
      authorId: authorIdParam || '',
      illustId: illustIdParam || '',
      tags: tagsParam ? tagsParam.split(',').filter(Boolean) : [],
    });
    setIsInitialized(true);
  }, []);

  // 更新 URL 参数
  const updateUrlParams = (newFilters: FilterState, newPage: number, newTab: TabType) => {
    const params = new URLSearchParams();

    if (newPage > 1) params.set('page', newPage.toString());
    if (newTab !== 'all') params.set('tab', newTab);
    if (newFilters.visibility !== 'normal') params.set('visibility', newFilters.visibility);
    if (newFilters.author) params.set('author', newFilters.author);
    if (newFilters.authorId) params.set('author_id', newFilters.authorId);
    if (newFilters.illustId) params.set('illust_id', newFilters.illustId);
    if (newFilters.tags.length > 0) params.set('tags', newFilters.tags.join(','));

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  };

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

      // 收藏和关注功能开发中，暂不请求数据
      if (tabType === 'favorites' || tabType === 'following') {
        setImages([]);
        setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
        setLoading(false);
        return;
      }

      let url = `/api/gallery?page=${pageNum}&limit=20`;

      // 从 filters 中获取可见性筛选
      if (filters.visibility === 'normal') {
        url += '&visible=true';
      } else if (filters.visibility === 'r18') {
        url += '&visible=false';
      }
      // visibility === 'all' 时不添加 visible 参数

      // 添加其他筛选参数
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
    if (isInitialized) {
      fetchImages(activeTab, page);
    }
  }, [activeTab, page, filters, isInitialized]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
    updateUrlParams(filters, 1, tab);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrlParams(filters, newPage, activeTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPage(1);
    updateUrlParams(newFilters, 1, activeTab);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      const newFilters = {
        ...filters,
        tags: [...filters.tags, tagInput.trim()],
      };
      setFilters(newFilters);
      setTagInput('');
      setPage(1);
      updateUrlParams(newFilters, 1, activeTab);
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newFilters = {
      ...filters,
      tags: filters.tags.filter(t => t !== tag),
    };
    setFilters(newFilters);
    setPage(1);
    updateUrlParams(newFilters, 1, activeTab);
  };

  const handleClearFilters = () => {
    const newFilters = {
      author: '',
      authorId: '',
      illustId: '',
      tags: [],
      visibility: 'normal' as VisibilityFilter,
    };
    setFilters(newFilters);
    setTagInput('');
    setPage(1);
    updateUrlParams(newFilters, 1, activeTab);
  };

  const hasActiveFilters = filters.author || filters.authorId || filters.illustId || filters.tags.length > 0 || filters.visibility !== 'normal';

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

  // 点击作者名称筛选
  const handleFilterByAuthor = (author: string) => {
    const newFilters = {
      ...filters,
      author,
      authorId: '',
      illustId: '',
    };
    setFilters(newFilters);
    setPage(1);
    updateUrlParams(newFilters, 1, activeTab);
    setSelectedImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 点击作者ID筛选
  const handleFilterByAuthorId = (authorId: string) => {
    const newFilters = {
      ...filters,
      author: '',
      authorId,
      illustId: '',
    };
    setFilters(newFilters);
    setPage(1);
    updateUrlParams(newFilters, 1, activeTab);
    setSelectedImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 点击作品ID筛选
  const handleFilterByIllustId = (illustId: string) => {
    const newFilters = {
      ...filters,
      author: '',
      authorId: '',
      illustId,
    };
    setFilters(newFilters);
    setPage(1);
    updateUrlParams(newFilters, 1, activeTab);
    setSelectedImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 点击标签筛选
  const handleFilterByTag = (tagName: string) => {
    const newFilters = {
      ...filters,
      tags: [tagName],
    };
    setFilters(newFilters);
    setPage(1);
    updateUrlParams(newFilters, 1, activeTab);
    setSelectedImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* 标题和筛选按钮 */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-light tracking-tight text-neutral-900">
              图库
            </h1>

            <div className="flex items-center gap-4">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors font-light"
                >
                  清除筛选
                </button>
              )}
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
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 border-b border-neutral-200">
            {[
              {
                key: 'all',
                label: '全部',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                )
              },
              {
                key: 'favorites',
                label: '收藏',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )
              },
              {
                key: 'following',
                label: '关注',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                )
              }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key as TabType)}
                className={`pb-2 text-sm font-medium transition-colors relative flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab.icon}
                {tab.label}
                {(tab.key === 'favorites' || tab.key === 'following') && (
                  <span className="ml-1.5 text-xs text-neutral-400 font-light">开发中</span>
                )}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-900" />
                )}
              </button>
            ))}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 border border-neutral-200 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 可见性筛选 */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                    内容类型
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'normal', label: '常规' },
                      { value: 'r18', label: 'R-18' },
                      { value: 'all', label: '全部' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          const newFilters = { ...filters, visibility: option.value as VisibilityFilter };
                          setFilters(newFilters);
                          setPage(1);
                          updateUrlParams(newFilters, 1, activeTab);
                        }}
                        className={`px-3 py-1.5 text-xs font-light transition-colors ${
                          filters.visibility === option.value
                            ? 'bg-neutral-900 text-white'
                            : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 占位，保持网格对齐 */}
                <div></div>

                {/* 作者名称 */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                    作者名称
                  </label>
                  <input
                    type="text"
                    value={filters.author}
                    onChange={(e) => handleFilterChange('author', e.target.value)}
                    placeholder="支持模糊搜索"
                    className="w-full px-3 py-1.5 text-xs border border-neutral-300 focus:border-neutral-500 focus:outline-none transition-colors font-light"
                  />
                </div>

                {/* 作者ID */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                    作者ID
                  </label>
                  <input
                    type="text"
                    value={filters.authorId}
                    onChange={(e) => handleFilterChange('authorId', e.target.value)}
                    placeholder="精确匹配"
                    className="w-full px-3 py-1.5 text-xs border border-neutral-300 focus:border-neutral-500 focus:outline-none transition-colors font-light"
                  />
                </div>

                {/* 作品ID */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                    作品ID
                  </label>
                  <input
                    type="text"
                    value={filters.illustId}
                    onChange={(e) => handleFilterChange('illustId', e.target.value)}
                    placeholder="精确匹配"
                    className="w-full px-3 py-1.5 text-xs border border-neutral-300 focus:border-neutral-500 focus:outline-none transition-colors font-light"
                  />
                </div>

                {/* 标签（多选） */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                    标签（多选）
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="输入标签后回车添加"
                      className="flex-1 px-3 py-1.5 text-xs border border-neutral-300 focus:border-neutral-500 focus:outline-none transition-colors font-light"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-3 py-1.5 text-xs border border-neutral-300 hover:border-neutral-500 hover:bg-neutral-50 transition-colors font-light"
                    >
                      添加
                    </button>
                  </div>
                  {filters.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
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

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 开发中提示 */}
        {(activeTab === 'favorites' || activeTab === 'following') && !loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="text-center">
              <svg className="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <h3 className="text-lg font-light text-neutral-900 mb-2">
                {activeTab === 'favorites' ? '收藏功能' : '关注功能'}开发中
              </h3>
              <p className="text-sm text-neutral-500 font-light">
                敬请期待
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && activeTab === 'all' && (
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
        {!loading && images.length === 0 && activeTab === 'all' && (
          <div className="text-center py-32">
            <p className="text-neutral-400 text-sm font-light">暂无图片</p>
          </div>
        )}

        {/* Masonry Grid */}
        {!loading && images.length > 0 && activeTab === 'all' && (
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
                    <p className="text-sm font-light">
                      <span className="text-neutral-600">作者：</span>
                      <button
                        onClick={() => handleFilterByAuthor(selectedImage.author!)}
                        className="text-neutral-900 hover:text-neutral-600 underline decoration-neutral-300 hover:decoration-neutral-500 transition-colors"
                      >
                        {selectedImage.author}
                      </button>
                      {selectedImage.author_id && (
                        <>
                          <span className="text-neutral-400 ml-2">ID: </span>
                          <button
                            onClick={() => handleFilterByAuthorId(selectedImage.author_id!)}
                            className="text-neutral-400 hover:text-neutral-600 underline decoration-neutral-300 hover:decoration-neutral-500 transition-colors"
                          >
                            {selectedImage.author_id}
                          </button>
                        </>
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
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">作品ID</span>
                      <button
                        onClick={() => handleFilterByIllustId(selectedImage.illust_id.toString())}
                        className="text-neutral-900 hover:text-neutral-600 underline decoration-neutral-300 hover:decoration-neutral-500 transition-colors"
                      >
                        {selectedImage.illust_id}
                      </button>
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
                        <button
                          key={index}
                          onClick={() => handleFilterByTag(tag.name)}
                          className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-900 text-neutral-700 hover:text-white text-xs font-light transition-colors cursor-pointer"
                        >
                          {tag.translation || tag.name}
                        </button>
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
