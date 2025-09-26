import express from 'express';

const router = express.Router();

// 루트 테스트
router.get('/', (req, res) => {
  res.json({ message: 'StudyApp API root' });
});

export default router;
