import { HealthCheckResult } from './minio-health';

/**
 * Slack으로 알림 전송
 */
export async function sendSlackNotification(results: HealthCheckResult[]): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log('Slack webhook URL이 설정되지 않았습니다.');
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
 * 이메일로 알림 전송 (선택사항)
 */
export async function sendEmailNotification(results: HealthCheckResult[]): Promise<void> {
  const emailTo = process.env.EMAIL_TO;
  
  if (!emailTo) {
    console.log('이메일 수신자가 설정되지 않았습니다.');
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
  await Promise.all([
    sendSlackNotification(results),
    sendEmailNotification(results),
  ]);
}

