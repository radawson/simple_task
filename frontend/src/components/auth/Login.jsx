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
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithSSO } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.username, formData.password);
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

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group mb-4">
              <MDBInput
                type="text"
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group mb-4">
              <MDBInput
                type={showPassword ? 'text' : 'password'}
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              >
                <MDBIcon
                  onClick={() => setShowPassword(!showPassword)}
                  className="trailing"
                  icon={showPassword ? 'eye-slash' : 'eye'}
                  style={{ cursor: 'pointer' }}
                />
              </MDBInput>
            </div>
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