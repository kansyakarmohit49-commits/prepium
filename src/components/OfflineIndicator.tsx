import React, { useState, useEffect } from 'react';
import { WifiOff, Database } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-slate-200 border border-slate-700/60 shadow-xl animate-in slide-in-from-bottom duration-300">
      <WifiOff className="w-4 h-4 text-emerald-400" />
      <span>Offline Mode — All data is safely stored in local DataStore</span>
      <Database className="w-3.5 h-3.5 text-sky-400 ml-1" />
    </div>
  );
};
