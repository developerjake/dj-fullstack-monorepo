import { useEffect, useState } from 'react';
import './App.css';

type ApiStatus = 'idle' | 'loading' | 'ok' | 'error';

export const App = () => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('idle');
  const [apiMessage, setApiMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const checkApi = async () => {
      setApiStatus('loading');
      try {
        const response = await fetch('/api');
        const text = await response.text();
        if (cancelled) {
          return;
        }
        if (!response.ok) {
          setApiStatus('error');
          setApiMessage(`HTTP ${response.status}`);
          return;
        }
        setApiStatus('ok');
        setApiMessage(text);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setApiStatus('error');
        setApiMessage(error instanceof Error ? error.message : 'Request failed');
      }
    };

    void checkApi();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="app">
      <p className="eyebrow">Starter template</p>
      <h1>Fullstack Monorepo</h1>
      <p className="lede">
        React + Vite frontend talking to the Nest API through the Vite{' '}
        <code>/api</code> proxy.
      </p>
      <p className={`api-status api-status--${apiStatus}`} role="status">
        {apiStatus === 'loading' && 'Checking API…'}
        {apiStatus === 'ok' && `API: ${apiMessage}`}
        {apiStatus === 'error' && `API unreachable: ${apiMessage}`}
        {apiStatus === 'idle' && 'API check not started'}
      </p>
    </main>
  );
};
