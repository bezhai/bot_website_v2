'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  nickname: string;
}

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 检查本地存储中的用户信息
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-lg font-light tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors"
          >
            个人小站
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={`text-sm font-light transition-colors ${
                isActive('/')
                  ? 'text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              首页
            </Link>
            <Link
              href="/gallery"
              className={`text-sm font-light transition-colors ${
                isActive('/gallery')
                  ? 'text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              图库
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-6">
                <span className="text-sm text-neutral-600 font-light">
                  {user.nickname}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-light text-neutral-900 hover:text-neutral-600 transition-colors"
                >
                  退出
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-light text-neutral-900 hover:text-neutral-600 transition-colors"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
