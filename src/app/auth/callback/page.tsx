'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Callback() {
  useEffect(() => {
    (async () => {
      const {
        error,
      } = await supabase.auth.exchangeCodeForSession({ storeSession: true })
      if (error) {
        alert(`ログイン失敗: ${error.message}`)
        return
      }
      window.location.replace('/')
    })()
  }, [])
  return <p style={{ textAlign: 'center' }}>Signing&nbsp;in…</p>
}
