import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'pawsconnect_favorites';

function getCsrfToken(): string {
    try {
        return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';
    } catch {
        return '';
    }
}

type FavoritesCtx = {
    favorites: string[];
    isFavorite: (id: string) => boolean;
    toggle: (id: string, petName?: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesCtx | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<string[]>(() => {
        try {
            const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
            return raw ? (JSON.parse(raw) as string[]) : [];
        } catch {
            return [];
        }
    });

    // Ref so toggle() always reads the latest list without needing it as a dep.
    const favoritesRef = useRef(favorites);
    useEffect(() => { favoritesRef.current = favorites; }, [favorites]);

    // Single fetch on mount — replaces the per-card fetch that caused race conditions.
    useEffect(() => {
        let active = true;
        fetch('/api/favorites', {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(r => (r.ok ? r.json() : null))
            .then((json: { favorites?: string[] } | null) => {
                if (active && Array.isArray(json?.favorites)) {
                    setFavorites(json.favorites);
                }
            })
            .catch(() => {});
        return () => { active = false; };
    }, []);

    // Always mirror to localStorage so the next page load starts with correct state.
    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)); } catch {}
    }, [favorites]);

    const isFavorite = useCallback((id: string) => favoritesRef.current.includes(id), []);

    const toggle = useCallback(async (id: string, petName?: string) => {
        const adding = !favoritesRef.current.includes(id);

        // Optimistic update — heart responds immediately.
        setFavorites(prev => adding ? [...prev, id] : prev.filter(x => x !== id));

        try {
            const res = await fetch('/api/favorites/toggle', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ id }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => res.status.toString());
                throw new Error(`HTTP ${res.status}: ${text}`);
            }

            const json = await res.json() as { favorites: string[]; added: boolean };

            // Reconcile with server truth (handles concurrent toggles correctly).
            setFavorites(json.favorites);

            if (petName) {
                if (json.added) {
                    toast.success(`${petName} saved to favorites!`);
                } else {
                    toast(`Removed ${petName} from favorites`, { icon: '🤍' });
                }
            }
        } catch (err) {
            // Revert the optimistic update.
            setFavorites(prev => adding ? prev.filter(x => x !== id) : [...prev, id]);
            console.error('[Favorites] toggle failed for pet', id, err);
            toast.error("Couldn't save — please try again.");
        }
    }, []);

    return (
        <FavoritesContext.Provider value={{ favorites, isFavorite, toggle }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavoritesContext(): FavoritesCtx {
    const ctx = useContext(FavoritesContext);
    if (!ctx) throw new Error('useFavoritesContext must be used inside <FavoritesProvider>');
    return ctx;
}
