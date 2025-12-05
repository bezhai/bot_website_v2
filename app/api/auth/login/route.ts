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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码为必填项' },
        { status: 400 }
      );
    }

    const connection = await mysqlPool.getConnection();

    try {
      // 查询用户
      const [users] = await connection.query<UserRow[]>(
        'SELECT id, username, email, nickname, password_hash, role_id FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        return NextResponse.json(
          { error: '用户名或密码错误' },
          { status: 401 }
        );
      }

      const user = users[0];

      // 验证密码
      const isPasswordValid = await PasswordService.checkPasswordHash(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '用户名或密码错误' },
          { status: 401 }
        );
      }

      // 生成JWT token
      const token = JWTService.sign({
        userId: user.id,
        username: user.username,
        role_id: user.role_id || 2,
      });

      return NextResponse.json({
        message: '登录成功',
        token,
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
