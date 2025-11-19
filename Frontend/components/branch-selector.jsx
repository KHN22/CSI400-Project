"use client";
import React, { useEffect, useState } from 'react'
import { BACKEND_BASE } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

export default function BranchSelector(){
  const [branch, setBranch] = useState('A')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    let mounted = true
    async function load(){
      try{
        const res = await fetch(`${BACKEND_BASE}/api/auth/me`, { credentials: 'include' })
        if(!mounted) return
        if(res.ok){
          const payload = await res.json()
          const u = payload.user || payload || null
          setBranch(u?.branch || 'A')
        }
      }catch(e){}
    }
    load()
    return ()=>{ mounted = false }
  }, [])

  const setBranchRequest = async (b) => {
    setLoading(true)
    try{
      const res = await fetch(`${BACKEND_BASE}/api/auth/branch`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ branch: b })
      })
      if(res.ok){
        setBranch(b)
        const label = `Branch ${b}`
        try{ toast({ title: 'Branch updated', description: label }) }catch(e){}
        try{ localStorage.setItem('selectedBranch', b) }catch(e){}
        try{ window.dispatchEvent(new Event('branch-changed')) }catch(e){}
        try{ window.dispatchEvent(new Event('auth-changed')) }catch(e){}
      } else {
        const d = await res.json().catch(()=>({}))
        try{ toast({ title: 'Change branch failed', description: d.message || 'Could not change branch', variant: 'destructive' }) }catch(e){}
      }
    }catch(e){
      try{ toast({ title: 'Network error', description: 'Could not reach server', variant: 'destructive' }) }catch(e){}
    }finally{ setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <label style={{ fontSize: 14, opacity: 0.9 }}>Branch</label>
      <select value={branch || 'A'} onChange={(e)=>setBranchRequest(e.target.value || 'A')} disabled={loading} style={{ padding: 6, borderRadius: 6 }}>
        <option value="A">Branch A</option>
        <option value="B">Branch B</option>
        <option value="C">Branch C</option>
      </select>
    </div>
  )
}

