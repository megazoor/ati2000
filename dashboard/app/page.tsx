'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError('Password is required')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // In a real app, validate with an actual endpoint
      // For now, just store in localStorage for demo
      localStorage.setItem('auth_token', password)
      
      // Navigate to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      setError('Invalid password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-primary-700 dark:text-primary-300">
            AdvancedTraderAI
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Trading Automation Platform
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Dashboard Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700"
              placeholder="Enter your dashboard password"
            />
            {error && (
              <p className="mt-1 text-sm text-danger-500">{error}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary w-full ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-8 pt-4 border-t border-secondary-200 dark:border-secondary-700 text-center text-xs text-secondary-600 dark:text-secondary-400">
          AdvancedTraderAI &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}