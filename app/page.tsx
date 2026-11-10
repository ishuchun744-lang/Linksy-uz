'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Crown } from 'lucide-react'

export default function SplashPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/chat') // 3 soniyadan keyin chat sahifasiga o'tadi
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100dvh',
        backgroundColor: '#050508',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Xatolik bermaydigan oddiy style tegi */}
      <style>{`
        @keyframes logoFloat {
          0%, 100% {
            transform: translateY(0px) scale(1);
            filter: drop-shadow(0 0 15px rgba(236, 72, 153, 0.6));
          }
          50% {
            transform: translateY(-8px) scale(1.05);
            filter: drop-shadow(0 0 35px rgba(147, 51, 234, 0.9));
          }
        }
        @keyframes welcomeGlow {
          0%, 100% {
            opacity: 0.7;
            text-shadow: 0 0 10px rgba(236, 72, 153, 0.5), 0 0 20px rgba(147, 51, 234, 0.3);
            transform: scale(0.98);
          }
          50% {
            opacity: 1;
            text-shadow: 0 0 25px rgba(244, 114, 182, 1), 0 0 45px rgba(168, 85, 247, 0.9);
            transform: scale(1.02);
          }
        }
        .splash-logo {
          animation: logoFloat 2.5s infinite ease-in-out;
        }
        .welcome-text {
          animation: welcomeGlow 1.8s infinite ease-in-out;
        }
      `}</style>

      {/* Logotip va toj */}
      <div
        className="splash-logo"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: 'clamp(36px, 8vw, 52px)',
          fontWeight: 900,
          color: '#f472b6',
          marginBottom: '16px',
        }}
      >
        Linksy <Crown size={38} color="#facc15" />
      </div>

      {/* Yonib turuvchi Welcome yozuvi */}
      <div
        className="welcome-text"
        style={{
          fontSize: 'clamp(20px, 5vw, 28px)',
          fontWeight: 800,
          letterSpacing: '6px',
          textTransform: 'uppercase',
          background: 'linear-gradient(to right, #ec4899, #c084fc, #facc15)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Welcome
      </div>
    </div>
  )
}