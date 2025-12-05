'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nickname: '',
    password: '',
    confirmPassword: '',
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

    // 表单验证
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = '请输入用户名';
    if (!formData.nickname) newErrors.nickname = '请输入昵称';
    if (!formData.password) newErrors.password = '请输入密码';
    if (formData.password.length < 6) {
      newErrors.password = '密码长度至少为6个字符';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          nickname: formData.nickname,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || '注册失败');
        return;
      }

      // 保存token和用户信息
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setMessage('注册成功！正在跳转...');

      // 跳转到首页
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-light tracking-tight text-neutral-900 mb-2">
            注册
          </h1>
          <p className="text-sm text-neutral-500 font-light">
            创建您的账户
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          {/* Nickname Input */}
          <div>
            <label htmlFor="nickname" className="block text-sm font-light text-neutral-700 mb-2">
              昵称
            </label>
            <input
              id="nickname"
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="请输入昵称"
              autoComplete="nickname"
              className="w-full px-4 py-3 bg-white border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors text-sm font-light placeholder:text-neutral-400"
            />
            {errors.nickname && (
              <p className="mt-1.5 text-xs text-red-600 font-light">{errors.nickname}</p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-light text-neutral-700 mb-2">
              邮箱（可选）
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="请输入邮箱"
              autoComplete="email"
              className="w-full px-4 py-3 bg-white border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors text-sm font-light placeholder:text-neutral-400"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600 font-light">{errors.email}</p>
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
              placeholder="至少6个字符"
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-white border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors text-sm font-light placeholder:text-neutral-400"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600 font-light">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-light text-neutral-700 mb-2">
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="再次输入密码"
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-white border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors text-sm font-light placeholder:text-neutral-400"
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-600 font-light">{errors.confirmPassword}</p>
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
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500 font-light">
            已有账户？{' '}
            <Link
              href="/login"
              className="text-neutral-900 hover:text-neutral-600 font-normal transition-colors"
            >
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
