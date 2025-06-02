'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Callback() {
  useEffect(() => {
    (async () => {
      const { error } = await (supabase.auth as any).getSessionFromUrl({ storeSession: true })
      if (error) {
        alert(`ログイン失敗: ${error.message}`)
        return
      }
      window.location.replace('/')
    })()
  }, [])
  return <p style={{ textAlign: 'center' }}>Signing&nbsp;in…</p>
}
