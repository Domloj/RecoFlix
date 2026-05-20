import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import type { UserMovieLists } from '../interfaces/movies';

/**
 * Returns whether a movie is liked/disliked by the user.
 */
export const getMovieStatus = async (userId: string, movieId: number): Promise<{ liked: boolean; disliked: boolean }> => {
  const docRef = doc(db, 'users', userId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return { liked: false, disliked: false };
  const data = snap.data() as UserMovieLists;
  const likes = data.liked_movie_ids || [];
  const dislikes = data.disliked_movie_ids || [];
  return { liked: likes.includes(movieId), disliked: dislikes.includes(movieId) };
};

export const getUserLikes = async (userId: string): Promise<number[]> => {
  const docRef = doc(db, 'users', userId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return [];
  const data = snap.data() as UserMovieLists;
  return data.liked_movie_ids || [];
};

export const getUserDislikes = async (userId: string): Promise<number[]> => {
  const docRef = doc(db, 'users', userId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return [];
  const data = snap.data() as UserMovieLists;
  return data.disliked_movie_ids || [];
};

/**
 * Toggle like: if present -> remove; otherwise add and remove from dislikes.
 */
export const toggleLike = async (userId: string, movieId: number) => {
  const docRef = doc(db, 'users', userId);
  const snap = await getDoc(docRef);
  const likes: number[] = snap.exists() ? (snap.data().liked_movie_ids || []) : [];
  const dislikes: number[] = snap.exists() ? (snap.data().disliked_movie_ids || []) : [];

  if (likes.includes(movieId)) {
    await updateDoc(docRef, { liked_movie_ids: arrayRemove(movieId) });
  } else {
    if (!snap.exists()) {
      await setDoc(docRef, { liked_movie_ids: [movieId] }, { merge: true });
    } else {
      await updateDoc(docRef, { liked_movie_ids: arrayUnion(movieId) });
    }
    if (dislikes.includes(movieId)) {
      await updateDoc(docRef, { disliked_movie_ids: arrayRemove(movieId) });
    }
  }
};

/**
 * Toggle dislike: if present -> remove; otherwise add and remove from likes.
 */
export const toggleDislike = async (userId: string, movieId: number) => {
  const docRef = doc(db, 'users', userId);
  const snap = await getDoc(docRef);
  const likes: number[] = snap.exists() ? (snap.data().liked_movie_ids || []) : [];
  const dislikes: number[] = snap.exists() ? (snap.data().disliked_movie_ids || []) : [];

  if (dislikes.includes(movieId)) {
    await updateDoc(docRef, { disliked_movie_ids: arrayRemove(movieId) });
  } else {
    if (!snap.exists()) {
      await setDoc(docRef, { disliked_movie_ids: [movieId] }, { merge: true });
    } else {
      await updateDoc(docRef, { disliked_movie_ids: arrayUnion(movieId) });
    }
    if (likes.includes(movieId)) {
      await updateDoc(docRef, { liked_movie_ids: arrayRemove(movieId) });
    }
  }
};

export default {
  getMovieStatus,
  getUserLikes,
  getUserDislikes,
  toggleLike,
  toggleDislike,
};
