import { NextResponse } from 'next/server';
import { checkAllMinioServers } from '@/lib/minio-health';
import { saveHealthCheckResults, getLatestResults } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/health-check
 * 현재 저장된 헬스체크 결과 조회
 */
export async function GET() {
  try {
    const results = getLatestResults();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
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

/**
 * POST /api/health-check
 * 즉시 헬스체크 실행
 */
export async function POST() {
  try {
    const results = await checkAllMinioServers();
    saveHealthCheckResults(results);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
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

