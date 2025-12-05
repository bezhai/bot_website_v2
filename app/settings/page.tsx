'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  nickname: string;
  email: string;
  role_id: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 基本信息表单
  const [profileData, setProfileData] = useState({
    nickname: '',
    email: '',
  });

  // 密码修改表单
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // 获取用户信息
    fetchUserProfile(token);
  }, [router]);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        throw new Error('获取用户信息失败');
      }

      const data = await response.json();
      setUser(data.user);
      setProfileData({
        nickname: data.user.nickname || '',
        email: data.user.email || '',
      });
    } catch (error) {
      console.error('Fetch profile error:', error);
      setMessage('获取用户信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    const newErrors: Record<string, string> = {};
    if (!profileData.nickname) newErrors.nickname = '昵称不能为空';
    if (!profileData.email) newErrors.email = '邮箱不能为空';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = '邮箱格式不正确';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || '更新失败');
        return;
      }

      setMessage('基本信息更新成功！');
      setUser(data.user);

      // 更新 localStorage 中的用户信息
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Update profile error:', error);
      setMessage('更新失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    const newErrors: Record<string, string> = {};
    if (!passwordData.currentPassword) newErrors.currentPassword = '请输入当前密码';
    if (!passwordData.newPassword) newErrors.newPassword = '请输入新密码';
    else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = '新密码至少6个字符';
    }
    if (!passwordData.confirmPassword) newErrors.confirmPassword = '请确认新密码';
    else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || '修改密码失败');
        return;
      }

      setMessage('密码修改成功！');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Update password error:', error);
      setMessage('修改密码失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-sm text-neutral-500 font-light">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-2xl font-light tracking-tight text-neutral-900 mb-2">
            账户设置
          </h1>
          <p className="text-sm text-neutral-500 font-light">
            管理您的个人信息和账户安全
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 px-4 py-3 text-sm font-light ${
              message.includes('成功')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* 基本信息 */}
        <div className="mb-12">
          <h2 className="text-lg font-light tracking-tight text-neutral-900 mb-6 pb-3 border-b border-neutral-200">
            基本信息
          </h2>

          {/* 用户名（不可修改） */}
          <div className="mb-6">
            <label className="block text-sm font-light text-neutral-700 mb-2">
              用户名
            </label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="w-full px-4 py-3 bg-neutral-100 border border-neutral-200 text-sm font-light text-neutral-500 cursor-not-allowed"
            />
            <p className="mt-1.5 text-xs text-neutral-500 font-light">用户名不可修改</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* 昵称 */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-light text-neutral-700 mb-2">
                昵称
              </label>
              <input
                id="nickname"
                type="text"
                name="nickname"
                value={profileData.nickname}
                onChange={handleProfileChange}
                placeholder="请输入昵称"
                className="w-full px-4 py-3 bg-white border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors text-sm font-light placeholder:text-neutral-400"
              />
              {errors.nickname && (
                <p className="mt-1.5 text-xs text-red-600 font-light">{errors.nickname}</p>
              )}
            </div>

            {/* 邮箱 */}
            <div>
              <label htmlFor="email" className="block text-sm font-light text-neutral-700 mb-2">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                placeholder="请输入邮箱"
                className="w-full px-4 py-3 bg-white border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors text-sm font-light placeholder:text-neutral-400"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 font-light">{errors.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-neutral-900 text-white text-sm font-light hover:bg-neutral-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? '保存中...' : '保存基本信息'}
            </button>
          </form>
        </div>

        {/* 修改密码 */}
        <div>
          <h2 className="text-lg font-light tracking-tight text-neutral-900 mb-6 pb-3 border-b border-neutral-200">
            修改密码
          </h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {/* 当前密码 */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-light text-neutral-700 mb-2">
                当前密码
              </label>
              <input
                id="currentPassword"
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="请输入当前密码"
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors text-sm font-light placeholder:text-neutral-400"
              />
              {errors.currentPassword && (
                <p className="mt-1.5 text-xs text-red-600 font-light">{errors.currentPassword}</p>
              )}
            </div>

            {/* 新密码 */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-light text-neutral-700 mb-2">
                新密码
              </label>
              <input
                id="newPassword"
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="请输入新密码（至少6个字符）"
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-white border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors text-sm font-light placeholder:text-neutral-400"
              />
              {errors.newPassword && (
                <p className="mt-1.5 text-xs text-red-600 font-light">{errors.newPassword}</p>
              )}
            </div>

            {/* 确认新密码 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-light text-neutral-700 mb-2">
                确认新密码
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="请再次输入新密码"
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-white border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors text-sm font-light placeholder:text-neutral-400"
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600 font-light">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-neutral-900 text-white text-sm font-light hover:bg-neutral-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? '修改中...' : '修改密码'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
