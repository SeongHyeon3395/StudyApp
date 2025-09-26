# 로컬 개발 및 테스트 스크립트

# 의존성 설치
npm install

# 로컬에서 백엔드 개발 서버 실행
npm run dev

# Docker로 로컬 테스트
npm run docker:build
npm run docker:run

# 프론트엔드에서 테스트할 엔드포인트들:
# GET  http://localhost:3000/health          - 서버 상태 확인
# POST http://localhost:3000/api/gemini      - AI 기능
# POST http://localhost:3000/api/solapi      - SMS 발송
# GET  http://localhost:3000/api/db          - DB 연결 테스트