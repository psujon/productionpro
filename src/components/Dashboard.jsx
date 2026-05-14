import { useEffect } from 'react';
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import { Outlet, useNavigate } from 'react-router-dom';

// Dashboard acts as an auth guard for routes under /dashboard
const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user]);

  return <Outlet />;
};

export default Dashboard;
