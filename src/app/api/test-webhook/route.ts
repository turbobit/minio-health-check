import { NextResponse } from 'next/server';
import { sendNotifications } from '@/lib/notification';
import { getNotificationStatus } from '@/lib/notification';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/test-webhook
 * 웹훅 테스트용 더미 데이터로 알림 전송
 */
export async function POST() {
  try {
    const status = getNotificationStatus();
    
    if (status.total === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '활성화된 알림 채널이 없습니다. 환경 변수를 확인해주세요.',
          notifications: status,
        },
        { status: 400 }
      );
    }

    // 테스트용 더미 데이터 생성
    const testResults = [
      {
        server: 'MinIO 1 (테스트)',
        url: 'http://minio1.closetoya.com:9000/minio/health/live',
        status: 'error' as const,
        statusCode: 500,
        responseTime: 1200,
        error: 'Connection timeout (테스트 알림)',
        timestamp: new Date().toISOString(),
      },
      {
        server: 'MinIO 2 (테스트)',
        url: 'http://minio2.closetoya.com:9000/minio/health/live',
        status: 'unhealthy' as const,
        statusCode: 404,
        responseTime: 800,
        timestamp: new Date().toISOString(),
      },
    ];

    console.log('🧪 웹훅 테스트 시작');
    
    // 알림 전송
    await sendNotifications(testResults);
    
    console.log('🧪 웹훅 테스트 완료');

    return NextResponse.json({
      success: true,
      message: `테스트 알림이 ${status.total}개 채널로 전송되었습니다.`,
      timestamp: new Date().toISOString(),
      notifications: status,
      testData: testResults,
    });
  } catch (error: any) {
    console.error('❌ 웹훅 테스트 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
