# MinIO Health Monitor

MinIO 서버들의 헬스체크를 주기적으로 수행하고 모니터링하는 Next.js 애플리케이션입니다.

## 🚀 기능

- ✅ **자동 헬스체크**: Vercel Cron을 통해 5분마다 자동으로 MinIO 서버 상태 확인
- 📊 **실시간 대시보드**: 모든 서버의 상태를 한눈에 확인
- 🔔 **알림 시스템**: 문제 발생 시 Slack/이메일로 즉시 알림
- ⚡ **즉시 체크**: 버튼 클릭으로 즉시 헬스체크 실행
- 🔄 **자동 새로고침**: 30초마다 대시보드 자동 업데이트

## 📦 모니터링 대상 서버

- MinIO 1: http://minio1.closetoya.com:9000/minio/health/live
- MinIO 2: http://minio2.closetoya.com:9000/minio/health/live
- MinIO 3: http://minio3.closetoya.com:9000/minio/health/live
- MinIO 4: http://minio4.closetoya.com:9000/minio/health/live

## 🛠️ 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Cron Jobs**: Vercel Cron

## 📋 설치 및 실행

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

`env.sample` 파일을 `.env.local`로 복사하고 실제 값으로 수정하세요:

```bash
cp env.sample .env.local
```

또는 직접 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Slack 알림 (선택사항)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Mattermost 알림 (선택사항)
MATTERMOST_WEBHOOK_URL=https://your-mattermost.com/hooks/YOUR_WEBHOOK_ID
MATTERMOST_CHANNEL=your-channel-name

# 이메일 알림 (선택사항)
EMAIL_TO=your-email@example.com

# Cron Job 보안 (선택사항)
CRON_SECRET=your-secret-key-here
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 🚢 Vercel 배포

### 1. GitHub에 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Vercel에서 배포

1. [Vercel](https://vercel.com)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 선택
4. 환경 변수 설정 (SLACK_WEBHOOK_URL, MATTERMOST_WEBHOOK_URL 등)
5. "Deploy" 클릭

### 3. Vercel Cron 활성화

`vercel.json` 파일이 자동으로 Cron Job을 설정합니다:
- 경로: `/api/cron`
- 주기: 5분마다 (`*/5 * * * *`)

배포 후 Vercel 대시보드에서 Cron Jobs 탭에서 확인할 수 있습니다.

## 📖 API 엔드포인트

### GET /api/health-check
현재 저장된 헬스체크 결과를 조회합니다.

```bash
curl http://localhost:3000/api/health-check
```

### POST /api/health-check
즉시 헬스체크를 실행합니다.

```bash
curl -X POST http://localhost:3000/api/health-check
```

### GET /api/cron
Vercel Cron이 호출하는 엔드포인트입니다. (자동 실행)

```bash
curl http://localhost:3000/api/cron
```

## 🔔 알림 설정

### Slack 알림

1. Slack Workspace에서 Incoming Webhook 생성
2. Webhook URL을 `.env.local`의 `SLACK_WEBHOOK_URL`에 추가
3. 서버에 문제가 발생하면 자동으로 Slack 메시지 전송

### Mattermost 알림

1. Mattermost에서 Incoming Webhook 생성
2. Webhook URL을 `.env.local`의 `MATTERMOST_WEBHOOK_URL`에 추가
3. (선택사항) 특정 채널에 알림을 보내려면 `MATTERMOST_CHANNEL` 설정
4. 서버에 문제가 발생하면 자동으로 Mattermost 메시지 전송

### 이메일 알림

이메일 알림은 SendGrid, AWS SES 등의 서비스를 연동하여 사용할 수 있습니다.
현재는 콘솔에 로그만 출력하도록 구현되어 있습니다.

## 🎨 대시보드 화면

- **전체 서버 수**: 모니터링 중인 전체 서버 수
- **정상 서버**: 현재 정상 동작 중인 서버 수
- **문제 서버**: 문제가 발생한 서버 수
- **서버 상태 카드**: 각 서버의 상세 상태 정보
  - 상태 (정상/비정상/에러)
  - HTTP 상태 코드
  - 응답 시간 (ms)
  - 에러 메시지 (있는 경우)
  - 마지막 체크 시간

## 🔧 커스터마이징

### 모니터링 서버 변경

`src/lib/minio-health.ts` 파일의 `MINIO_SERVERS` 배열을 수정하세요:

```typescript
export const MINIO_SERVERS: MinioServer[] = [
  { name: 'MinIO 1', url: 'http://your-server-1.com:9000/minio/health/live' },
  { name: 'MinIO 2', url: 'http://your-server-2.com:9000/minio/health/live' },
];
```

### Cron 주기 변경

`vercel.json` 파일의 `schedule`을 수정하세요:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/10 * * * *"  // 10분마다
    }
  ]
}
```

## 📝 라이선스

MIT

## 🤝 기여

이슈와 PR은 언제나 환영합니다!

