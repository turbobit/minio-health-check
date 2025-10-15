import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface OTPConfig {
  secret: string;
  issuer: string;
  qrCodeUrl: string;
}

export interface OTPVerificationResult {
  success: boolean;
  message: string;
}

/**
 * OTP 설정 생성
 */
export function generateOTPConfig(): OTPConfig | null {
  const secret = process.env.OTP_SECRET;
  const issuer = process.env.OTP_ISSUER || 'MinIO Health Monitor';
  
  console.log('🔧 OTP 설정 생성 시작:', {
    hasSecret: !!secret,
    secretLength: secret?.length || 0,
    issuer: issuer
  });
  
  if (!secret) {
    console.log('❌ OTP 시크릿이 없음');
    return null;
  }

  console.log('🔍 speakeasy.otpauthURL 호출 전:', {
    secret: secret,
    secretLength: secret.length,
    issuer: issuer
  });

  const otpAuthUrl = speakeasy.otpauthURL({
    secret: secret,
    label: issuer,
    issuer: issuer,
    algorithm: 'sha1',
    encoding: 'base32' // Base32 인코딩 명시적 지정
  });

  console.log('🔍 speakeasy.otpauthURL 호출 후:', {
    otpAuthUrl: otpAuthUrl,
    urlContainsSecret: otpAuthUrl.includes(secret)
  });

  console.log('✅ OTP 설정 생성 완료:', {
    issuer: issuer,
    secretLength: secret.length,
    hasQrUrl: !!otpAuthUrl,
    secret: secret.substring(0, 8) + '...', // 보안을 위해 일부만 표시
    otpAuthUrl: otpAuthUrl
  });

  return {
    secret,
    issuer,
    qrCodeUrl: otpAuthUrl
  };
}

/**
 * QR 코드 생성
 */
export async function generateQRCode(otpAuthUrl: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpAuthUrl);
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR 코드 생성 실패:', error);
    throw new Error('QR 코드 생성에 실패했습니다.');
  }
}

/**
 * OTP 토큰 검증
 */
export function verifyOTPToken(token: string): OTPVerificationResult {
  const secret = process.env.OTP_SECRET;
  
  console.log('🔐 OTP 검증 시작:', {
    token: token,
    tokenLength: token.length,
    hasSecret: !!secret,
    secretLength: secret?.length || 0,
    timestamp: new Date().toISOString()
  });
  
  if (!secret) {
    console.log('❌ OTP 시크릿이 설정되지 않음');
    return {
      success: false,
      message: 'OTP가 설정되지 않았습니다.'
    };
  }

  if (!token || token.length !== 6) {
    console.log('❌ OTP 토큰 형식 오류:', { token, length: token.length });
    return {
      success: false,
      message: 'OTP 코드는 6자리 숫자여야 합니다.'
    };
  }

  try {
    // 현재 시간 기준으로 TOTP 생성 (디버깅용)
    const currentTotp = speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });

    // 더 넓은 시간 윈도우의 TOTP 생성 (디버깅용)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeStep = 30; // TOTP 시간 단계 (30초)
    
    const previousTotp = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: currentTime - timeStep // 30초 전
    });

    const nextTotp = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: currentTime + timeStep // 30초 후
    });

    // 추가 디버깅: 더 넓은 시간 범위의 TOTP들
    const totpWindow = [];
    for (let i = -5; i <= 5; i++) {
      const time = currentTime + (i * timeStep);
      const totp = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
        time: time
      });
      totpWindow.push({
        offset: i,
        time: time,
        totp: totp,
        matches: totp === token
      });
    }
    
    console.log('🔍 OTP 검증 정보:', {
      inputToken: token,
      currentTotp: currentTotp,
      previousTotp: previousTotp,
      nextTotp: nextTotp,
      secret: secret.substring(0, 8) + '...', // 보안을 위해 일부만 표시
      currentTime: new Date().toISOString(),
      currentUnixTime: currentTime,
      timeStep: timeStep
    });

    // 매칭되는 TOTP가 있는지 확인
    const matchingTotp = totpWindow.find(item => item.matches);
    if (matchingTotp) {
      console.log('🎯 매칭되는 TOTP 발견:', {
        offset: matchingTotp.offset,
        timeOffset: matchingTotp.offset * timeStep,
        time: matchingTotp.time,
        totp: matchingTotp.totp
      });
    } else {
      console.log('❌ 매칭되는 TOTP 없음. 전체 윈도우:', totpWindow.map(item => ({
        offset: item.offset,
        totp: item.totp,
        matches: item.matches
      })));
    }

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 10 // 10분 윈도우 (현재 시간 ±10분) - 시간 동기화 문제 대응
    });

    console.log('✅ OTP 검증 결과:', { verified });

    if (verified) {
      console.log('🎉 OTP 인증 성공');
      return {
        success: true,
        message: 'OTP 인증이 성공했습니다.'
      };
    } else {
      console.log('❌ OTP 인증 실패 - 잘못된 코드');
      return {
        success: false,
        message: '잘못된 OTP 코드입니다. 다시 시도해주세요.'
      };
    }
  } catch (error) {
    console.error('❌ OTP 검증 오류:', error);
    return {
      success: false,
      message: 'OTP 검증 중 오류가 발생했습니다.'
    };
  }
}

/**
 * OTP가 설정되어 있는지 확인
 */
export function isOTPEnabled(): boolean {
  return !!process.env.OTP_SECRET;
}

/**
 * OTP 설정이 필요한지 확인 (OTP_SECRET이 없으면 설정 필요)
 */
export function isOTPSetupRequired(): boolean {
  return !process.env.OTP_SECRET;
}

/**
 * 시간 동기화 상태 확인
 */
export function checkTimeSync(): {
  serverTime: string;
  unixTime: number;
  timeZone: string;
  ntpOffset?: number;
} {
  const now = new Date();
  const unixTime = Math.floor(now.getTime() / 1000);
  
  return {
    serverTime: now.toISOString(),
    unixTime: unixTime,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    // NTP 오프셋은 실제 NTP 서버와의 비교가 필요하지만, 여기서는 기본 정보만 제공
  };
}
