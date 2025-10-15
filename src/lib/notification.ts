import { HealthCheckResult } from './minio-health';

/**
 * 환경 변수 검증 유틸리티
 */
function isValidEnvVar(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== '' && !value.trim().startsWith('#');
}

/**
 * 알림 설정 상태 확인
 */
export function getNotificationStatus() {
  const slackEnabled = isValidEnvVar(process.env.SLACK_WEBHOOK_URL);
  const mattermostEnabled = isValidEnvVar(process.env.MATTERMOST_WEBHOOK_URL);
  const emailEnabled = isValidEnvVar(process.env.EMAIL_TO);

  return {
    slack: slackEnabled,
    mattermost: mattermostEnabled,
    email: emailEnabled,
    total: [slackEnabled, mattermostEnabled, emailEnabled].filter(Boolean).length,
  };
}

/**
 * Slack으로 알림 전송
 */
export async function sendSlackNotification(results: HealthCheckResult[]): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  // 환경 변수 검증
  if (!isValidEnvVar(webhookUrl)) {
    console.log('🔕 Slack 알림 비활성화: SLACK_WEBHOOK_URL 환경 변수가 설정되지 않았거나 주석 처리됨');
    return;
  }

  // URL 형식 검증
  if (!webhookUrl!.startsWith('https://hooks.slack.com/')) {
    console.log('❌ Slack webhook URL 형식이 올바르지 않습니다.');
    return;
  }

  const unhealthyServers = results.filter(r => r.status !== 'healthy');
  
  if (unhealthyServers.length === 0) {
    return; // 모두 정상이면 알림 안 보냄
  }

  const message = {
    text: '🚨 MinIO 서버 헬스체크 경고',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 MinIO 서버 헬스체크 경고',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${unhealthyServers.length}개* 서버에 문제가 감지되었습니다.`,
        },
      },
      {
        type: 'divider',
      },
      ...unhealthyServers.map(server => ({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*서버:*\n${server.server}`,
          },
          {
            type: 'mrkdwn',
            text: `*상태:*\n${server.status === 'error' ? '❌ 에러' : '⚠️ 비정상'}`,
          },
          {
            type: 'mrkdwn',
            text: `*URL:*\n${server.url}`,
          },
          {
            type: 'mrkdwn',
            text: `*에러:*\n${server.error || server.statusCode || 'N/A'}`,
          },
        ],
      })),
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Slack 알림 전송 실패:', error);
  }
}

/**
 * Mattermost로 알림 전송
 */
export async function sendMattermostNotification(results: HealthCheckResult[]): Promise<void> {
  const webhookUrl = process.env.MATTERMOST_WEBHOOK_URL;
  
  // 환경 변수 검증
  if (!isValidEnvVar(webhookUrl)) {
    console.log('🔕 Mattermost 알림 비활성화: MATTERMOST_WEBHOOK_URL 환경 변수가 설정되지 않았거나 주석 처리됨');
    return;
  }

  // URL 형식 검증 (Mattermost는 다양한 도메인을 가질 수 있으므로 기본적인 HTTP/HTTPS 검증)
  if (!webhookUrl!.startsWith('http://') && !webhookUrl!.startsWith('https://')) {
    console.log('❌ Mattermost webhook URL 형식이 올바르지 않습니다.');
    return;
  }

  const unhealthyServers = results.filter(r => r.status !== 'healthy');
  
  if (unhealthyServers.length === 0) {
    return; // 모두 정상이면 알림 안 보냄
  }

  // Mattermost 메시지 포맷
  let message = `## 🚨 MinIO 서버 헬스체크 경고\n\n`;
  message += `**${unhealthyServers.length}개** 서버에 문제가 감지되었습니다.\n\n`;
  message += `---\n\n`;

  unhealthyServers.forEach(server => {
    message += `### ${server.server}\n`;
    message += `- **상태**: ${server.status === 'error' ? '❌ 에러' : '⚠️ 비정상'}\n`;
    message += `- **URL**: \`${server.url}\`\n`;
    if (server.statusCode) {
      message += `- **상태 코드**: ${server.statusCode}\n`;
    }
    if (server.responseTime) {
      message += `- **응답 시간**: ${server.responseTime}ms\n`;
    }
    if (server.error) {
      message += `- **에러**: \`${server.error}\`\n`;
    }
    message += `- **시간**: ${new Date(server.timestamp).toLocaleString('ko-KR')}\n\n`;
  });

  const payload = {
    text: message,
    username: 'MinIO Health Monitor',
    icon_url: 'https://min.io/resources/img/logo/MINIO_wordmark.png',
    channel: process.env.MATTERMOST_CHANNEL || '',
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Mattermost 알림 전송 실패:', error);
  }
}

/**
 * 이메일로 알림 전송 (선택사항)
 */
export async function sendEmailNotification(results: HealthCheckResult[]): Promise<void> {
  const emailTo = process.env.EMAIL_TO;
  
  // 환경 변수 검증
  if (!isValidEnvVar(emailTo)) {
    console.log('🔕 이메일 알림 비활성화: EMAIL_TO 환경 변수가 설정되지 않았거나 주석 처리됨');
    return;
  }

  // 이메일 형식 검증 (간단한 검증)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailTo!)) {
    console.log('❌ 이메일 형식이 올바르지 않습니다.');
    return;
  }

  const unhealthyServers = results.filter(r => r.status !== 'healthy');
  
  if (unhealthyServers.length === 0) {
    return;
  }

  // 실제 이메일 전송은 SendGrid, AWS SES 등의 서비스를 사용해야 합니다
  // 여기서는 간단한 예시만 제공합니다
  console.log('이메일 알림:', {
    to: emailTo,
    subject: `MinIO 헬스체크 경고: ${unhealthyServers.length}개 서버 문제 발생`,
    servers: unhealthyServers,
  });
}

/**
 * 알림 전송
 */
export async function sendNotifications(results: HealthCheckResult[]): Promise<void> {
  const status = getNotificationStatus();
  
  console.log(`📢 알림 전송 시작 - 활성화된 채널: ${status.total}개 (Slack: ${status.slack ? '✅' : '❌'}, Mattermost: ${status.mattermost ? '✅' : '❌'}, Email: ${status.email ? '✅' : '❌'})`);
  
  await Promise.all([
    sendSlackNotification(results),
    sendMattermostNotification(results),
    sendEmailNotification(results),
  ]);
  
  console.log('📢 알림 전송 완료');
}

