import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* Hero Section */}
        <h1 className="text-5xl md:text-6xl font-light tracking-tight text-neutral-900 mb-6">
          个人小站
        </h1>

        <p className="text-lg md:text-xl text-neutral-500 font-light mb-12 max-w-2xl mx-auto">
          探索精美的图库，分享美好的瞬间
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-24">
          <Link
            href="/gallery"
            className="px-8 py-3 bg-neutral-900 text-white text-sm font-light hover:bg-neutral-700 transition-colors"
          >
            浏览图库
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 border border-neutral-900 text-neutral-900 text-sm font-light hover:bg-neutral-900 hover:text-white transition-colors"
          >
            立即注册
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-12 mt-20">
          <div className="text-center">
            <div className="mb-4 text-neutral-900">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-base font-normal text-neutral-900 mb-2">精美设计</h3>
            <p className="text-sm text-neutral-500 font-light leading-relaxed">
              现代化的极简设计风格，为您带来舒适的视觉体验
            </p>
          </div>

          <div className="text-center">
            <div className="mb-4 text-neutral-900">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-normal text-neutral-900 mb-2">图库展示</h3>
            <p className="text-sm text-neutral-500 font-light leading-relaxed">
              浏览和管理您的图片收藏，支持标签分类
            </p>
          </div>

          <div className="text-center">
            <div className="mb-4 text-neutral-900">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-base font-normal text-neutral-900 mb-2">安全可靠</h3>
            <p className="text-sm text-neutral-500 font-light leading-relaxed">
              采用现代化的身份验证机制，保护您的数据安全
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
