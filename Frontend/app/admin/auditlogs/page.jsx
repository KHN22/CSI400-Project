"use client";
import React from 'react'
import AuditLogsPanel from '@/components/AuditLogsPanel'

export default function AuditLogsPage(){
  return (
    <div style={{ padding: 20 }}>
      <h1>Audit Logs</h1>
      <AuditLogsPanel />
    </div>
  )
}
