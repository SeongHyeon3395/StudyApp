# AWS 배포 가이드

## 1. AWS EC2 준비
```bash
# Docker 및 Docker Compose 설치
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 2. 소스 코드 클론
```bash
git clone https://github.com/SeongHyeon3395/StudyApp.git
cd StudyApp/StudyBackend
```

## 3. 의존성 설치 (로컬에서 먼저 테스트)
```bash
npm install
```

## 4. 환경 변수 설정 (.env)
백엔드 폴더에 `.env` 파일을 생성하고 아래 예시를 참고해 값을 채웁니다. 절대 깃에 올리지 마세요.

```bash
cd StudyApp/StudyBackend
cp .env.example .env
vi .env  # 또는 원하는 편집기 사용
```

필수 키들: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, DB_* 동일하게 맞추기, GEMINI_API_KEY, SOLAPI_API_KEY, SOLAPI_SECRET_KEY, SOLAPI_SENDER_NUMBER

## 5. Docker로 배포
```bash
# 배포 스크립트 실행 권한 부여
chmod +x deploy.sh

# 배포 실행
./deploy.sh
```

## 5. 보안 그룹 설정
AWS EC2 보안 그룹에서 다음 포트 열기:
- Port 3000 (HTTP) - 백엔드 API
- Port 5432 (PostgreSQL) - 필요시 DB 접근용

## 6. 서비스 확인
```bash
# 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f backend

# 헬스 체크
curl http://localhost:3000/health
```

## 7. 프론트엔드 연결
1. AWS EC2의 퍼블릭 IP 확인
2. StudyFront/src/lib/env.ts 파일에서 YOUR_AWS_PUBLIC_IP를 실제 IP로 변경
3. React Native 앱 재시작

## 8. 유지보수 명령어
```bash
# 서비스 중지
docker-compose down

# 서비스 재시작
docker-compose up -d

# 로그 실시간 확인
docker-compose logs -f backend

# 데이터베이스 접속
docker-compose exec postgres psql -U StudyApp -d StudyAppDB
```