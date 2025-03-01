import { useAuthStore } from '@/stores/useAuthStore';

export function UserDropdown() {
  const { user, logout } = useAuthStore();

  // ... 其他代码
}
