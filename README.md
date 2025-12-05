# 个人小站

一个基于 Next.js 14+ 和 React 的现代化个人网站，具有精美的扁平化设计风格。

## 功能特性

- 🎨 现代化的扁平设计风格，响应式布局
- 🔐 完整的用户认证系统（注册/登录）
- 📸 图库展示功能，支持标签分类和分页
- 💾 双数据库支持（MySQL + MongoDB）
- 🚀 基于 Next.js 14 App Router
- 🎯 TypeScript 全栈类型安全
- 💅 Tailwind CSS 样式系统

## 技术栈

- **前端框架**: Next.js 14+, React 19
- **样式**: Tailwind CSS
- **数据库**: MySQL (用户数据), MongoDB (图库数据)
- **身份验证**: JWT + bcryptjs
- **语言**: TypeScript

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接信息：

```env
# MongoDB Configuration - 支持两种配置方式，二选一即可

# 方式 1: 使用完整的 URI
MONGODB_URI=mongodb://localhost:27017/your_database_name

# 方式 2: 分开配置（推荐！类似 MySQL，更清晰，密码无需 URL 编码）
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_USER=your_mongodb_user
MONGODB_PASSWORD=your_mongodb_password
MONGODB_DATABASE=your_database_name

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=your_database_name

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

**MongoDB 配置说明：**

- **方式 1（URI）**：如果配置了 `MONGODB_URI`，将优先使用。适合使用云服务（如 MongoDB Atlas）时。
- **方式 2（分开配置）**：类似 MySQL 的配置方式，更直观清晰。密码中的特殊字符（如 `+`、`&`）无需 URL 编码，可以直接填写。


### 3. 初始化数据库

#### MySQL

在 MySQL 中创建数据库并执行 `docs/db.md` 中的 SQL 脚本创建表结构：

- `users` 表：存储用户信息
- `roles` 表：存储角色信息

默认角色：
- id=1: admin（管理员）
- id=2: user（普通用户）

#### MongoDB

MongoDB 会自动创建 `img_map` 集合，无需手动初始化。

### 4. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看网站。

### 5. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   │   ├── auth/         # 认证相关 API
│   │   └── gallery/      # 图库相关 API
│   ├── login/            # 登录页面
│   ├── register/         # 注册页面
│   ├── gallery/          # 图库页面
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 首页
│   └── globals.css       # 全局样式
├── components/            # React 组件
│   ├── ui/               # UI 基础组件
│   └── Navbar.tsx        # 导航栏组件
├── lib/                   # 工具库
│   ├── mongodb.ts        # MongoDB 连接
│   ├── mysql.ts          # MySQL 连接池
│   ├── password.ts       # 密码加密工具
│   └── jwt.ts            # JWT 工具
├── models/                # 数据模型
│   └── PixivImage.ts     # 图片模型
├── docs/                  # 文档
│   └── db.md             # 数据库文档
└── package.json          # 项目配置
```

## API 端点

### 认证

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 图库

- `GET /api/gallery` - 获取图片列表
  - 查询参数：
    - `page`: 页码（默认 1）
    - `limit`: 每页数量（默认 20）
    - `visible`: 可见性过滤（true/false）
    - `tag`: 标签过滤

## 开发说明

### 密码加密

使用 bcryptjs 进行密码加密，salt rounds 设置为 10。

### JWT 认证

- Token 有效期默认为 7 天
- Token 存储在浏览器 localStorage 中
- 每个需要认证的 API 请求需在 Header 中携带 token

### 数据库设计

详细的数据库表结构和字段说明请参考 `docs/db.md`。

## 部署

### Vercel 部署（推荐）

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### 其他平台

项目可以部署到任何支持 Next.js 的平台，如：
- Netlify
- Railway
- 自建服务器（使用 PM2 等进程管理器）

## License

ISC
