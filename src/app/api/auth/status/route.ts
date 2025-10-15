import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/session';
import { isOTPEnabled, isOTPSetupRequired } from '@/lib/otp';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/auth/status
 * 인증 상태 확인
 */
export async function GET() {
  try {
    const otpEnabled = isOTPEnabled();
    const otpSetupRequired = isOTPSetupRequired();
    const authenticated = isAuthenticated();

    return NextResponse.json({
      success: true,
      data: {
        otpEnabled,
        otpSetupRequired,
        authenticated,
        requiresAuth: otpEnabled,
        requiresSetup: otpSetupRequired,
        showQrSetup: process.env.SHOW_QR_SETUP === 'true',
      },
      message: '인증 상태를 성공적으로 확인했습니다.',
    });
  } catch (error: any) {
    console.error('인증 상태 확인 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || '인증 상태 확인 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
