'use client'
import Link from "next/link";
import { useState } from "react";
import { supabase } from '../../lib/supabaseClient'
export default function CreateAcc() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('')
    if (!email || !password) return setMessage('Email and password required')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if ( error ) setMessage(error.message)
    else {
      if (data.session) {
      } else {
        setMessage("Please check your email to confirm registration")
      }
    }
    setLoading(false)
  }
  return (
    <div className="flex flex-col justify-center items-center min-h-screen text-white bg-buGray">
      <div className="bg-buRed p-6 rounded-lg shadow-lg w-96">
        <h1 className="mb-4 text-center">Create an account for SparkBytes!</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="email" placeholder="Email" required value={email} onChange={e=>setEmail(e.target.value)} className="p-2 border-b-1 border-buGray" />
          <input type="password" placeholder="Password" required value={password} onChange={e=>setPassword(e.target.value)} className="p-2 border-b-1 border-buGray" />
          <button type="submit" className="mt-4 bg-white text-buRed font-bold py-2 px-4 rounded-3xl hover:bg-gray-200 min-w-full"
          disabled={loading}>{loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        {message && <small>{message}</small>}
        <div className="text-center mt-4 min-w-full">
          <Link href="/signin">Already have an Account? Sign in</Link>
        </div>
      </div> 
    </div>
  );
}
  