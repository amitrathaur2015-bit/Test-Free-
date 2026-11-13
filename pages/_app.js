import { useEffect, useState } from 'react';
import '../styles/globals.css';
import { loadFromSupabase } from '../lib/supabase-loader';

export default function App({ Component, pageProps }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadFromSupabase().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#64748b' }}>
        Loading...
      </div>
    );
  }

  return <Component {...pageProps} />;
}
