import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pawsconnect_favorites';

function getCsrfToken() {
  try {
    const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    return el?.content || '';
  } catch {
    return '';
  }
}

export default function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [source, setSource] = useState<'local' | 'server'>('local');

  // Try to fetch server-side favorites if authenticated
  useEffect(() => {
    let mounted = true;
    async function fetchServer() {
      try {
        const res = await fetch('/favorites');
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.favorites)) {
            setFavorites(json.favorites);
            setSource('server');
            return;
          }
        }
      } catch (e) {
        // ignore — fallback to local
      }
    }
    fetchServer();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    try {
      if (source === 'local') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      }
    } catch {}
  }, [favorites, source]);

  const isFavorite = (id: string) => favorites.includes(id);

  const addLocal = (id: string) => setFavorites((s) => (s.includes(id) ? s : [...s, id]));
  const removeLocal = (id: string) => setFavorites((s) => s.filter((x) => x !== id));

  const toggle = async (id: string) => {
    // If server source is available, call server API
    if (source === 'server') {
      try {
        const res = await fetch('/favorites/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
          },
          body: JSON.stringify({ id }),
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.favorites)) {
            setFavorites(json.favorites);
            return;
          }
        }
      } catch (e) {
        // fallthrough to local toggle
      }
    }

    // local fallback
    setFavorites((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    setSource('local');
  };

  const add = (id: string) => addLocal(id);
  const remove = (id: string) => removeLocal(id);

  return { favorites, add, remove, toggle, isFavorite } as const;
}
