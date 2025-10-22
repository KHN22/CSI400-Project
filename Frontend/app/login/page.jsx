'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    email: '',
    confirmPassword: ''
  })
  const [registerError, setRegisterError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please enter email and password.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        // adjust redirect target as needed
        router.push('/')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data?.message || 'Invalid credentials')
      }
    } catch (err) {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegisterError('')
    
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Passwords do not match')
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerData.username,
          password: registerData.password,
          email: registerData.email
        }),
      })
      if (response.ok) {
        setShowRegister(false)
        setEmail(registerData.email)
      }
    } catch (error) {
      setRegisterError('Registration failed')
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 24, border: '1px solid #e6e6e6', borderRadius: 8, backgroundColor: '#1a1a2e' }}>
      <h1 style={{ marginBottom: 16, fontSize: 24, fontWeight: 500 }}>Login</h1>

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              padding: 8,
              marginTop: 6,
              boxSizing: 'border-box',
              border: '1px solid #ccc',
              borderRadius: 4,
            }}
            required
          />
        </label>

        <label style={{ display: 'block', marginBottom: 12 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              padding: 8,
              marginTop: 6,
              boxSizing: 'border-box',
              border: '1px solid #ccc',
              borderRadius: 4,
            }}
            required
          />
        </label>

        {error && <div style={{ color: '#b00020', marginBottom: 12 }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 10,
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        Don't have an account? <button onClick={() => setShowRegister(true)} style={{ color: '#0070f3', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Register</button>
      </p>

      {showRegister && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            backgroundColor: '#1a1a2e',
            padding: 24,
            borderRadius: 8,
            width: '90%',
            maxWidth: 400
          }}>
            <h2 style={{ marginBottom: 16 }}>Register</h2>
            <form onSubmit={handleRegister}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Username
                <input
                  type="text"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 8,
                    marginTop: 6,
                    boxSizing: 'border-box',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                  }}
                  required
                />
              </label>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Email
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 8,
                    marginTop: 6,
                    boxSizing: 'border-box',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                  }}
                  required
                />
              </label>
              <label style={{ display: 'block', marginBottom: 12 }}>
                Password
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 8,
                    marginTop: 6,
                    boxSizing: 'border-box',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                  }}
                  required
                />
              </label>
              <label style={{ display: 'block', marginBottom: 12 }}>
                Confirm Password
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 8,
                    marginTop: 6,
                    boxSizing: 'border-box',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                  }}
                  required
                />
              </label>
              {registerError && <div style={{ color: '#b00020', marginBottom: 12 }}>{registerError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: 10,
                    background: '#0070f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  style={{
                    flex: 1,
                    padding: 10,
                    background: '#666',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
