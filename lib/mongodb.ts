import mongoose from "mongoose";

// 支持两种配置方式：
// 1. 使用完整的 URI (优先)
// 2. 使用分开的配置项 (类似 MySQL)
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_PORT = process.env.MONGODB_PORT || "27017";
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE;

// 构建连接字符串
function getMongoDBConnectionString(): string {
  // 如果提供了完整的 URI，直接使用
  if (MONGODB_URI) {
    return MONGODB_URI;
  }

  // 否则使用分开的配置项构建 URI
  if (!MONGODB_HOST || !MONGODB_DATABASE) {
    throw new Error(
      "Please define either MONGODB_URI or (MONGODB_HOST and MONGODB_DATABASE) environment variables"
    );
  }

  // 构建认证部分
  const auth =
    MONGODB_USER && MONGODB_PASSWORD
      ? `${encodeURIComponent(MONGODB_USER)}:${encodeURIComponent(
          MONGODB_PASSWORD
        )}@`
      : "";

  // 构建完整的连接字符串
  return `mongodb://${auth}${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=admin`;
}

const connectionString = getMongoDBConnectionString();

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectMongoDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log(connectionString);
    cached.promise = mongoose.connect(connectionString, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectMongoDB;
