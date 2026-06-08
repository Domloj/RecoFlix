// imports/setup
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  getMovieStatus,
  getUserLikes,
  getUserDislikes,
  toggleLike,
  toggleDislike,
} from '../../src/services/userLikesService';

// mocking
vi.mock('../../src/config/firebase', () => ({
  db: {},
}));

const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockArrayUnion = vi.fn((...values: number[]) => ({ type: 'arrayUnion', values }));
const mockArrayRemove = vi.fn((...values: number[]) => ({ type: 'arrayRemove', values }));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  arrayUnion: (...args: number[]) => mockArrayUnion(...args),
  arrayRemove: (...args: number[]) => mockArrayRemove(...args),
}));

// structure
describe('userLikesService', () => {
  const userId = 'user-123';
  const movieId = 42;
  const docRef = { path: `users/${userId}` };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue(docRef);
  });

  it('returns default status when user doc does not exist', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({ exists: () => false });

    // Act
    const result = await getMovieStatus(userId, movieId);

    // Assert
    expect(result).toEqual({ liked: false, disliked: false });
    expect(mockGetDoc).toHaveBeenCalledWith(docRef);
  });

  it('returns status based on liked/disliked arrays', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ liked_movie_ids: [movieId], disliked_movie_ids: [7] }),
    });

    // Act
    const result = await getMovieStatus(userId, movieId);

    // Assert
    expect(result).toEqual({ liked: true, disliked: false });
  });

  it('returns empty list when likes doc is missing', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({ exists: () => false });

    // Act
    const result = await getUserLikes(userId);

    // Assert
    expect(result).toEqual([]);
  });

  it('returns liked_movie_ids when present', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ liked_movie_ids: [1, 2, 3] }),
    });

    // Act
    const result = await getUserLikes(userId);

    // Assert
    expect(result).toEqual([1, 2, 3]);
  });

  it('returns empty list when dislikes doc is missing', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({ exists: () => false });

    // Act
    const result = await getUserDislikes(userId);

    // Assert
    expect(result).toEqual([]);
  });

  it('returns disliked_movie_ids when present', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ disliked_movie_ids: [9, 10] }),
    });

    // Act
    const result = await getUserDislikes(userId);

    // Assert
    expect(result).toEqual([9, 10]);
  });

  it('removes like when already liked', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ liked_movie_ids: [movieId], disliked_movie_ids: [] }),
    });

    // Act
    await toggleLike(userId, movieId);

    // Assert
    expect(mockUpdateDoc).toHaveBeenCalledWith(docRef, {
      liked_movie_ids: { type: 'arrayRemove', values: [movieId] },
    });
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('adds like and clears dislike when needed', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ liked_movie_ids: [], disliked_movie_ids: [movieId] }),
    });

    // Act
    await toggleLike(userId, movieId);

    // Assert
    expect(mockUpdateDoc).toHaveBeenCalledWith(docRef, {
      liked_movie_ids: { type: 'arrayUnion', values: [movieId] },
    });
    expect(mockUpdateDoc).toHaveBeenCalledWith(docRef, {
      disliked_movie_ids: { type: 'arrayRemove', values: [movieId] },
    });
  });

  it('creates user doc with liked_movie_ids when missing', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({ exists: () => false });

    // Act
    await toggleLike(userId, movieId);

    // Assert
    expect(mockSetDoc).toHaveBeenCalledWith(docRef, { liked_movie_ids: [movieId] }, { merge: true });
  });

  it('removes dislike when already disliked', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ liked_movie_ids: [], disliked_movie_ids: [movieId] }),
    });

    // Act
    await toggleDislike(userId, movieId);

    // Assert
    expect(mockUpdateDoc).toHaveBeenCalledWith(docRef, {
      disliked_movie_ids: { type: 'arrayRemove', values: [movieId] },
    });
  });

  it('adds dislike and clears like when needed', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ liked_movie_ids: [movieId], disliked_movie_ids: [] }),
    });

    // Act
    await toggleDislike(userId, movieId);

    // Assert
    expect(mockUpdateDoc).toHaveBeenCalledWith(docRef, {
      disliked_movie_ids: { type: 'arrayUnion', values: [movieId] },
    });
    expect(mockUpdateDoc).toHaveBeenCalledWith(docRef, {
      liked_movie_ids: { type: 'arrayRemove', values: [movieId] },
    });
  });

  it('creates user doc with disliked_movie_ids when missing', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({ exists: () => false });

    // Act
    await toggleDislike(userId, movieId);

    // Assert
    expect(mockSetDoc).toHaveBeenCalledWith(docRef, { disliked_movie_ids: [movieId] }, { merge: true });
  });
});