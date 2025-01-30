import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'URL verification',
  description: '一个简单的URL验证和跳转工具',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh">
      <body>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
