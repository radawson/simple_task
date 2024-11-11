import { Navigate, useLocation } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';

const EditRoute = ({ children }) => {
  const location = useLocation();
  const token = AuthService.getCurrentToken();
  const user = AuthService.getCurrentUser();

  if (!token || !user) {
    return children({ canEdit: false });
  }

  return children({ canEdit: true });
};

export default EditRoute;