import type { Role } from './auth';

export interface AdminUserRecord {
  uid: string;
  username: string;
  email: string;
  role: Role;
  createdAt?: string;
  profilePicture?: string;
}

export interface AdminUserUpdatePayload {
  username: string;
  role: Role;
}

export interface AdminDashboardStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: number;
}

export type AdminRoleFilter = 'all' | Role;

export interface AdminUserDraft {
  username: string;
  role: Role;
}

export type AdminDraftState = Record<string, AdminUserDraft>;

export interface AdminHeroProps {
  title: string;
  description: string;
}

export interface AdminStatsGridProps {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: number;
}

export interface AdminFiltersProps {
  search: string;
  roleFilter: AdminRoleFilter;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: AdminRoleFilter) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export interface AdminUsersTableProps {
  users: AdminUserRecord[];
  drafts: AdminDraftState;
  currentUserUid?: string;
  isLoading: boolean;
  isSavingId: string | null;
  onDraftChange: (userId: string, field: keyof AdminUserDraft, value: string) => void;
  onSaveUser: (user: AdminUserRecord) => void;
}

export interface AdminNoticeProps {
  title: string;
  message: string;
}