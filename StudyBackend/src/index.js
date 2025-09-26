import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 라우터 임포트
import dbRoutes from './routes/db.js';
import geminiRoutes from './routes/gemini.js';
import solapiRoutes from './routes/solapi.js';
import indexRoutes from './routes/index.js';

// ES6 모듈에서 __dirname 사용을 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8081', 'exp://192.168.*.*:8081'], // React Native 개발 서버
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    message: 'StudyApp Backend Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 라우터 연결
app.use('/', indexRoutes);
app.use('/api/db', dbRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/solapi', solapiRoutes);

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `경로 ${req.originalUrl}을 찾을 수 없습니다.`
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : '서버 내부 오류가 발생했습니다.'
  });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 StudyApp Backend Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
});

export default app;