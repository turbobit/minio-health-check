import { NextResponse } from 'next/server';
import { verifyOTPToken, isOTPEnabled } from '@/lib/otp';
import { createSession, setSessionCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/auth/otp/verify
 * OTP 토큰 검증 및 세션 생성
 */
export async function POST(request: Request) {
  try {
    console.log('🔐 OTP 검증 API 호출 시작');
    
    if (!isOTPEnabled()) {
      console.log('❌ OTP가 설정되지 않음');
      return NextResponse.json(
        {
          success: false,
          error: 'OTP가 설정되지 않았습니다. OTP_SECRET 환경 변수를 확인해주세요.',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { token } = body;

    console.log('📝 요청 데이터:', { 
      hasToken: !!token, 
      tokenType: typeof token,
      tokenLength: token?.length 
    });

    if (!token || typeof token !== 'string') {
      console.log('❌ 토큰 형식 오류');
      return NextResponse.json(
        {
          success: false,
          error: 'OTP 토큰이 필요합니다.',
        },
        { status: 400 }
      );
    }

    // OTP 토큰 검증
    console.log('🔍 OTP 토큰 검증 시작');
    const verificationResult = verifyOTPToken(token);
    console.log('📊 검증 결과:', verificationResult);

    if (!verificationResult.success) {
      console.log('❌ OTP 검증 실패');
      return NextResponse.json(
        {
          success: false,
          error: verificationResult.message,
        },
        { status: 401 }
      );
    }

    // 세션 생성 및 쿠키 설정
    console.log('✅ 세션 생성 중');
    const sessionData = createSession();
    setSessionCookie(sessionData);
    console.log('🎉 OTP 인증 및 세션 생성 완료');

    return NextResponse.json({
      success: true,
      message: verificationResult.message,
      session: {
        authenticated: true,
        expiresAt: sessionData.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('❌ OTP 검증 API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'OTP 검증 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
