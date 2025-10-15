import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MinIO Health Monitor',
  description: 'MinIO 서버 헬스체크 모니터링 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

