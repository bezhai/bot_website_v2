'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 清除该字段的错误
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    // 简单的表单验证
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = '请输入用户名';
    if (!formData.password) newErrors.password = '请输入密码';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || '登录失败');
        return;
      }

      // 保存token和用户信息
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setMessage('登录成功！正在跳转...');

      // 跳转到首页
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      setMessage('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-light tracking-tight text-neutral-900 mb-2">
            登录
          </h1>
          <p className="text-sm text-neutral-500 font-light">
            登录到您的账户
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-sm font-light text-neutral-700 mb-2">
              用户名
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="请输入用户名"
              autoComplete="username"
              className="w-full px-4 py-3 bg-white border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors text-sm font-light placeholder:text-neutral-400"
            />
            {errors.username && (
              <p className="mt-1.5 text-xs text-red-600 font-light">{errors.username}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-light text-neutral-700 mb-2">
              密码
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="请输入密码"
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-white border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors text-sm font-light placeholder:text-neutral-400"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600 font-light">{errors.password}</p>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`px-4 py-3 text-sm font-light ${
                message.includes('成功')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-neutral-900 text-white text-sm font-light hover:bg-neutral-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500 font-light">
            还没有账户？{' '}
            <Link
              href="/register"
              className="text-neutral-900 hover:text-neutral-600 font-normal transition-colors"
            >
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
