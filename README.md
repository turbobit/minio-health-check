# MinIO Health Monitor

MinIO 서버들의 헬스체크를 주기적으로 수행하고 모니터링하는 Next.js 애플리케이션입니다.

## 🚀 기능

- ✅ **자동 헬스체크**: Vercel Cron을 통해 5분마다 자동으로 MinIO 서버 상태 확인
- 📊 **실시간 대시보드**: 모든 서버의 상태를 한눈에 확인
- 🔔 **다중 알림 시스템**: Slack, Mattermost, 이메일로 즉시 알림
- ⚡ **즉시 체크**: 버튼 클릭으로 즉시 헬스체크 실행
- 🧪 **웹훅 테스트**: 알림 시스템 테스트 기능
- 📈 **알림 상태 표시**: 활성화된 알림 채널 상태 확인
- 🔄 **자동 새로고침**: 30초마다 대시보드 자동 업데이트
- 🛡️ **환경 변수 검증**: 주석 처리된 환경 변수는 자동으로 비활성화
- 🔐 **OTP 인증**: Google Authenticator 등 OTP 앱을 통한 보안 인증
- 📱 **QR 코드 등록**: OTP 앱 등록을 위한 QR 코드 자동 생성
- ⚙️ **유연한 설정**: QR 코드 등록 단계를 건너뛸 수 있는 옵션

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

`.env.sample` 파일을 `.env.local`로 복사하고 실제 값으로 수정하세요:

```bash
cp .env.sample .env.local
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

# OTP 인증 설정 (선택사항)
OTP_SECRET=JBSWY3DPEHPK3PXP
OTP_ISSUER=MinIO Health Monitor
SESSION_SECRET=your-session-secret-key-32-chars

# QR 코드 등록 페이지 표시 여부 (선택사항)
SHOW_QR_SETUP=true
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

### GET /api/notification-status
현재 알림 설정 상태를 조회합니다.

```bash
curl http://localhost:3000/api/notification-status
```

### POST /api/test-webhook
실제 MinIO 서버 상태로 웹훅 알림 시스템을 테스트합니다. 정상/비정상 관계없이 항상 알림을 전송합니다.

```bash
curl -X POST http://localhost:3000/api/test-webhook
```

### GET /api/auth/status
인증 상태를 확인합니다.

```bash
curl http://localhost:3000/api/auth/status
```

### GET /api/auth/otp/setup
OTP 설정 정보를 조회합니다. (QR 코드 포함, SHOW_QR_SETUP=true일 때만 사용 가능)

```bash
curl http://localhost:3000/api/auth/otp/setup
```

### POST /api/auth/otp/verify
OTP 토큰을 검증하고 세션을 생성합니다.

```bash
curl -X POST http://localhost:3000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'
```

### POST /api/auth/logout
로그아웃하고 세션을 삭제합니다.

```bash
curl -X POST http://localhost:3000/api/auth/logout
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

### 🧪 웹훅 테스트

대시보드에서 "웹훅 테스트" 버튼을 클릭하면 실제 MinIO 서버 상태를 확인하여 정상/비정상 관계없이 항상 알림을 전송합니다. 서버명에 "(웹훅 테스트)" 표시가 추가되어 테스트임을 구분할 수 있습니다.

### 🛡️ 환경 변수 검증

- 환경 변수가 주석 처리(`#`)되어 있으면 해당 알림 채널은 자동으로 비활성화됩니다
- 빈 문자열이나 undefined인 경우에도 비활성화됩니다
- URL 형식 검증을 통해 잘못된 설정을 사전에 방지합니다

## 🔐 OTP 인증 설정

### OTP 인증 활성화

OTP 인증을 사용하려면 다음 환경 변수를 설정하세요:

```env
# OTP 시크릿 키 (32자리 Base32 문자열)
OTP_SECRET=JBSWY3DPEHPK3PXP

# OTP 앱에서 표시될 이름
OTP_ISSUER=MinIO Health Monitor

# 세션 암호화 키 (32자리)
SESSION_SECRET=your-session-secret-key-32-chars
```

### QR 코드 등록 설정

`SHOW_QR_SETUP` 환경 변수로 QR 코드 등록 단계를 제어할 수 있습니다:

```env
# true: QR 코드 등록 페이지 표시 (기본값)
SHOW_QR_SETUP=true

# false: QR 코드 등록 단계를 건너뛰고 바로 OTP 입력 페이지 표시
SHOW_QR_SETUP=false
```

### OTP 앱 등록 방법

1. **QR 코드 등록 (SHOW_QR_SETUP=true)**:
   - Google Authenticator, Authy, Microsoft Authenticator 등 설치
   - 대시보드에서 QR 코드 스캔
   - 또는 수동으로 시크릿 키 입력

2. **수동 등록 (SHOW_QR_SETUP=false)**:
   - OTP 앱에서 수동으로 계정 추가
   - 서비스명: `MinIO Health Monitor`
   - 시크릿 키: 환경 변수의 `OTP_SECRET` 값 입력

### OTP 인증 사용법

1. OTP 앱에서 6자리 코드 확인
2. 대시보드에 코드 입력
3. 인증 성공 시 대시보드 접근 가능
4. 세션은 브라우저를 닫을 때까지 유지됩니다

## 🎨 대시보드 화면

### 📊 요약 통계
- **전체 서버 수**: 모니터링 중인 전체 서버 수
- **정상 서버**: 현재 정상 동작 중인 서버 수
- **문제 서버**: 문제가 발생한 서버 수

### 🔔 알림 상태 표시
- **Slack**: 활성화/비활성화 상태 표시
- **Mattermost**: 활성화/비활성화 상태 표시
- **이메일**: 활성화/비활성화 상태 표시

### 🎛️ 제어 버튼
- **웹훅 테스트**: 알림 시스템 테스트 실행
- **즉시 체크**: MinIO 서버 헬스체크 즉시 실행
- **자동 새로고침**: 30초마다 자동 업데이트 토글

### 📋 서버 상태 카드
각 서버의 상세 상태 정보:
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

## 🚨 문제 해결

### 알림이 전송되지 않는 경우

1. **환경 변수 확인**: `.env.local` 파일에서 웹훅 URL이 올바르게 설정되었는지 확인
2. **주석 처리 확인**: 환경 변수가 `#`으로 주석 처리되지 않았는지 확인
3. **웹훅 테스트**: 대시보드의 "웹훅 테스트" 버튼으로 알림 시스템 테스트
4. **로그 확인**: Vercel 대시보드의 Function Logs에서 에러 메시지 확인

### Cron Job이 실행되지 않는 경우

1. **Vercel Pro 플랜**: Cron Job은 Vercel Pro 플랜 이상에서만 지원됩니다
2. **환경 변수**: `CRON_SECRET`이 설정된 경우 올바른 값으로 호출되는지 확인
3. **Vercel 대시보드**: Cron Jobs 탭에서 실행 상태 확인

### OTP 인증 관련 문제

1. **OTP 코드가 인증되지 않는 경우**:
   - 서버와 OTP 앱의 시간 동기화 확인
   - `OTP_SECRET` 환경 변수가 올바르게 설정되었는지 확인
   - OTP 앱에 올바른 시크릿 키가 등록되었는지 확인

2. **QR 코드 등록이 보이지 않는 경우**:
   - `SHOW_QR_SETUP=true`로 설정되어 있는지 확인
   - 서버 재시작 후 다시 시도

3. **OTP 인증이 작동하지 않는 경우**:
   - `OTP_SECRET` 환경 변수가 설정되어 있는지 확인
   - `SESSION_SECRET` 환경 변수가 설정되어 있는지 확인
   - 브라우저 캐시 삭제 후 다시 시도

## 📝 라이선스

MIT

## 🤝 기여

이슈와 PR은 언제나 환영합니다!

