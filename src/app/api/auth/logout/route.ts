import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/auth/logout
 * 로그아웃 (세션 삭제)
 */
export async function POST() {
  try {
    clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: '성공적으로 로그아웃되었습니다.',
    });
  } catch (error: any) {
    console.error('로그아웃 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || '로그아웃 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
