import { NextRequest, NextResponse } from 'next/server';
import { checkAllMinioServers } from '@/lib/minio-health';
import { sendNotifications } from '@/lib/notification';
import { saveHealthCheckResults } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/cron
 * Vercel Cron Job이 주기적으로 호출하는 엔드포인트
 * 
 * vercel.json에 다음과 같이 설정:
 * {
 *   "crons": [{
 *     "path": "/api/cron",
 *     "schedule": "*/5 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel Cron의 인증 헤더 확인 (선택사항)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔍 헬스체크 시작:', new Date().toISOString());

    // 모든 MinIO 서버 헬스체크
    const results = await checkAllMinioServers();
    
    // 결과 저장
    saveHealthCheckResults(results);

    // 문제가 있는 서버가 있으면 알림 전송
    const unhealthyServers = results.filter(r => r.status !== 'healthy');
    
    if (unhealthyServers.length > 0) {
      console.log(`⚠️  ${unhealthyServers.length}개 서버에 문제 발견`);
      await sendNotifications(results);
    } else {
      console.log('✅ 모든 서버 정상');
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      checked: results.length,
      healthy: results.filter(r => r.status === 'healthy').length,
      unhealthy: unhealthyServers.length,
      results,
    });
  } catch (error: any) {
    console.error('❌ 헬스체크 실패:', error);
    
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

