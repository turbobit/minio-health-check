import { NextResponse } from 'next/server';
import { sendNotifications } from '@/lib/notification';
import { getNotificationStatus } from '@/lib/notification';
import { checkAllMinioServers } from '@/lib/minio-health';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/test-webhook
 * 실제 MinIO 서버 상태로 웹훅 테스트 알림 전송
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

    console.log('🧪 웹훅 테스트 시작 - 실제 서버 상태 확인 중...');
    
    // 실제 MinIO 서버 상태 확인
    const actualResults = await checkAllMinioServers();
    
    // 테스트용으로 서버명에 "(웹훅 테스트)" 추가
    const testResults = actualResults.map(result => ({
      ...result,
      server: `${result.server} (웹훅 테스트)`,
    }));

    console.log(`🧪 실제 서버 상태: ${actualResults.length}개 서버 확인 완료`);
    console.log(`   - 정상: ${actualResults.filter(r => r.status === 'healthy').length}개`);
    console.log(`   - 문제: ${actualResults.filter(r => r.status !== 'healthy').length}개`);
    
    // 알림 전송 (정상이어도 항상 전송)
    console.log(`📢 웹훅 테스트 알림 전송 - ${testResults.length}개 서버 상태`);
    await sendNotifications(testResults);
    
    console.log('🧪 웹훅 테스트 완료');

    return NextResponse.json({
      success: true,
      message: `실제 서버 상태로 테스트 알림이 ${status.total}개 채널로 전송되었습니다.`,
      timestamp: new Date().toISOString(),
      notifications: status,
      actualResults: actualResults,
      testResults: testResults,
      summary: {
        total: actualResults.length,
        healthy: actualResults.filter(r => r.status === 'healthy').length,
        unhealthy: actualResults.filter(r => r.status !== 'healthy').length,
        notificationSent: true
      }
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
