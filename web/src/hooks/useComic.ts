import { useCallback } from 'react';
import { useComicStore } from '@/store/useComicStore';

export const useComic = () => {
  const {
    comics,
    currentComic,
    isLoading,
    error,
    generatingComicId,
    fetchComics,
    fetchComic,
    createComic,
    updateComic,
    deleteComic,
    generateComic,
    publishComic,
  } = useComicStore();

  const handleCreateComic = useCallback(
    async (title: string, description: string, theme: string) => {
      return createComic(title, description, theme);
    },
    [createComic]
  );

  const handleGenerateComic = useCallback(
    async (id: string) => {
      return generateComic(id);
    },
    [generateComic]
  );

  const isGenerating = generatingComicId !== null;

  return {
    comics,
    currentComic,
    isLoading,
    error,
    isGenerating,
    generatingComicId,
    fetchComics,
    fetchComic,
    createComic: handleCreateComic,
    updateComic,
    deleteComic,
    generateComic: handleGenerateComic,
    publishComic,
  };
};
