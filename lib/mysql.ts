import mysql from 'mysql2/promise';

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306');
const MYSQL_USER = process.env.MYSQL_USER!;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD!;
const MYSQL_DATABASE = process.env.MYSQL_DATABASE!;

if (!MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
  throw new Error('Please define MySQL environment variables');
}

const pool = mysql.createPool({
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
