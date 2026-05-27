import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/login');
    else if (isAdmin) navigate('/admin');
    else navigate('/dashboard');
  }, [user, isAdmin, loading, navigate]);

  return null;
};

export default Index;
