'use client';

import { useAuth } from '@/context/AuthContext';

export default function UserDebugPage() {
  const { user, load_user } = useAuth();

  if (load_user) {
    return <p style={{ padding: '20px' }}>Loading user...</p>;
  }

  if (!user) {
    return <p style={{ padding: '20px' }}>No user logged in.</p>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1 style={{ marginBottom: '20px' }}>User Debug Info</h1>

      <pre
        style={{
          background: '#f4f4f4',
          padding: '20px',
          borderRadius: '8px',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          fontSize: '14px',
        }}
      >
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}
