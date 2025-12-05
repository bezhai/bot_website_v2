import { NextRequest, NextResponse } from 'next/server';
import mysqlPool from '@/lib/mysql';
import { PasswordService } from '@/lib/password';
import { JWTService } from '@/lib/jwt';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  nickname: string;
  password_hash: string;
  role_id: number | null;
}

// 获取用户信息
export async function GET(request: NextRequest) {
  try {
    // 从请求头获取 token
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

    const connection = await mysqlPool.getConnection();

    try {
      const [users] = await connection.query<UserRow[]>(
        'SELECT id, username, email, nickname, role_id FROM users WHERE id = ?',
        [payload.userId]
      );

      if (users.length === 0) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        );
      }

      const user = users[0];

      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          role_id: user.role_id || 2,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}

// 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    // 从请求头获取 token
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

    const body = await request.json();
    const { nickname, email, currentPassword, newPassword } = body;

    const connection = await mysqlPool.getConnection();

    try {
      // 先获取用户当前信息
      const [users] = await connection.query<UserRow[]>(
        'SELECT id, username, email, nickname, password_hash, role_id FROM users WHERE id = ?',
        [payload.userId]
      );

      if (users.length === 0) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        );
      }

      const user = users[0];

      // 如果要修改密码，需要验证当前密码
      if (newPassword) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: '修改密码需要提供当前密码' },
            { status: 400 }
          );
        }

        const isPasswordValid = await PasswordService.checkPasswordHash(
          currentPassword,
          user.password_hash
        );

        if (!isPasswordValid) {
          return NextResponse.json(
            { error: '当前密码错误' },
            { status: 400 }
          );
        }

        // 生成新密码的哈希
        const newPasswordHash = await PasswordService.hashPassword(newPassword);

        // 更新密码
        await connection.query(
          'UPDATE users SET password_hash = ? WHERE id = ?',
          [newPasswordHash, payload.userId]
        );
      }

      // 更新其他信息
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (nickname !== undefined && nickname !== user.nickname) {
        updateFields.push('nickname = ?');
        updateValues.push(nickname);
      }

      if (email !== undefined && email !== user.email) {
        // 检查邮箱是否已被使用
        const [emailCheck] = await connection.query<UserRow[]>(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, payload.userId]
        );

        if (emailCheck.length > 0) {
          return NextResponse.json(
            { error: '该邮箱已被使用' },
            { status: 400 }
          );
        }

        updateFields.push('email = ?');
        updateValues.push(email);
      }

      // 如果有字段需要更新
      if (updateFields.length > 0) {
        updateValues.push(payload.userId);
        await connection.query(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      // 获取更新后的用户信息
      const [updatedUsers] = await connection.query<UserRow[]>(
        'SELECT id, username, email, nickname, role_id FROM users WHERE id = ?',
        [payload.userId]
      );

      const updatedUser = updatedUsers[0];

      return NextResponse.json({
        message: '更新成功',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          nickname: updatedUser.nickname,
          email: updatedUser.email,
          role_id: updatedUser.role_id || 2,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: '更新用户信息失败' },
      { status: 500 }
    );
  }
}
