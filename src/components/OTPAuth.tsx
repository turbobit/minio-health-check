'use client';

import { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface OTPAuthProps {
  onAuthSuccess: () => void;
  skipSetup?: boolean; // QR 코드 등록 단계를 건너뛸지 여부
}

interface OTPSetupData {
  issuer: string;
  qrCodeUrl: string;
  qrCodeDataURL: string;
  manualEntryKey: string;
}

export default function OTPAuth({ onAuthSuccess, skipSetup = false }: OTPAuthProps) {
  const [step, setStep] = useState<'setup' | 'verify'>(skipSetup ? 'verify' : 'setup');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<OTPSetupData | null>(null);
  const [showManualKey, setShowManualKey] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // OTP 설정 정보 가져오기
  useEffect(() => {
    const fetchSetupData = async () => {
      try {
        const response = await fetch('/api/auth/otp/setup');
        const data = await response.json();
        
        if (data.success) {
          setSetupData(data.data);
        } else {
          toast.error(data.error);
        }
      } catch (error) {
        console.error('OTP 설정 정보 조회 실패:', error);
        toast.error('OTP 설정 정보를 가져올 수 없습니다.');
      }
    };

    fetchSetupData();
  }, []);

  // OTP 입력 단계일 때 자동 포커스
  useEffect(() => {
    if (step === 'verify' && otpInputRef.current) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 포커스
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  // OTP 토큰 검증
  const handleVerifyOTP = async () => {
    if (!otpToken.trim()) {
      toast.error('OTP 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: otpToken }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ OTP 인증이 완료되었습니다!');
        onAuthSuccess();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('OTP 검증 실패:', error);
      toast.error('OTP 검증 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!setupData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">OTP 설정 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

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
      
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            🔐 OTP 인증
          </h1>
          <p className="text-gray-600">
            {setupData.issuer}
          </p>
        </div>

        {step === 'setup' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                OTP 앱에 등록하기
              </h2>
              
              {/* QR 코드 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <img 
                  src={setupData.qrCodeDataURL} 
                  alt="OTP QR Code" 
                  className="mx-auto"
                />
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                위 QR 코드를 OTP 앱으로 스캔하세요
              </p>
              
              {/* 수동 입력 키 */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowManualKey(!showManualKey)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                >
                  {showManualKey ? '숨기기' : '수동으로 입력하기'}
                </button>
                
                {showManualKey && (
                  <div className="bg-gray-100 rounded p-3">
                    <p className="text-xs text-gray-600 mb-1">수동 입력 키:</p>
                    <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                      {setupData.manualEntryKey}
                    </code>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setStep('verify')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
            >
              다음 단계
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                OTP 코드 입력
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OTP 코드 (6자리)
                  </label>
                  <input
                    ref={otpInputRef}
                    type="text"
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
                
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otpToken.length !== 6}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  {loading ? '인증 중...' : '인증'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Google Authenticator, Authy, Microsoft Authenticator 등을 사용하세요
          </p>
        </div>
      </div>
    </div>
  );
}
