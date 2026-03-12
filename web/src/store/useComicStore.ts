import { create } from 'zustand';

export interface Page {
  id: string;
  pageNumber: number;
  content: string;
  imageUrl?: string;
  choices?: Choice[];
}

export interface Choice {
  id: string;
  text: string;
  nextPageId?: string;
  consequence?: string;
}

export interface Comic {
  id: string;
  title: string;
  description?: string;
  theme: string;
  status: 'draft' | 'generating' | 'completed' | 'published';
  thumbnail?: string;
  pages?: Page[];
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

interface ComicState {
  comics: Comic[];
  currentComic: Comic | null;
  isLoading: boolean;
  error: string | null;
  generatingComicId: string | null;

  // Actions
  setComics: (comics: Comic[]) => void;
  setCurrentComic: (comic: Comic | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setGeneratingComicId: (id: string | null) => void;

  // API calls
  fetchComics: () => Promise<void>;
  fetchComic: (id: string) => Promise<void>;
  createComic: (title: string, description: string, theme: string) => Promise<Comic>;
  updateComic: (id: string, data: Partial<Comic>) => Promise<void>;
  deleteComic: (id: string) => Promise<void>;
  generateComic: (id: string) => Promise<void>;
  publishComic: (id: string) => Promise<void>;
}

export const useComicStore = create<ComicState>((set, get) => ({
  comics: [],
  currentComic: null,
  isLoading: false,
  error: null,
  generatingComicId: null,

  setComics: (comics) => set({ comics }),
  setCurrentComic: (comic) => set({ currentComic: comic }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setGeneratingComicId: (generatingComicId) => set({ generatingComicId }),

  fetchComics: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/comics', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch comics');

      const comics = await response.json();
      set({ comics, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch comics';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchComic: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/comics/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch comic');

      const comic = await response.json();
      set({ currentComic: comic, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch comic';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createComic: async (title: string, description: string, theme: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/comics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, theme }),
      });

      if (!response.ok) throw new Error('Failed to create comic');

      const comic = await response.json();
      set((state) => ({
        comics: [comic, ...state.comics],
        currentComic: comic,
        isLoading: false,
      }));
      return comic;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create comic';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateComic: async (id: string, data: Partial<Comic>) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/comics/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update comic');

      const updated = await response.json();
      set((state) => ({
        comics: state.comics.map((c) => (c.id === id ? updated : c)),
        currentComic: state.currentComic?.id === id ? updated : state.currentComic,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update comic';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteComic: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/comics/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete comic');

      set((state) => ({
        comics: state.comics.filter((c) => c.id !== id),
        currentComic: state.currentComic?.id === id ? null : state.currentComic,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete comic';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  generateComic: async (id: string) => {
    set({ generatingComicId: id, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/comics/${id}/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to generate comic');
      }

      const result = await response.json();

      // Re-fetch the comic to get updated content
      await get().fetchComic(id);

      set({ generatingComicId: null });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate comic';
      set({ error: message, generatingComicId: null });
      throw error;
    }
  },

  publishComic: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/comics/${id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to publish comic');

      // Re-fetch the comic to get updated status
      await get().fetchComic(id);

      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish comic';
      set({ error: message, isLoading: false });
      throw error;
    }
  },
}));
