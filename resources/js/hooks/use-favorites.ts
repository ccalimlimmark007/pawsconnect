import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pawsconnect_favorites';

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const isFavorite = (id: string) => favorites.includes(id);

  const add = (id: string) => setFavorites((s) => (s.includes(id) ? s : [...s, id]));
  const remove = (id: string) => setFavorites((s) => s.filter((x) => x !== id));
  const toggle = (id: string) => (isFavorite(id) ? remove(id) : add(id));

  return { favorites, add, remove, toggle, isFavorite } as const;
}
