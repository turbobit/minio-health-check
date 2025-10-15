import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/debug-env
 * 환경 변수 디버깅용 엔드포인트
 */
export async function GET() {
  try {
    const envVars = {
      SLACK_WEBHOOK_URL: {
        value: process.env.SLACK_WEBHOOK_URL,
        exists: !!process.env.SLACK_WEBHOOK_URL,
        trimmed: process.env.SLACK_WEBHOOK_URL?.trim(),
        startsWithHash: process.env.SLACK_WEBHOOK_URL?.trim().startsWith('#'),
        isValid: !!(process.env.SLACK_WEBHOOK_URL && 
                   process.env.SLACK_WEBHOOK_URL.trim() !== '' && 
                   !process.env.SLACK_WEBHOOK_URL.trim().startsWith('#'))
      },
      MATTERMOST_WEBHOOK_URL: {
        value: process.env.MATTERMOST_WEBHOOK_URL,
        exists: !!process.env.MATTERMOST_WEBHOOK_URL,
        trimmed: process.env.MATTERMOST_WEBHOOK_URL?.trim(),
        startsWithHash: process.env.MATTERMOST_WEBHOOK_URL?.trim().startsWith('#'),
        isValid: !!(process.env.MATTERMOST_WEBHOOK_URL && 
                   process.env.MATTERMOST_WEBHOOK_URL.trim() !== '' && 
                   !process.env.MATTERMOST_WEBHOOK_URL.trim().startsWith('#'))
      },
      EMAIL_TO: {
        value: process.env.EMAIL_TO,
        exists: !!process.env.EMAIL_TO,
        trimmed: process.env.EMAIL_TO?.trim(),
        startsWithHash: process.env.EMAIL_TO?.trim().startsWith('#'),
        isValid: !!(process.env.EMAIL_TO && 
                   process.env.EMAIL_TO.trim() !== '' && 
                   !process.env.EMAIL_TO.trim().startsWith('#'))
      },
      CRON_SECRET: {
        value: process.env.CRON_SECRET,
        exists: !!process.env.CRON_SECRET,
        trimmed: process.env.CRON_SECRET?.trim(),
        startsWithHash: process.env.CRON_SECRET?.trim().startsWith('#'),
        isValid: !!(process.env.CRON_SECRET && 
                   process.env.CRON_SECRET.trim() !== '' && 
                   !process.env.CRON_SECRET.trim().startsWith('#'))
      }
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envVars,
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('SLACK') || 
        key.includes('MATTERMOST') || 
        key.includes('EMAIL') || 
        key.includes('CRON')
      )
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
