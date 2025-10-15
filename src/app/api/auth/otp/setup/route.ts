import { NextResponse } from 'next/server';
import { generateOTPConfig, generateQRCode, isOTPEnabled } from '@/lib/otp';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/auth/otp/setup
 * OTP 설정 정보 조회 (QR 코드 포함)
 */
export async function GET() {
  try {
    console.log('🔧 OTP 설정 API 호출 시작');
    
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

    console.log('✅ OTP 설정 확인됨, 설정 정보 생성 중');
    const otpConfig = generateOTPConfig();
    if (!otpConfig) {
      console.log('❌ OTP 설정 생성 실패');
      return NextResponse.json(
        {
          success: false,
          error: 'OTP 설정을 생성할 수 없습니다.',
        },
        { status: 500 }
      );
    }

    console.log('🔍 OTP 설정 정보:', {
      issuer: otpConfig.issuer,
      hasSecret: !!otpConfig.secret,
      secretLength: otpConfig.secret.length,
      hasQrUrl: !!otpConfig.qrCodeUrl
    });

    // QR 코드 생성
    console.log('📱 QR 코드 생성 중');
    const qrCodeDataURL = await generateQRCode(otpConfig.qrCodeUrl);
    console.log('✅ QR 코드 생성 완료');

    return NextResponse.json({
      success: true,
      data: {
        issuer: otpConfig.issuer,
        qrCodeUrl: otpConfig.qrCodeUrl,
        qrCodeDataURL: qrCodeDataURL,
        manualEntryKey: otpConfig.secret,
      },
      message: 'OTP 설정 정보를 성공적으로 조회했습니다.',
    });
  } catch (error: any) {
    console.error('❌ OTP 설정 조회 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'OTP 설정 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
