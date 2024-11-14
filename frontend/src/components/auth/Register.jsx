// src/components/auth/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MDBInput, 
  MDBBtn, 
  MDBCard, 
  MDBCardBody, 
  MDBValidation,
  MDBValidationItem
} from 'mdb-react-ui-kit';
import { AuthService } from '../../services/auth.service';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await AuthService.register({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName
      });
      navigate('/login', { 
        state: { message: 'Registration successful. Please login.' } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <MDBCard>
        <MDBCardBody className="p-5">
          <h2 className="text-center mb-5">Register</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <MDBValidation onSubmit={handleSubmit} noValidate>
            <MDBValidationItem feedback='Please enter your email' invalid>
              <MDBInput
                type="email"
                name="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mb-4"
              />
            </MDBValidationItem>

            <MDBValidationItem feedback='Please enter your first name' invalid>
              <MDBInput
                type="text"
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="mb-4"
              />
            </MDBValidationItem>

            <MDBValidationItem feedback='Please enter your last name' invalid>
              <MDBInput
                type="text"
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="mb-4"
              />
            </MDBValidationItem>

            <MDBValidationItem feedback='Password is required' invalid>
              <MDBInput
                type="password"
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="mb-4"
              />
            </MDBValidationItem>

            <MDBValidationItem feedback='Please confirm your password' invalid>
              <MDBInput
                type="password"
                name="confirmPassword"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="mb-4"
              />
            </MDBValidationItem>

            <MDBBtn type="submit" block>
              Register
            </MDBBtn>
          </MDBValidation>
        </MDBCardBody>
      </MDBCard>
    </div>
  );
};

export default Register;