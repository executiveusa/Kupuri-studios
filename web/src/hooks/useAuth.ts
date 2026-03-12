import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';

export const useAuth = () => {
  const router = useRouter();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    fetchProfile,
  } = useUserStore();

  // Initialize auth from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        useUserStore.setState({ token: storedToken, isAuthenticated: true });
        await fetchProfile();
      }
    };

    initAuth();
  }, [fetchProfile]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout: handleLogout,
    fetchProfile,
  };
};
