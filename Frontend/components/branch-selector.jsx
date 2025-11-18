"use client";
import React, { useEffect, useState } from 'react';

export default function BranchSelector() {
  const [branch, setBranch] = useState(() => {
    try { return localStorage.getItem('selectedBranch') || 'A' } catch(e){ return 'A' }
  });

  useEffect(() => {
    try { localStorage.setItem('selectedBranch', branch); } catch(e){}
    try { window.dispatchEvent(new CustomEvent('branch-changed', { detail: { branch } })); } catch(e){}
  }, [branch]);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ color: '#cfe0ff', marginRight: 8 }}>Branch:</div>
      {['A','B','C'].map(b => (
        <button key={b} onClick={()=>setBranch(b)} className={`btn ${branch===b? 'btn-primary' : 'btn-outline'}`} style={{ padding: '6px 8px' }}>
          {b}
        </button>
      ))}
    </div>
  )
}
