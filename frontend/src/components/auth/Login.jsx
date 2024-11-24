import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MDBIcon,
  MDBInput,
  MDBBtn,
  MDBCard,
  MDBCardBody
} from 'mdb-react-ui-kit';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithSSO } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleSSOLogin = () => {
    loginWithSSO();
  };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <MDBCard>
        <MDBCardBody className="p-5">
          <h2 className="text-center mb-5">Login</h2>
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <MDBInput
              type="text"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mb-4"
              required
            />
            <MDBInput
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4"
              required
            >
              <MDBIcon
                onClick={() => setShowPassword(!showPassword)}
                className="trailing"
                icon={showPassword ? 'eye-slash' : 'eye'}
              />
            </MDBInput>
            <MDBBtn type="submit" block className="mb-4">
              Login
            </MDBBtn>
          </form>

          <div className="text-center">
            <p className="text-muted mb-4">- OR -</p>
            <MDBBtn
              color="danger"
              onClick={handleSSOLogin}
              block
            >
              <MDBIcon fab icon="windows" className="me-2" />
              PTX SSO
            </MDBBtn>
          </div>
        </MDBCardBody>
      </MDBCard>
    </div>
  );
}