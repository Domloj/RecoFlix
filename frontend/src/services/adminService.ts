import { fetchWithAuth } from './apiService';
import type {
  AdminDashboardStats,
  AdminUserRecord,
  AdminUserUpdatePayload,
} from '../interfaces/admin';

const parseCreatedAt = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const fetchAdminUsers = async (): Promise<AdminUserRecord[]> => {
  const response = await fetchWithAuth('/admin/users');

  return (response as AdminUserRecord[])
    .sort((left, right) => {
      const leftDate = parseCreatedAt(left.createdAt)?.getTime() ?? 0;
      const rightDate = parseCreatedAt(right.createdAt)?.getTime() ?? 0;

      return rightDate - leftDate;
    });
};

export const updateAdminUser = async (
  userId: string,
  payload: AdminUserUpdatePayload,
) => {
  await fetchWithAuth(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

export const buildAdminStats = (users: AdminUserRecord[]): AdminDashboardStats => {
  const totalUsers = users.length;
  const adminUsers = users.filter((user) => user.role === 'admin').length;
  const regularUsers = totalUsers - adminUsers;
  const recentThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const recentUsers = users.filter((user) => {
    const createdAt = parseCreatedAt(user.createdAt);
    return createdAt ? createdAt.getTime() >= recentThreshold : false;
  }).length;

  return {
    totalUsers,
    adminUsers,
    regularUsers,
    recentUsers,
  };
};