'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import {
  Send,
  Crown,
  Menu,
  X,
  MessageCircle,
  Gift,
  User,
  Users,
  UserPlus,
  CalendarHeart,
  LogOut,
  Trash2,
  Mail,
  Image as ImageIcon,
  Smile,
  Settings,
  Camera,
  Lock,
  Eye,
  Shield,
  ChevronRight,
  PhoneCall,
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  KeyRound,
  Plus,
  Square,
  Volume2,
  CheckCircle2,
} from 'lucide-react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uviwunmtbfyrtywllvrk.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_z1L2-JOxWEZswqyTqXXncQ_94mAgY2n'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

interface ContactItem {
  id: string
  owner_id?: string
  username: string
  name: string
  avatar: string
  status: string
}

const ALL_GIFTS = [
  { id: 'castle', emoji: '🏰', name: 'Sehrli Qasr' },
  { id: 'dragon', emoji: '🐉', name: 'Olovli Ajdar' },
  { id: 'ship', emoji: '⛵', name: 'Muhabbat Kemasi' },
  { id: 'diamond', emoji: '💎', name: '3D Olmos' },
  { id: 'ferrari', emoji: '🏎️', name: 'Sport Avtomobil' },
  { id: 'rocket', emoji: '🚀', name: 'Kosmik Raketa' },
  { id: 'crown', emoji: '👑', name: 'Qirol Toji' },
  { id: 'rose', emoji: '🌹', name: 'Atirgul' },
]

const EMOJI_LIST = ['❤️', '💖', '💘', '💝', '💞', '💕', '💌', '😍', '🥰', '😘', '😻', '💋', '💍', '👑', '🌹', '✨', '🔥', '⭐', '🧸', '🍫', '🥂', '🍾', '🤗', '🥺', '😭', '😎', '🎉', '🚀', '🐱', '🦄']

const LOVE_STICKERS = [
  { id: 'st1', label: '😍 Cheksiz Muhabbat', content: '💖✨ [STIKER: SENI SEVAMAN] ✨💖' },
  { id: 'st2', label: '🧸 Sog‘indim', content: '🥺🧸 [STIKER: JUDA SOG‘INDIM] 🧸🥺' },
  { id: 'st3', label: '💍 Nikoh Va’dasi', content: '💍👑 [STIKER: ABADIY BIRGA] 👑💍' },
  { id: 'st4', label: '🔥 Yonmoqdaman', content: '🔥❤️ [STIKER: QALBIM YONMOQDA] ❤️🔥' },
]

function SpinningDiamond() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 1.2
      meshRef.current.rotation.x += delta * 0.5
    }
  })

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[1.8, 0]} />
      <meshStandardMaterial
        color="#ec4899"
        emissive="#9333ea"
        roughness={0.1}
        metalness={0.9}
        wireframe={false}
      />
    </mesh>
  )
}

export default function ChatPage() {
  const [isAppLoaded, setIsAppLoaded] = useState(false)
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register')
  const [inputUsername, setInputUsername] = useState('')
  const [inputPassword, setInputPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [activeTab, setActiveTab] = useState<'chat' | 'contacts' | 'gifts' | 'couple' | 'profile' | 'letters' | 'gallery'>('chat')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<string>('')
  const [profileName, setProfileName] = useState('Shahzoda')
  const [profileId, setProfileId] = useState('@linksy_prince')
  const [profileBio, setProfileBio] = useState('Sevgi va sadoqat ila yashaymiz ✨💖')
  const [profileAvatar, setProfileAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60')
  const [bubbleTheme, setBubbleTheme] = useState<'purple' | 'pink' | 'gold'>('purple')

  // KONTAKTLAR VA TANLANGAN SUHBATDOSH (SERVER BILAN)
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null)
  const [newContactUsername, setNewContactUsername] = useState('')
  const [newContactName, setNewContactName] = useState('')
  const [contactFeedback, setContactFeedback] = useState('')
  const [isSavingContact, setIsSavingContact] = useState(false)

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)

  const [onlineMenuOpen, setOnlineMenuOpen] = useState(false)
  const [messageMenuOpen, setMessageMenuOpen] = useState(false)
  const [callMenuOpen, setCallMenuOpen] = useState(false)

  const [onlineStatus, setOnlineStatus] = useState<'all' | 'contacts' | 'nobody'>('all')
  const [messagePermission, setMessagePermission] = useState<'all' | 'contacts' | 'nobody'>('all')
  const [callPermission, setCallPermission] = useState<'all' | 'contacts' | 'nobody'>('all')
  const [appLockEnabled, setAppLockEnabled] = useState(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)

  const [activeCall, setActiveCall] = useState<'audio' | 'video' | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const [activeAnimationGift, setActiveAnimationGift] = useState<{ emoji: string; name: string; is3D?: boolean } | null>(null)

  const [relationshipStarted, setRelationshipStarted] = useState<boolean>(true)
  const [secondsTogether, setSecondsTogether] = useState<number>(0)

  const [letterText, setLetterText] = useState('')
  const [openedLetterId, setOpenedLetterId] = useState<string | null>(null)
  const [memories, setMemories] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // SUPABASE'DAN KONTAKTLARNI YUKLASH
  const fetchContacts = async (userId: string) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const mapped: ContactItem[] = data.map((row: any) => ({
        id: row.id,
        owner_id: row.owner_id,
        username: row.contact_username,
        name: row.contact_name,
        avatar: row.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(row.contact_username)}&backgroundColor=b6e3f4,c0aede,f472b6`,
        status: row.status || 'Online ✨',
      }))
      setContacts(mapped)
      if (mapped.length > 0 && !selectedContact) {
        setSelectedContact(mapped[0])
      }
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoaded(true), 50)
    
    // Supabase auth sessiyasini va brauzer xotirasini tekshiramiz
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const emailId = (session.user.email?.split('@')[0] || 'google_user').toLowerCase()
        setCurrentUser(emailId)
        setProfileId(`@${emailId}`)
        setProfileName(session.user.user_metadata?.full_name || emailId)
        if (session.user.user_metadata?.avatar_url) {
          setProfileAvatar(session.user.user_metadata.avatar_url)
        }
        setIsAuthenticated(true)
        fetchMessages()
        fetchContacts(emailId)

        // URL'da ko'rinib qolgan token/kodlarni tozalaymiz
        if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
          window.history.replaceState(null, '', window.location.pathname)
        }
      }
    })

    const savedUser = localStorage.getItem('linksy_current_user')
    if (savedUser) {
      const cleanSaved = savedUser.toLowerCase()
      setCurrentUser(cleanSaved)
      setProfileId(`@${cleanSaved}`)
      setIsAuthenticated(true)
      fetchMessages()
      fetchContacts(cleanSaved)
    }

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const incoming = payload.new as Message
          
          if (incoming.content.startsWith('PROFILE_AVATAR|')) {
            const avatarUrl = incoming.content.replace('PROFILE_AVATAR|', '')
            setProfileAvatar(avatarUrl)
            return
          }

          if (incoming.content.startsWith('PROFILE_BIO|')) {
            const bioText = incoming.content.replace('PROFILE_BIO|', '')
            setProfileBio(bioText)
            return
          }

          if (incoming.content.startsWith('USER_REG|')) {
            return
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev
            return [...prev, incoming]
          })
          setRelationshipStarted(true)
        }
      )
      .subscribe()

    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    let interval: any
    if (relationshipStarted && isAuthenticated) {
      interval = setInterval(() => {
        setSecondsTogether((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [relationshipStarted, isAuthenticated])

  useEffect(() => {
    if (activeTab === 'chat' && isAuthenticated) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeTab, isAuthenticated, selectedContact])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })

    if (data) {
      const filteredMessages = data.filter(
        (m) =>
          !m.content.startsWith('PROFILE_AVATAR|') &&
          !m.content.startsWith('PROFILE_BIO|') &&
          !m.content.startsWith('USER_REG|')
      )
      setMessages(filteredMessages)

      if (filteredMessages.length > 0) setRelationshipStarted(true)

      const avatarMsg = data.slice().reverse().find((m) => m.content.startsWith('PROFILE_AVATAR|'))
      if (avatarMsg) {
        setProfileAvatar(avatarMsg.content.replace('PROFILE_AVATAR|', ''))
      }

      const bioMsg = data.slice().reverse().find((m) => m.content.startsWith('PROFILE_BIO|'))
      if (bioMsg) {
        setProfileBio(bioMsg.content.replace('PROFILE_BIO|', ''))
      }
    }
  }

  // SERVERGA (SUPABASE) YANGI KONTAKT QO'SHISH FUNKSIYASI
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactFeedback('')

    const rawInput = newContactUsername.trim().replace(/^@/, '').toLowerCase()
    const cleanId = rawInput.includes('@') ? rawInput.split('@')[0] : rawInput

    if (!cleanId) {
      setContactFeedback('Iltimos, foydalanuvchi ID yoki Emailini kiriting!')
      return
    }

    if (cleanId === currentUser) {
      setContactFeedback('O‘zingizni kontaktga qo‘sha olmaysiz!')
      return
    }

    if (contacts.some((c) => c.username.toLowerCase() === cleanId)) {
      setContactFeedback('Bu kontakt allaqachon ro‘yxatingizda bor!')
      return
    }

    setIsSavingContact(true)
    const displayName = newContactName.trim() || cleanId
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanId)}&backgroundColor=b6e3f4,c0aede,f472b6`

    const { data, error } = await supabase
      .from('contacts')
      .insert([
        {
          owner_id: currentUser,
          contact_username: cleanId,
          contact_name: displayName,
          avatar: avatarUrl,
          status: 'Online ✨',
        },
      ])
      .select()

    setIsSavingContact(false)

    if (error) {
      setContactFeedback('Xatolik yuz berdi: ' + error.message)
      return
    }

    if (data && data.length > 0) {
      const row = data[0]
      const newItem: ContactItem = {
        id: row.id,
        owner_id: row.owner_id,
        username: row.contact_username,
        name: row.contact_name,
        avatar: row.avatar,
        status: row.status,
      }
      const updated = [newItem, ...contacts]
      setContacts(updated)
      setSelectedContact(newItem)
    }

    setNewContactUsername('')
    setNewContactName('')
    setContactFeedback('✅ Kontakt serverga muvaffaqiyatli saqlandi!')
    setTimeout(() => setContactFeedback(''), 3000)
  }

  const handleSelectContactForChat = (contact: ContactItem) => {
    setSelectedContact(contact)
    setActiveTab('chat')
  }

  const handleDeleteContact = async (id: string) => {
    await supabase.from('contacts').delete().eq('id', id)
    const updated = contacts.filter((c) => c.id !== id)
    setContacts(updated)
    if (selectedContact?.id === id) {
      setSelectedContact(updated.length > 0 ? updated[0] : null)
    }
  }

  // GOOGLE ORQALI KIRISH (SUPABASE OAUTH)
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/chat',
      },
    })
    if (error) {
      setAuthError('Google orqali kirishda xatolik: ' + error.message)
    }
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')

    if (!inputUsername.trim() || !inputPassword.trim()) {
      setAuthError('Iltimos, ID va parolni kiriting!')
      return
    }

    const cleanUsername = inputUsername.trim().replace(/^@/, '').toLowerCase()

    const { data: existingUsers } = await supabase
      .from('messages')
      .select('content')
      .ilike('content', `USER_REG|${cleanUsername}|%`)

    if (authMode === 'register') {
      if (existingUsers && existingUsers.length > 0) {
        setAuthError('Bu ID (Username) allaqachon band qilingan! Boshqa ID kiriting.')
        return
      }

      const regPayload = `USER_REG|${cleanUsername}|${inputPassword}`
      await supabase.from('messages').insert([
        { content: regPayload, sender_id: cleanUsername, receiver_id: 'system' }
      ])

      setCurrentUser(cleanUsername)
      setProfileName(cleanUsername)
      setProfileId(`@${cleanUsername}`)
      localStorage.setItem('linksy_current_user', cleanUsername)
      setIsAuthenticated(true)
      fetchMessages()
      fetchContacts(cleanUsername)
    } else {
      if (!existingUsers || existingUsers.length === 0) {
        setAuthError('Bunday ID topilmadi! Avval ro\'yxatdan o\'ting.')
        return
      }

      const userRecord = existingUsers[0].content.split('|')
      if (userRecord[2] !== inputPassword) {
        setAuthError('Parol noto\'g\'ri!')
        return
      }

      setCurrentUser(cleanUsername)
      setProfileName(cleanUsername)
      setProfileId(`@${cleanUsername}`)
      localStorage.setItem('linksy_current_user', cleanUsername)
      setIsAuthenticated(true)
      fetchMessages()
      fetchContacts(cleanUsername)
    }
  }

  const sendRawMessage = async (text: string) => {
    if (messagePermission === 'nobody') {
      alert('Sizning maxfiylik sozlamangiz bo\'yicha xabar yuborish taqiqlangan!')
      return
    }

    if (!text.trim()) return

    const receiverId = selectedContact ? selectedContact.username : 'all'

    const { data, error } = await supabase.from('messages').insert([
      {
        content: text,
        sender_id: currentUser,
        receiver_id: receiverId,
      },
    ]).select()

    if (error) {
      console.error('Xabar yuborishda xatolik:', error.message)
      return
    }

    if (data && data.length > 0 && !text.startsWith('PROFILE_AVATAR|') && !text.startsWith('PROFILE_BIO|') && !text.startsWith('USER_REG|')) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data[0].id)) return prev
        return [...prev, data[0]]
      })
    }
    setRelationshipStarted(true)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    const text = newMessage
    setNewMessage('')
    setShowEmojiPicker(false)
    setShowStickerPicker(false)
    await sendRawMessage(text)
  }

  const addEmojiToInput = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
  }

  const sendSticker = async (stickerContent: string) => {
    setShowStickerPicker(false)
    await sendRawMessage(stickerContent)
  }

  const startCall = async (type: 'audio' | 'video') => {
    if (callPermission === 'nobody') {
      alert('Sizning maxfiylik sozlamangiz bo\'yicha qo\'ng\'iroq qilish taqiqlangan!')
      return
    }

    setActiveCall(type)
    const callText = type === 'video' ? '📹 Video qo\'ng\'iroq amalga oshirildi' : '📞 Audio qo\'ng\'iroq amalga oshirildi'
    await sendRawMessage(callText)

    try {
      const constraints = { audio: true, video: type === 'video' }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      mediaStreamRef.current = stream
      if (type === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch (err) {
      alert('Kamera yoki mikrofonni yoqib bo\'lmadi!')
      setActiveCall(null)
    }
  }

  const endCall = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    setActiveCall(null)
    setIsMuted(false)
    setIsVideoOff(false)
  }

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoOff(!isVideoOff)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = async () => {
          const base64Audio = reader.result as string
          await sendRawMessage(`VOICE_NOTE|${base64Audio}`)
        }
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      alert('Mikrofondan foydalanishga ruxsat berilmadi!')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const triggerBigoAnimation = (emoji: string, name: string, is3D = false) => {
    setActiveAnimationGift({ emoji, name, is3D })
    setTimeout(() => setActiveAnimationGift(null), 4000)
  }

  const sendGift = async (emoji: string, name: string) => {
    const is3D = name === '3D Olmos'
    triggerBigoAnimation(emoji, name, is3D)
    await sendRawMessage(`GIFT_ANIMATION|${emoji}|${name}`)
    setActiveTab('chat')
  }

  const sendLoveLetter = async () => {
    if (!letterText.trim()) return
    await sendRawMessage(`LETTER_CONTENT|${letterText}`)
    setLetterText('')
    setActiveTab('chat')
  }

  const handleMemoryPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setMemories((prev) => [reader.result as string, ...prev])
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const base64Avatar = reader.result
          setProfileAvatar(base64Avatar)
          await sendRawMessage(`PROFILE_AVATAR|${base64Avatar}`)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBioChange = async (newBio: string) => {
    setProfileBio(newBio)
    await sendRawMessage(`PROFILE_BIO|${newBio}`)
  }

  const clearChat = async () => {
    await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setMessages([])
    setRelationshipStarted(false)
    setSecondsTogether(0)
    setIsDrawerOpen(false)
  }

  // TANLANGAN KONTAKT BO'YICHA XABARLARNI FILTRLASH
  const displayedMessages = selectedContact
    ? messages.filter(
        (m) =>
          (m.sender_id === currentUser && (m.receiver_id === selectedContact.username || m.receiver_id === 'all')) ||
          (m.sender_id === selectedContact.username && (m.receiver_id === currentUser || m.receiver_id === 'all'))
      )
    : messages

  const days = Math.floor(secondsTogether / (3600 * 24))
  const hours = Math.floor((secondsTogether % (3600 * 24)) / 3600)
  const minutes = Math.floor((secondsTogether % 3600) / 60)
  const seconds = secondsTogether % 60

  const getThemeColors = (isMine: boolean) => {
    if (!isMine) {
      return {
        bg: 'linear-gradient(135deg, rgba(39,39,42,0.95), rgba(24,24,27,0.98))',
        border: '1px solid rgba(168, 85, 247, 0.4)',
      }
    }
    if (bubbleTheme === 'pink') {
      return {
        bg: 'linear-gradient(135deg, rgba(219,39,119,0.45), rgba(157,23,77,0.35))',
        border: '1px solid rgba(244, 114, 182, 0.7)',
      }
    }
    if (bubbleTheme === 'gold') {
      return {
        bg: 'linear-gradient(135deg, rgba(202,138,4,0.4), rgba(161,98,7,0.3))',
        border: '1px solid rgba(250, 204, 21, 0.7)',
      }
    }
    return {
      bg: 'linear-gradient(135deg, rgba(147,51,234,0.45), rgba(79,70,229,0.35))',
      border: '1px solid rgba(168, 85, 247, 0.7)',
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', backgroundColor: '#050508', color: '#fff', fontFamily: 'sans-serif', padding: '20px', boxSizing: 'border-box' }}>
        <style jsx global>{`
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 15px rgba(236, 72, 153, 0.5); }
            50% { box-shadow: 0 0 30px rgba(244, 114, 182, 0.8); }
            100% { box-shadow: 0 0 15px rgba(236, 72, 153, 0.5); }
          }
          .auth-box { animation: pulseGlow 4s infinite ease-in-out; }
        `}</style>

        <div className="auth-box" style={{ width: '100%', maxWidth: '400px', padding: '30px', borderRadius: '24px', backgroundColor: '#0c0a14', border: '1px solid rgba(168, 85, 247, 0.4)', boxSizing: 'border-box', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '26px', fontWeight: 900, color: '#f472b6', marginBottom: '8px' }}>
            Linksy <Crown size={22} color="#facc15" />
          </div>
          <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '24px' }}>Sevishganlar uchun xavfsiz va shaxsiy makon 💖</div>

          {/* GOOGLE BILAN KIRISH TUGMASI */}
          <button
            onClick={handleGoogleLogin}
            style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: '#ffffff', color: '#000000', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(255,255,255,0.1)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.15v3.15C3.15 21.32 7.21 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.15C.42 8.05 0 9.7 0 12s.42 3.95 1.15 5.42l4.13-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.21 0 3.15 2.68 1.15 6.58l4.13 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
            Google orqali kirish
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0', color: '#6b7280', fontSize: '12px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
            yoki ID bilan
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#18181b', borderRadius: '12px', padding: '4px', marginBottom: '20px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: authMode === 'register' ? 'rgba(147,51,234,0.4)' : 'transparent', color: authMode === 'register' ? '#fff' : '#9ca3af', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
            >
              Ro'yxatdan o'tish
            </button>
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: authMode === 'login' ? 'rgba(147,51,234,0.4)' : 'transparent', color: authMode === 'login' ? '#fff' : '#9ca3af', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
            >
              Kirish
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Unikal ID (Username):</label>
              <input
                type="text"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                placeholder="Masalan: shahzoda_2026"
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', backgroundColor: '#18181b', border: '1px solid rgba(168,85,247,0.4)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Maxfiy Parol:</label>
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', backgroundColor: '#18181b', border: '1px solid rgba(168,85,247,0.4)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {authError && <div style={{ fontSize: '12px', color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>{authError}</div>}

            <button
              type="submit"
              style={{ width: '100%', padding: '13px', borderRadius: '14px', border: 'none', background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: 'pointer', marginTop: '6px', boxShadow: '0 0 20px rgba(236,72,153,0.4)' }}
            >
              {authMode === 'register' ? 'Hisob yaratish ✨' : 'Kirish 🚀'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#050508',
        color: '#ffffff',
        overflow: 'hidden',
        fontFamily: 'sans-serif',
        opacity: isAppLoaded ? 1 : 0,
        transform: isAppLoaded ? 'scale(1)' : 'scale(0.99)',
        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <style jsx global>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 10px rgba(236, 72, 153, 0.6), inset 0 0 10px rgba(147, 51, 234, 0.6); }
          50% { box-shadow: 0 0 25px rgba(244, 114, 182, 0.9), inset 0 0 18px rgba(236, 72, 153, 0.9); }
          100% { box-shadow: 0 0 10px rgba(236, 72, 153, 0.6), inset 0 0 10px rgba(147, 51, 234, 0.6); }
        }
        @keyframes gradientRotate {
          0% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(45deg); }
          100% { filter: hue-rotate(0deg); }
        }
        .animated-avatar-ring {
          animation: pulseGlow 3s infinite ease-in-out, gradientRotate 5s infinite linear;
          border: 3px solid transparent;
          background: linear-gradient(135deg, #ec4899, #9333ea, #facc15) border-box;
        }
        @keyframes bubbleGlow {
          0% { filter: drop-shadow(0 0 4px rgba(168, 85, 247, 0.3)); }
          50% { filter: drop-shadow(0 0 10px rgba(236, 72, 153, 0.6)); }
          100% { filter: drop-shadow(0 0 4px rgba(168, 85, 247, 0.3)); }
        }
        .animated-bubble {
          animation: bubbleGlow 4s infinite ease-in-out;
        }
      `}</style>

      {isAvatarModalOpen && (
        <div
          onClick={() => setIsAvatarModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'zoom-out',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', borderRadius: '24px', overflow: 'hidden', border: '3px solid #ec4899', boxShadow: '0 0 50px rgba(236,72,153,0.6)' }}>
            <img src={selectedContact ? selectedContact.avatar : profileAvatar} alt="Zoomed Avatar" style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '80vh' }} />
          </div>
        </div>
      )}

      {activeCall && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#05050bf8',
            backdropFilter: 'blur(24px)',
            padding: '40px 20px',
            boxSizing: 'border-box',
            width: '100vw',
            height: '100vh',
          }}
        >
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <div className="animated-avatar-ring" style={{ width: '105px', height: '105px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 14px auto' }}>
              <img src={selectedContact ? selectedContact.avatar : profileAvatar} alt="Caller" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>
              {selectedContact ? selectedContact.name : profileName}
            </div>
            <div style={{ fontSize: '14px', color: '#22d3ee', marginTop: '6px' }}>
              {activeCall === 'video' ? '📹 To\'liq ekranli video qo\'ng\'iroq...' : '📞 Audio qo\'ng\'iroq davom etmoqda...'}
            </div>
          </div>

          {activeCall === 'video' && (
            <div style={{ width: '100%', maxWidth: '900px', flex: 1, maxHeight: '68vh', backgroundColor: '#121019', borderRadius: '24px', overflow: 'hidden', border: '2px solid rgba(168,85,247,0.5)', position: 'relative', margin: '20px 0', boxShadow: '0 0 50px rgba(147,51,234,0.4)' }}>
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '10px' }}>
            <button
              onClick={toggleMute}
              style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: isMuted ? '#ef4444' : '#27272a', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {activeCall === 'video' && (
              <button
                onClick={toggleVideo}
                style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: isVideoOff ? '#ef4444' : '#27272a', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
              >
                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
              </button>
            )}

            <button
              onClick={endCall}
              style={{ width: '68px', height: '68px', borderRadius: '50%', backgroundColor: '#dc2626', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 25px rgba(220,38,38,0.7)' }}
            >
              <PhoneOff size={30} />
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '1200px',
          height: '100%',
          margin: '0 auto',
          borderLeft: '1px solid rgba(147, 51, 234, 0.2)',
          borderRight: '1px solid rgba(147, 51, 234, 0.2)',
          backgroundColor: '#09090b',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {activeAnimationGift && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.88)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
            }}
          >
            {activeAnimationGift.is3D ? (
              <div style={{ width: '320px', height: '320px', maxWidth: '85vw', maxHeight: '55vh' }}>
                <Canvas camera={{ position: [0, 0, 5] }}>
                  <ambientLight intensity={1.5} />
                  <pointLight position={[10, 10, 10]} intensity={2} />
                  <SpinningDiamond />
                  <OrbitControls enableZoom={false} />
                </Canvas>
              </div>
            ) : (
              <div style={{ fontSize: '80px', filter: 'drop-shadow(0 0 35px #ec4899)' }}>
                {activeAnimationGift.emoji}
              </div>
            )}
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f472b6', marginTop: '16px', textAlign: 'center', textTransform: 'uppercase' }}>
              ✨ {activeAnimationGift.name} ✨
            </div>
          </div>
        )}

        {/* YON MENYU */}
        {isDrawerOpen && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex' }}>
            <div onClick={() => setIsDrawerOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
            <div style={{ position: 'relative', zIndex: 70, width: '300px', maxWidth: '80vw', backgroundColor: '#0c0a14', borderRight: '1px solid rgba(168, 85, 247, 0.35)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(147, 51, 234, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '20px', color: '#f472b6' }}>
                    Linksy <Crown size={18} color="#facc15" />
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                  {[
                    { id: 'chat', label: 'Suhbat oynasi', icon: <MessageCircle size={18} color="#22d3ee" /> },
                    { id: 'contacts', label: `Kontaktlar (${contacts.length})`, icon: <Users size={18} color="#38bdf8" /> },
                    { id: 'gifts', label: "Sovg'alar do'koni", icon: <Gift size={18} color="#f472b6" /> },
                    { id: 'letters', label: 'Maxfiy Maktublar', icon: <Mail size={18} color="#c084fc" /> },
                    { id: 'gallery', label: 'Xotiralar Galereyasi', icon: <ImageIcon size={18} color="#34d399" /> },
                    { id: 'couple', label: 'Juftlik tarixi & Premium', icon: <CalendarHeart size={18} color="#c084fc" /> },
                    { id: 'profile', label: 'Profil va Maxfiylik', icon: <User size={18} color="#facc15" /> },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id as any); setIsDrawerOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: activeTab === item.id ? '1px solid rgba(168,85,247,0.5)' : '1px solid transparent', backgroundColor: activeTab === item.id ? 'rgba(147,51,234,0.25)' : 'transparent', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                    >
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={clearChat} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#fbbf24', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}><Trash2 size={16} /> Xabarlarni tozalash</button>
                <button onClick={() => { localStorage.removeItem('linksy_current_user'); supabase.auth.signOut(); setIsAuthenticated(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left' }}><LogOut size={16} /> Hisobdan chiqish</button>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(147, 51, 234, 0.3)', backgroundColor: '#0c0a14', flexShrink: 0, gap: '12px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <button onClick={() => setIsDrawerOpen(true)} style={{ padding: '9px', borderRadius: '12px', backgroundColor: '#18181b', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#d8b4fe', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Menu size={20} /></button>
            
            <div 
              onClick={() => setActiveTab('profile')} 
              className="animated-avatar-ring" 
              style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', flexShrink: 0, cursor: 'pointer' }}
              title="Profilga o'tish"
            >
              <img src={selectedContact ? selectedContact.avatar : profileAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: '#f472b6', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedContact ? selectedContact.name : profileName}
                </span>
                <CheckCircle2 size={16} style={{ fill: 'url(#gradient-check)', color: '#fff', flexShrink: 0 }} />
                <svg width="0" height="0">
                  <linearGradient id="gradient-check" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop stopColor="#ec4899" offset="0%" />
                    <stop stopColor="#9333ea" offset="100%" />
                  </linearGradient>
                </svg>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(147,51,234,0.35))', border: '1px solid rgba(244,114,182,0.6)', color: '#f472b6', padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, flexShrink: 0, boxShadow: '0 0 10px rgba(236,72,153,0.4)' }}>
                  <Crown size={11} color="#facc15" /> ROYAL LOVE ✨
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#22d3ee', marginTop: '2px' }}>
                {selectedContact
                  ? `Suhbatdosh: @${selectedContact.username} (Sizning ID: @${currentUser})`
                  : `Sizning ID: @${currentUser} (online ✨)`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => setActiveTab('contacts')} style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Kontaktlar">
              <UserPlus size={18} />
            </button>
            <button onClick={() => startCall('audio')} style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(34, 211, 238, 0.15)', border: '1px solid rgba(34, 211, 238, 0.4)', color: '#22d3ee', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Audio qo'ng'iroq">
              <PhoneCall size={18} />
            </button>
            <button onClick={() => startCall('video')} style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.4)', color: '#f472b6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Video qo'ng'iroq">
              <Video size={18} />
            </button>
          </div>
        </header>

        {/* ASOSIY QISM */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '20px', boxSizing: 'border-box' }}>
          {activeTab === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
              {/* Suhbatdosh tanlash tezkor paneli */}
              {contacts.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '8px', borderBottom: '1px solid rgba(168,85,247,0.2)' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0 }}>Yaqinlar:</span>
                  {contacts.map((c) => {
                    const isSelected = selectedContact?.id === c.id
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedContact(c)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          border: isSelected ? '1px solid #ec4899' : '1px solid rgba(255,255,255,0.15)',
                          backgroundColor: isSelected ? 'rgba(236,72,153,0.25)' : '#18181b',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <img src={c.avatar} alt={c.name} style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                        {c.name}
                      </button>
                    )
                  })}
                </div>
              )}

              {displayedMessages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '60px', fontSize: '14px' }}>
                  {selectedContact
                    ? `${selectedContact.name} (@${selectedContact.username}) bilan hali xabarlar yo'q. Birinchi bo'lib yozing! 💖`
                    : "Hali xabarlar yo'q. Kontaktlar bo'limidan yaqiningizni qo'shing va yozishni boshlang! 💖"}
                </div>
              )}

              {displayedMessages.map((msg) => {
                const isMine = msg.sender_id === currentUser
                const theme = getThemeColors(isMine)
                const isGift = msg.content.startsWith('GIFT_ANIMATION|')
                let giftEmoji = '', giftName = ''
                if (isGift) {
                  const parts = msg.content.split('|')
                  giftEmoji = parts[1]; giftName = parts[2]
                }
                const isLetter = msg.content.startsWith('LETTER_CONTENT|')
                const letterBody = isLetter ? msg.content.replace('LETTER_CONTENT|', '') : ''
                const isOpened = openedLetterId === msg.id

                const isSticker = msg.content.includes('[STIKER:')
                const isVoice = msg.content.startsWith('VOICE_NOTE|')
                const voiceUrl = isVoice ? msg.content.replace('VOICE_NOTE|', '') : ''

                const isCallRecord = msg.content.includes('qo\'ng\'iroq amalga oshirildi')

                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', width: '100%' }}>
                    {isGift ? (
                      <div className="animated-bubble" style={{ padding: '14px 22px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(236,72,153,0.35), rgba(147,51,234,0.45))', border: '2px solid #f472b6', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '80%', boxSizing: 'border-box' }}>
                        <span style={{ fontSize: '36px' }}>{giftEmoji}</span>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#f472b6' }}>SEHRLI SOVG'A</div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', wordBreak: 'break-word' }}>{giftName}</div>
                        </div>
                      </div>
                    ) : isSticker ? (
                      <div className="animated-bubble" style={{ padding: '16px 22px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(219,39,119,0.3), rgba(147,51,234,0.3))', border: '2px solid #ec4899', textAlign: 'center', fontSize: '18px', fontWeight: 800, color: '#f472b6', boxShadow: '0 0 20px rgba(236,72,153,0.3)', maxWidth: '80%', boxSizing: 'border-box' }}>
                        {msg.content}
                      </div>
                    ) : isVoice ? (
                      <div className="animated-bubble" style={{ padding: '12px 16px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(147,51,234,0.35))', border: '1px solid #22d3ee', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                        <Volume2 size={24} color="#22d3ee" />
                        <audio controls src={voiceUrl} style={{ height: '36px', width: '180px' }} />
                      </div>
                    ) : isCallRecord ? (
                      <div style={{ margin: '0 auto', padding: '8px 16px', borderRadius: '999px', backgroundColor: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)', color: '#d8b4fe', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {msg.content.includes('Video') ? <Video size={14} color="#f472b6" /> : <PhoneCall size={14} color="#22d3ee" />}
                        {msg.content}
                      </div>
                    ) : isLetter ? (
                      <div onClick={() => setOpenedLetterId(isOpened ? null : msg.id)} className="animated-bubble" style={{ width: '100%', maxWidth: '300px', padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(219,39,119,0.3))', border: '2px solid #c084fc', cursor: 'pointer', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <Mail size={22} color="#f472b6" />
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#facc15' }}>{isOpened ? '💌 Ochilgan Maktub' : '💌 Maxfiy Maktub (Ochish)'}</span>
                        </div>
                        {isOpened && <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#09090b', borderRadius: '10px', fontSize: '13px', color: '#f3f4f6', lineHeight: '1.5', wordBreak: 'break-word' }}>{letterBody}</div>}
                      </div>
                    ) : (
                      <div className="animated-bubble" style={{ position: 'relative', maxWidth: '75%', padding: '12px 18px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: theme.bg, border: theme.border, boxSizing: 'border-box' }}>
                        <div style={{ fontSize: '14px', color: '#f3f4f6', lineHeight: '1.5', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                        <div style={{ fontSize: '10px', color: '#d8b4fe', marginTop: '6px', textAlign: 'right' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓</div>
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* KONTAKTLAR VA YAQINLAR BO'LIMI (SERVER BILAN BOG'LANGAN) */}
          {activeTab === 'contacts' && (
            <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
              
              {/* Mening ID ma'lumotim */}
              <div style={{ padding: '14px 18px', borderRadius: '16px', backgroundColor: 'rgba(236, 72, 153, 0.12)', border: '1px solid rgba(236, 72, 153, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '13px', color: '#f3f4f6' }}>
                  Sizning unikal ID manzilingiz (yaqiningizga yuboring): <strong style={{ color: '#22d3ee' }}>@{currentUser}</strong>
                </div>
              </div>

              {/* Yangi kontakt qo'shish kartochkasi */}
              <div style={{ padding: '22px', borderRadius: '20px', backgroundColor: '#18181b', border: '1px solid rgba(56, 189, 248, 0.4)', boxSizing: 'border-box', boxShadow: '0 0 25px rgba(56, 189, 248, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: 0 }}>Yangi Kontakt Qo'shish</h2>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Juftingizning ID yoki Gmail manzilini kiriting — serverda saqlanadi</div>
                  </div>
                </div>

                <form onSubmit={handleAddContact} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
                  <input
                    type="text"
                    value={newContactUsername}
                    onChange={(e) => setNewContactUsername(e.target.value)}
                    placeholder="ID yoki Email (masalan: @malikam)"
                    style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#09090b', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="Ism (masalan: Malikam 💖)"
                    style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#09090b', border: '1px solid rgba(168, 85, 247, 0.35)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button
                    type="submit"
                    disabled={isSavingContact}
                    style={{ padding: '12px 20px', borderRadius: '12px', border: 'none', background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 0 15px rgba(236, 72, 153, 0.35)', opacity: isSavingContact ? 0.7 : 1 }}
                  >
                    <UserPlus size={18} /> {isSavingContact ? 'Saqlanmoqda...' : "Kontaktga qo'shish"}
                  </button>
                </form>

                {contactFeedback && (
                  <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: contactFeedback.startsWith('✅') ? '#34d399' : '#f87171' }}>
                    {contactFeedback}
                  </div>
                )}
              </div>

              {/* Kontaktlar ro'yxati */}
              <div style={{ padding: '22px', borderRadius: '20px', backgroundColor: '#18181b', border: '1px solid rgba(168, 85, 247, 0.4)', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f472b6', margin: 0 }}>Mening Kontaktlarim</h3>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Serverdagi ulangan yaqinlar: {contacts.length} ta</div>
                    </div>
                  </div>
                </div>

                {contacts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: '14px' }}>
                    Hozircha kontaktlar ro'yxati bo'sh. Yuqoridan yaqiningizning ID yoki Emailini kiritib qo'shing! 💖
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {contacts.map((contact) => {
                      const isActive = selectedContact?.id === contact.id
                      return (
                        <div
                          key={contact.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 16px',
                            borderRadius: '16px',
                            backgroundColor: isActive ? 'rgba(147, 51, 234, 0.18)' : '#0c0a14',
                            border: isActive ? '1px solid #ec4899' : '1px solid rgba(168, 85, 247, 0.3)',
                            gap: '12px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                            <div className="animated-avatar-ring" style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: '#18181b' }}>
                              <img src={contact.avatar} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{contact.name}</span>
                                <Crown size={14} color="#facc15" />
                              </div>
                              <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '2px' }}>@{contact.username}</div>
                              <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>{contact.status}</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleSelectContactForChat(contact)}
                              style={{
                                padding: '9px 16px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(to right, #ec4899, #9333ea)',
                                color: '#fff',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <MessageCircle size={16} /> Yozish
                            </button>
                            <button
                              onClick={() => handleDeleteContact(contact.id)}
                              style={{
                                padding: '9px',
                                borderRadius: '12px',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Kontaktni o'chirish"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'gifts' && (
            <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f472b6', marginBottom: '12px' }}>🎁 Magik Sovg'alar Do'koni</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
                {ALL_GIFTS.map((gift) => (
                  <div key={gift.id} style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#18181b', border: '1px solid rgba(168, 85, 247, 0.35)', textAlign: 'center', boxSizing: 'border-box' }}>
                    <div style={{ fontSize: '42px', marginBottom: '8px' }}>{gift.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>{gift.name}</div>
                    <button onClick={() => sendGift(gift.emoji, gift.name)} style={{ width: '100%', marginTop: '10px', padding: '9px', borderRadius: '10px', border: 'none', background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>Yuborish ✨</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'letters' && (
            <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%', padding: '24px', borderRadius: '20px', backgroundColor: '#18181b', border: '1px solid rgba(168, 85, 247, 0.4)', boxSizing: 'border-box' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f472b6', marginBottom: '12px' }}>Maxfiy Sevgi Maktubi</h2>
              <textarea value={letterText} onChange={(e) => setLetterText(e.target.value)} placeholder="Maktub matni..." rows={5} style={{ width: '100%', padding: '14px', borderRadius: '14px', backgroundColor: '#09090b', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#fff', marginBottom: '16px', outline: 'none', boxSizing: 'border-box', fontSize: '14px' }} />
              <button onClick={sendLoveLetter} style={{ width: '100%', padding: '13px', borderRadius: '14px', border: 'none', background: 'linear-gradient(to right, #9333ea, #db2777)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>Maktubni Yuborish 💌</button>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', padding: '24px', borderRadius: '20px', backgroundColor: '#18181b', border: '1px solid rgba(52, 211, 153, 0.4)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#34d399', margin: 0 }}>📸 Xotiralar Albomi</h2>
              
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(52, 211, 153, 0.15)',
                    border: '1px dashed rgba(52, 211, 153, 0.6)',
                    color: '#34d399',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <Plus size={18} /> Rasm qo'shish
                  <input type="file" accept="image/*" onChange={handleMemoryPhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>

              {memories.length === 0 ? (
                <div
                  style={{
                    padding: '40px 20px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(52, 211, 153, 0.05)',
                    border: '1px solid rgba(52, 211, 153, 0.2)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '42px' }}>🥺💖</span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399', letterSpacing: '1px' }}>
                    "I Miss You so much..." ✨
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', maxWidth: '350px', lineHeight: '1.5' }}>
                    Hali birorta xotira rasmi yuklanmadi. Yuqoridagi tugmani bosib eng go'zal daqiqalaringizni qo'shing! 🌹
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                  {memories.map((url, idx) => (
                    <div key={idx} style={{ height: '160px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(52, 211, 153, 0.3)', boxSizing: 'border-box' }}><img src={url} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'couple' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
              <div
                style={{
                  padding: '36px 20px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, rgba(88,28,135,0.5), rgba(131,24,67,0.4))',
                  border: '1px solid rgba(236, 72, 153, 0.5)',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '38px' }}>💖</span>
                  <div
                    style={{
                      padding: '8px 18px',
                      borderRadius: '999px',
                      background: 'linear-gradient(to right, #ec4899, #9333ea)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '16px',
                      letterSpacing: '2px',
                      boxShadow: '0 0 20px rgba(236,72,153,0.8)',
                    }}
                  >
                    LOVE ✨
                  </div>
                  <span style={{ fontSize: '38px' }}>💘</span>
                </div>

                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f472b6', marginBottom: '8px' }}>
                  {relationshipStarted ? '💖 Sevgi vaqti soniyama-soniya o\'lchanmoqda...' : '⏳ Suhbat kutilmoqda'}
                </div>

                <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '1px', wordBreak: 'break-word' }}>
                  {days} kun : {hours} soat : {minutes} daqiqa : {seconds} soniya
                </div>
              </div>

              <div
                style={{
                  padding: '24px',
                  borderRadius: '24px',
                  backgroundColor: '#140c22',
                  border: '2px solid rgba(234, 179, 8, 0.5)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <Crown size={26} color="#facc15" />
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#facc15', margin: 0 }}>
                    Linksy Premium Imkoniyatlari
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { title: '👑 Oltin Ism va Maxsus Nishon', desc: 'Ismingiz va chat ramkangiz oltin rangda porlab turadi.' },
                    { title: '🏰 VIP Magik Sovg\'alar', desc: 'Sehrli qasr va olovli ajdarlarni cheklovsiz yuborish.' },
                    { title: '💌 Cheksiz Maxfiy Maktublar', desc: 'Xotiralar albomi va maxfiy konvertlarni kengaytirilgan hajmda saqlash.' },
                  ].map((item, idx) => (
                    <div key={idx} style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#1a1426', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#facc15' }}>{item.title}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px' }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
              <div
                style={{
                  padding: '24px',
                  borderRadius: '24px',
                  backgroundColor: '#18181b',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <div
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="animated-avatar-ring"
                  style={{ position: 'relative', width: '95px', height: '95px', borderRadius: '50%', overflow: 'hidden', marginBottom: '12px', cursor: 'zoom-in' }}
                  title="Rasmni katta qilib ko'rish"
                >
                  <img src={profileAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {profileName} 
                  <CheckCircle2 size={16} style={{ fill: 'url(#gradient-check-prof)', color: '#fff' }} />
                  <svg width="0" height="0">
                    <linearGradient id="gradient-check-prof" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop stopColor="#ec4899" offset="0%" />
                      <stop stopColor="#9333ea" offset="100%" />
                    </linearGradient>
                  </svg>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(147,51,234,0.35))', border: '1px solid rgba(244,114,182,0.6)', color: '#f472b6', padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, boxShadow: '0 0 10px rgba(236,72,153,0.4)' }}>
                    <Crown size={11} color="#facc15" /> ROYAL LOVE ✨
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#22d3ee', marginTop: '4px' }}>ID: @{currentUser}</div>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px', fontStyle: 'italic', wordBreak: 'break-word', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  "{profileBio}" <CheckCircle2 size={14} style={{ fill: '#34d399', color: '#fff' }} />
                </div>
              </div>

              {/* PROFILNI TAHRIRLASH */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '20px',
                  backgroundColor: '#18181b',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f472b6', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={18} /> Profilni Tahrirlash
                </h3>

                <div>
                  <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Profil rasmini o'zgartirish (Bazaga saqlanadi):</label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(168, 85, 247, 0.15)',
                      border: '1px dashed rgba(168, 85, 247, 0.6)',
                      color: '#d8b4fe',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    <Camera size={18} /> Yangi rasm tanlash
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Ismingiz:</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', backgroundColor: '#09090b', border: '1px solid rgba(168,85,247,0.3)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Bio (Status / Tavsif) - Yonida galichka bilan saqlanadi:</label>
                  <input
                    type="text"
                    value={profileBio}
                    onChange={(e) => handleBioChange(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', backgroundColor: '#09090b', border: '1px solid rgba(168,85,247,0.3)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* TARTIBLI MAXFIYLIK BO'LIMI */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '20px',
                  backgroundColor: '#18181b',
                  border: '1px solid rgba(236, 72, 153, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f472b6', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={18} /> Maxfiylik Sozlamalari
                </h3>

                {/* Online holati */}
                <div style={{ backgroundColor: '#0c0a14', borderRadius: '14px', border: '1px solid rgba(34, 211, 238, 0.3)', overflow: 'hidden' }}>
                  <div
                    onClick={() => setOnlineMenuOpen(!onlineMenuOpen)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee' }}>
                        <Eye size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Online holatini ko'rish</div>
                        <div style={{ fontSize: '11px', color: '#22d3ee', textTransform: 'capitalize' }}>Tanlangan: {onlineStatus}</div>
                      </div>
                    </div>
                    <ChevronRight size={18} color="#9ca3af" style={{ transform: onlineMenuOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                  </div>

                  {onlineMenuOpen && (
                    <div style={{ padding: '0 16px 14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        { id: 'all', label: 'Hamma' },
                        { id: 'contacts', label: 'Faqat Kontaktlar' },
                        { id: 'nobody', label: 'Hech kim' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => { setOnlineStatus(opt.id as any); setOnlineMenuOpen(false); }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            backgroundColor: onlineStatus === opt.id ? 'rgba(34, 211, 238, 0.25)' : '#18181b',
                            border: onlineStatus === opt.id ? '1px solid #22d3ee' : '1px solid transparent',
                            color: onlineStatus === opt.id ? '#22d3ee' : '#d1d5db',
                            fontSize: '13px',
                            fontWeight: 600,
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Xabar yozish ruxsati */}
                <div style={{ backgroundColor: '#0c0a14', borderRadius: '14px', border: '1px solid rgba(236, 72, 153, 0.3)', overflow: 'hidden' }}>
                  <div
                    onClick={() => setMessageMenuOpen(!messageMenuOpen)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
                        <Lock size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Kimlar xabar yoza oladi</div>
                        <div style={{ fontSize: '11px', color: '#f472b6', textTransform: 'capitalize' }}>Tanlangan: {messagePermission}</div>
                      </div>
                    </div>
                    <ChevronRight size={18} color="#9ca3af" style={{ transform: messageMenuOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                  </div>

                  {messageMenuOpen && (
                    <div style={{ padding: '0 16px 14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        { id: 'all', label: 'Hamma' },
                        { id: 'contacts', label: 'Faqat Kontaktlar' },
                        { id: 'nobody', label: 'Hech kim' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => { setMessagePermission(opt.id as any); setMessageMenuOpen(false); }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            backgroundColor: messagePermission === opt.id ? 'rgba(236, 72, 153, 0.25)' : '#18181b',
                            border: messagePermission === opt.id ? '1px solid #f472b6' : '1px solid transparent',
                            color: messagePermission === opt.id ? '#f472b6' : '#d1d5db',
                            fontSize: '13px',
                            fontWeight: 600,
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Qo'ng'iroqlar ruxsati */}
                <div style={{ backgroundColor: '#0c0a14', borderRadius: '14px', border: '1px solid rgba(168, 85, 247, 0.3)', overflow: 'hidden' }}>
                  <div
                    onClick={() => setCallMenuOpen(!callMenuOpen)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                        <PhoneCall size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Kimlar qo'ng'iroq qila oladi</div>
                        <div style={{ fontSize: '11px', color: '#c084fc', textTransform: 'capitalize' }}>Tanlangan: {callPermission}</div>
                      </div>
                    </div>
                    <ChevronRight size={18} color="#9ca3af" style={{ transform: callMenuOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                  </div>

                  {callMenuOpen && (
                    <div style={{ padding: '0 16px 14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        { id: 'all', label: 'Hamma' },
                        { id: 'contacts', label: 'Faqat Kontaktlar' },
                        { id: 'nobody', label: 'Hech kim' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => { setCallPermission(opt.id as any); setCallMenuOpen(false); }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            backgroundColor: callPermission === opt.id ? 'rgba(168, 85, 247, 0.25)' : '#18181b',
                            border: callPermission === opt.id ? '1px solid #c084fc' : '1px solid transparent',
                            color: callPermission === opt.id ? '#c084fc' : '#d1d5db',
                            fontSize: '13px',
                            fontWeight: 600,
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ilova paroli */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#0c0a14', borderRadius: '14px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#facc15' }}>
                      <KeyRound size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Ilova paroli (App Lock)</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>Maxfiylikni kuchaytirish</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setAppLockEnabled(!appLockEnabled)}
                    style={{ padding: '6px 14px', borderRadius: '10px', backgroundColor: appLockEnabled ? '#f59e0b' : '#27272a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                  >
                    {appLockEnabled ? 'Yoqilgan' : 'O\'chirilgan'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* INPUT QISMI */}
        {activeTab === 'chat' && (
          <div style={{ position: 'relative', flexShrink: '0', maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            {showEmojiPicker && (
              <div style={{ position: 'absolute', bottom: '100%', left: '16px', right: '16px', backgroundColor: '#121019', border: '1px solid rgba(168,85,247,0.4)', borderRadius: '16px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', zIndex: 40, boxShadow: '0 -4px 20px rgba(0,0,0,0.5)' }}>
                {EMOJI_LIST.map((emoji, idx) => (
                  <button key={idx} onClick={() => addEmojiToInput(emoji)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '6px', borderRadius: '8px', textAlign: 'center' }}>{emoji}</button>
                ))}
              </div>
            )}

            {showStickerPicker && (
              <div style={{ position: 'absolute', bottom: '100%', left: '16px', right: '16px', backgroundColor: '#121019', border: '1px solid rgba(236,72,153,0.4)', borderRadius: '16px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 40, boxShadow: '0 -4px 20px rgba(0,0,0,0.5)' }}>
                <div style={{ fontSize: '12px', color: '#f472b6', fontWeight: 700, marginBottom: '4px' }}>✨ Sevgi Stikerlarini tanlang:</div>
                {LOVE_STICKERS.map((st) => (
                  <button key={st.id} onClick={() => sendSticker(st.content)} style={{ padding: '10px', borderRadius: '12px', border: '1px solid rgba(236,72,153,0.3)', backgroundColor: 'rgba(236,72,153,0.15)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>
                    {st.label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={sendMessage} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderTop: '1px solid rgba(147, 51, 234, 0.3)', backgroundColor: '#0c0a14', boxSizing: 'border-box' }}>
              <button type="button" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowStickerPicker(false); }} style={{ background: 'none', border: 'none', color: '#f472b6', cursor: 'pointer', padding: '4px', flexShrink: 0 }} title="Emojilar">
                <Smile size={22} />
              </button>
              <button type="button" onClick={() => { setShowStickerPicker(!showStickerPicker); setShowEmojiPicker(false); }} style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', padding: '4px', fontSize: '18px', flexShrink: 0 }} title="Stikerlar">
                ✨
              </button>

              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  style={{ padding: '10px 14px', borderRadius: '12px', border: 'none', backgroundColor: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', animation: 'pulse 1s infinite' }}
                >
                  <Square size={16} /> To'xtatish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  style={{ background: 'none', border: 'none', color: '#22d3ee', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                  title="Ovozli xabar yozish"
                >
                  <Mic size={22} />
                </button>
              )}

              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={selectedContact ? `${selectedContact.name} ga xabar yozing... 💌` : 'Sehrli xabar yozing... 🏰💌'}
                style={{ flex: 1, minWidth: 0, padding: '12px 16px', borderRadius: '14px', backgroundColor: '#18181b', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
              <button type="submit" style={{ padding: '12px 20px', borderRadius: '14px', border: 'none', background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#ffffff', fontWeight: 600, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={18} />
              </button>
            </form>
          </div>
        )}

        {/* NAVIGATION BAR */}
        <nav style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderTop: '1px solid rgba(147, 51, 234, 0.3)', backgroundColor: '#09090b', padding: '10px 16px', flexShrink: 0, boxSizing: 'border-box', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          <button onClick={() => setActiveTab('chat')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: activeTab === 'chat' ? '#22d3ee' : '#6b7280', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}><MessageCircle size={20} /> Suhbat</button>
          <button onClick={() => setActiveTab('contacts')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: activeTab === 'contacts' ? '#38bdf8' : '#6b7280', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}><Users size={20} /> Kontaktlar</button>
          <button onClick={() => setActiveTab('gifts')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: activeTab === 'gifts' ? '#f472b6' : '#6b7280', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}><Gift size={20} /> Sovg'alar</button>
          <button onClick={() => setActiveTab('couple')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: activeTab === 'couple' ? '#c084fc' : '#6b7280', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}><CalendarHeart size={20} /> Juftlik</button>
          <button onClick={() => setActiveTab('profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: activeTab === 'profile' ? '#facc15' : '#6b7280', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}><User size={20} /> Profil</button>
        </nav>
      </div>
    </div>
  )
}