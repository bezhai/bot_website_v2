import { NextRequest, NextResponse } from 'next/server';
import mysqlPool from '@/lib/mysql';
import { PasswordService } from '@/lib/password';
import { JWTService } from '@/lib/jwt';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, nickname, password } = body;

    // 验证必填字段
    if (!username || !nickname || !password) {
      return NextResponse.json(
        { error: '用户名、昵称和密码为必填项' },
        { status: 400 }
      );
    }

    // 验证用户名长度
    if (username.length > 50) {
      return NextResponse.json(
        { error: '用户名长度不能超过50个字符' },
        { status: 400 }
      );
    }

    const connection = await mysqlPool.getConnection();

    try {
      // 检查用户名是否已存在
      const [existingUsers] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );

      if (existingUsers.length > 0) {
        return NextResponse.json(
          { error: '用户名已存在' },
          { status: 409 }
        );
      }

      // 加密密码
      const passwordHash = await PasswordService.hashPassword(password);

      // 插入新用户 (role_id默认为2，即普通用户)
      const [result] = await connection.query<ResultSetHeader>(
        'INSERT INTO users (username, email, nickname, password_hash, role_id) VALUES (?, ?, ?, ?, ?)',
        [username, email || '', nickname, passwordHash, 2]
      );

      const userId = result.insertId;

      // 生成JWT token
      const token = JWTService.sign({
        userId,
        username,
        role_id: 2,
      });

      return NextResponse.json(
        {
          message: '注册成功',
          token,
          user: {
            id: userId,
            username,
            nickname,
            email,
            role_id: 2,
          },
        },
        { status: 201 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
