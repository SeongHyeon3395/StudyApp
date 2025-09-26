# Node.js 18 LTS 버전 사용
FROM node:18-alpine

# 작업 디렉터리 설정
WORKDIR /app

# package.json과 (있다면) package-lock.json만 먼저 복사
COPY package*.json ./

# 종속성 설치 (lockfile이 있으면 ci, 없으면 install)
RUN npm ci --omit=dev || npm install --only=production

# 애플리케이션 소스 복사
COPY . .

# 포트 3000 노출
EXPOSE 3000

# 비프로덕션 사용자 생성 및 권한 설정
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# 애플리케이션 시작
CMD ["npm", "start"]