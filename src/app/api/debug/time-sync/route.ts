import { NextResponse } from 'next/server';
import { checkTimeSync } from '@/lib/otp';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/debug/time-sync
 * 시간 동기화 상태 확인
 */
export async function GET() {
  try {
    console.log('🕐 시간 동기화 상태 확인 시작');
    
    const timeInfo = checkTimeSync();
    
    console.log('✅ 시간 동기화 정보:', timeInfo);

    return NextResponse.json({
      success: true,
      data: timeInfo,
      message: '시간 동기화 상태를 성공적으로 조회했습니다.',
    });
  } catch (error: any) {
    console.error('❌ 시간 동기화 상태 확인 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || '시간 동기화 상태 확인 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
