'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Callback() {
  useEffect(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // @ts-expect-error getSessionFromUrl は実行時に存在する
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
