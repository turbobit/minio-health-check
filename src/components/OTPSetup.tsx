'use client';

import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface OTPSetupProps {
  onSetupComplete: () => void;
}

export default function OTPSetup({ onSetupComplete }: OTPSetupProps) {
  const [otpSecret, setOtpSecret] = useState('');
  const [otpIssuer, setOtpIssuer] = useState('MinIO Health Monitor');
  const [loading, setLoading] = useState(false);

  // 랜덤 OTP 시크릿 생성
  const generateOTPSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setOtpSecret(result);
  };

  // OTP 설정 완료
  const handleSetupComplete = () => {
    if (!otpSecret.trim()) {
      toast.error('OTP 시크릿을 입력하거나 생성해주세요.');
      return;
    }

    if (!otpIssuer.trim()) {
      toast.error('OTP 발급자명을 입력해주세요.');
      return;
    }

    // 환경 변수 설정 안내
    const envConfig = `# OTP 인증 설정
OTP_SECRET=${otpSecret}
OTP_ISSUER=${otpIssuer}
SESSION_SECRET=${generateRandomString(32)}`;

    // 클립보드에 복사
    navigator.clipboard.writeText(envConfig).then(() => {
      toast.success('환경 변수 설정이 클립보드에 복사되었습니다!');
    }).catch(() => {
      toast.error('클립보드 복사에 실패했습니다.');
    });

    // OTP 설정 완료 상태를 로컬 스토리지에 저장
    localStorage.setItem('otp_setup_completed', 'true');
    localStorage.setItem('otp_setup_timestamp', new Date().toISOString());

    onSetupComplete();
  };

  // 랜덤 문자열 생성 (세션 시크릿용)
  const generateRandomString = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8 px-4">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#333',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }}
      />
      
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔐 OTP 인증 설정
          </h1>
          <p className="text-gray-600">
            보안을 위해 OTP 인증을 설정해주세요
          </p>
        </div>

        <div className="space-y-6">
          {/* OTP 시크릿 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OTP 시크릿 키 (32자리)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={otpSecret}
                onChange={(e) => setOtpSecret(e.target.value.toUpperCase().replace(/[^A-Z2-7]/g, '').slice(0, 32))}
                placeholder="JBSWY3DPEHPK3PXP"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                maxLength={32}
              />
              <button
                onClick={generateOTPSecret}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap"
              >
                생성
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Base32 형식 (A-Z, 2-7)으로 32자리 입력하세요
            </p>
          </div>

          {/* OTP 발급자명 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OTP 발급자명
            </label>
            <input
              type="text"
              value={otpIssuer}
              onChange={(e) => setOtpIssuer(e.target.value)}
              placeholder="MinIO Health Monitor"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              OTP 앱에서 표시될 이름입니다
            </p>
          </div>

          {/* 환경 변수 설정 안내 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">📋 환경 변수 설정 안내</h3>
            <p className="text-sm text-yellow-700 mb-3">
              아래 환경 변수를 <code className="bg-yellow-100 px-1 rounded">.env.local</code> 파일에 추가하세요:
            </p>
            <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
              <div># OTP 인증 설정</div>
              <div>OTP_SECRET={otpSecret || 'JBSWY3DPEHPK3PXP'}</div>
              <div>OTP_ISSUER={otpIssuer}</div>
              <div>SESSION_SECRET={generateRandomString(32)}</div>
            </div>
          </div>

          {/* 설정 완료 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleSetupComplete}
              disabled={loading || !otpSecret.trim() || !otpIssuer.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              {loading ? '설정 중...' : '✅ 설정 완료'}
            </button>
          </div>

          {/* 추가 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">ℹ️ 설정 후 안내</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 환경 변수 설정 후 서버를 재시작하세요</li>
              <li>• OTP 앱(Google Authenticator, Authy 등)을 준비하세요</li>
              <li>• 설정 완료 후 OTP 인증 화면이 표시됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
