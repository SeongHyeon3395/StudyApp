import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const router = express.Router();

// Postgres 풀 생성
const pool = new Pool({
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT || 5432),
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});

// 연결 테스트
router.get('/health', async (req, res) => {
	try {
		const result = await pool.query('SELECT 1 as ok');
		res.json({ ok: result.rows[0].ok === 1 });
	} catch (err) {
		res.status(500).json({ error: 'DB 연결 실패', details: err.message });
	}
});

// 샘플: 현재 시간
router.get('/now', async (req, res) => {
	try {
		const result = await pool.query('SELECT NOW() as now');
		res.json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: '쿼리 실패', details: err.message });
	}
});

export default router;
