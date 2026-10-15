"use client";

import { useEffect, useState, useCallback } from "react";
import { api, getToken } from "./api";

export type FavoriteType = "scholarship" | "conference";

export interface FavoritesState {
  scholarships: string[];
  conferences: string[];
}

const STORAGE_KEY = "scholarai.favorites.v1";
const EVENT_NAME = "scholarai:favorites-changed";

function getStoredFavorites(): FavoritesState {
  if (typeof window === "undefined") {
    return { scholarships: [], conferences: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { scholarships: [], conferences: [] };
    const parsed = JSON.parse(raw);
    return {
      scholarships: Array.isArray(parsed.scholarships) ? parsed.scholarships : [],
      conferences: Array.isArray(parsed.conferences) ? parsed.conferences : [],
    };
  } catch {
    return { scholarships: [], conferences: [] };
  }
}

function saveStoredFavorites(state: FavoritesState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: state }));
  } catch {}
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoritesState>(getStoredFavorites);

  useEffect(() => {
    // Initial sync from localStorage
    setFavorites(getStoredFavorites());

    // Listen to changes from any component or tab
    const handleUpdate = () => {
      setFavorites(getStoredFavorites());
    };
    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    // Optional background sync with API if logged in
    if (getToken()) {
      api
        .getFavorites()
        .then((res) => {
          if (!res.items) return;
          const remoteScholarships = res.items.filter((x) => x.itemType === "scholarship").map((x) => x.itemId);
          const remoteConferences = res.items.filter((x) => x.itemType === "conference").map((x) => x.itemId);

          setFavorites((prev) => {
            const merged: FavoritesState = {
              scholarships: Array.from(new Set([...prev.scholarships, ...remoteScholarships])),
              conferences: Array.from(new Set([...prev.conferences, ...remoteConferences])),
            };
            if (
              merged.scholarships.length !== prev.scholarships.length ||
              merged.conferences.length !== prev.conferences.length
            ) {
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            }
            return merged;
          });
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const isFavorite = useCallback(
    (id: string, type: FavoriteType): boolean => {
      const list = type === "scholarship" ? favorites.scholarships : favorites.conferences;
      return list.includes(id);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (id: string, type: FavoriteType) => {
      const current = getStoredFavorites();
      const list = type === "scholarship" ? current.scholarships : current.conferences;
      const exists = list.includes(id);

      const nextList = exists ? list.filter((x) => x !== id) : [...list, id];
      const nextState: FavoritesState = {
        ...current,
        [type === "scholarship" ? "scholarships" : "conferences"]: nextList,
      };

      saveStoredFavorites(nextState);
      setFavorites(nextState);

      // Async backend sync if user has token
      if (getToken()) {
        if (exists) {
          api.removeFavorite(id).catch(() => {});
        } else {
          api.addFavorite(id, type).catch(() => {});
        }
      }
    },
    []
  );

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    scholarshipCount: favorites.scholarships.length,
    conferenceCount: favorites.conferences.length,
    totalCount: favorites.scholarships.length + favorites.conferences.length,
  };
}
