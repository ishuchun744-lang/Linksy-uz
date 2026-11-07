'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Crown, ArrowRight, MessageCircle } from 'lucide-react'

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#050508',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        padding: '20px',
        boxSizing: 'border-box',
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'scale(1)' : 'scale(0.95)',
        transition: 'opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, rgba(0, 0, 0, 0) 70%)',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
          padding: '40px 24px',
          borderRadius: '24px',
          backgroundColor: 'rgba(12, 10, 20, 0.75)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          boxShadow: '0 10px 40px rgba(147, 51, 234, 0.2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* ANIMATSIYALI LOGOTIP */}
        <div
          style={{
            position: 'relative',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(244, 114, 182, 0.6)',
            boxShadow: '0 0 30px rgba(236, 72, 153, 0.5)',
            marginBottom: '20px',
            animation: 'pulse 2s infinite',
            backgroundColor: '#000',
          }}
        >
          <Image
            src="/logo.png"
            alt="Linksy Logo"
            fill
            sizes="90px"
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#f472b6', margin: 0 }}>
            Linksy
          </h1>
          <Crown size={22} color="#facc15" />
        </div>

        <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.6', marginBottom: '28px' }}>
          Sevishganlar uchun maxsus yaratilgan magik va real-time messenjer. Qasrlar, sovg'alar va cheksiz muhabbat! ✨
        </p>

        <Link
          href="/chat"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '14px 20px',
            borderRadius: '16px',
            background: 'linear-gradient(to right, #ec4899, #9333ea)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '15px',
            textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(236, 72, 153, 0.4)',
          }}
        >
          <MessageCircle size={20} /> Suhbatga Kirish <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  )
}