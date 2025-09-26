#!/bin/bash

# AWS EC2에 Docker로 백엔드 배포 스크립트

echo "🚀 StudyApp Backend 배포 시작..."

# 기존 컨테이너 정리
echo "📦 기존 컨테이너 정리 중..."
docker-compose down
docker system prune -f

# 최신 코드 풀
echo "📥 최신 코드 가져오는 중..."
git pull origin master

# Docker 이미지 빌드
echo "🔨 Docker 이미지 빌드 중..."
docker-compose build --no-cache

# 컨테이너 실행
echo "▶️ 컨테이너 실행 중..."
docker-compose up -d

# 서비스 상태 확인
echo "🔍 서비스 상태 확인 중..."
sleep 10
docker-compose ps

# 로그 확인
echo "📋 최근 로그:"
docker-compose logs --tail=20 backend

# 헬스 체크
echo "🏥 헬스 체크 중..."
sleep 5
curl -f http://localhost:3000/health || echo "❌ 헬스 체크 실패"

echo "✅ 배포 완료!"
echo "🌐 백엔드 서버: http://$(curl -s ifconfig.me):3000"
echo "📊 헬스 체크: http://$(curl -s ifconfig.me):3000/health"