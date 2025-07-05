'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Callback() {
  const searchParams = useSearchParams()

  useEffect(() => {
    ;(async () => {
      const code = searchParams.get('code')
      if (!code) {
        alert('認証コードが見つかりません')
        return
      }
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        alert(`ログイン失敗: ${error.message}`)
        return
      }
      window.location.replace('/')
    })()
  }, [searchParams])

  return <p style={{ textAlign: 'center' }}>Signing&nbsp;in…</p>
}
