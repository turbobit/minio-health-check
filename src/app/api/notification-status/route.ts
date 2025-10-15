import { NextResponse } from 'next/server';
import { getNotificationStatus } from '@/lib/notification';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/notification-status
 * 현재 알림 설정 상태 조회
 */
export async function GET() {
  try {
    const status = getNotificationStatus();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      notifications: status,
      message: `총 ${status.total}개의 알림 채널이 활성화되어 있습니다.`,
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
