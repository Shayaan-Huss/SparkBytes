'use client'

import { useState } from 'react'
import { Space, Input, Card } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Signin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!email || !password) {
      alert('Please enter your email and password.')
      return
    }
    if (!/@bu\.edu$/i.test(email)) {
      alert('Please use your BU email (@bu.edu)')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert('Sign in successful!')
      // redirect to home page after signing in
      router.push('/')
    }
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen text-white">
      <form onSubmit={handleSignIn} className="w-full max-w-[400px]">
        <Card
          className="!bg-buRed"
          title={<h1 className="!text-white">Sign in with BU email</h1>}
          style={{
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
          }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input
              className="!bg-white"
              placeholder="BU email"
              variant="filled"
              size="large"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onPressEnter={handleSignIn}
            />
            <Input.Password
              className="!bg-white"
              placeholder="Password"
              variant="filled"
              size="large"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onPressEnter={handleSignIn}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-buRed font-bold py-2 px-4 rounded-3xl hover:bg-gray-200 min-w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <Space direction="horizontal" size={7}>
              <Link href="/createAcc" className="!text-white" style={{ fontSize: 15 }}>
                Don&lsquo;t have an account? Sign up
              </Link>
            </Space>
          </Space>
        </Card>
      </form>
    </div>
  )
}