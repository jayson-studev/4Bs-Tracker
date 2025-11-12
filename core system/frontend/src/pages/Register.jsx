import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { inviteAPI } from '../services/api';
import { UserPlus, CheckCircle } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: '',
    inviteToken: tokenFromUrl || '',
    walletAddress: '',
    phone: '',
  });

  const [tokenInfo, setTokenInfo] = useState(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (formData.inviteToken && formData.inviteToken.length > 10) {
      verifyToken();
    }
  }, [formData.inviteToken]);

  const verifyToken = async () => {
    setVerifying(true);
    setError('');
    setTokenInfo(null);

    try {
      const response = await inviteAPI.verifyToken(formData.inviteToken);
      setTokenInfo(response.data.data);
      setFormData((prev) => ({
        ...prev,
        role: response.data.data.role,
        email: response.data.data.preAssignedEmail || prev.email,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invitation token');
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrors([]);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Validate phone format
    const phoneRegex = /^\+639\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Phone number must be in format: +639XXXXXXXXX');
      setLoading(false);
      return;
    }

    const { confirmPassword, phone, inviteToken, ...rest } = formData;

    // Map frontend field names to backend expected names
    const registrationData = {
      ...rest,
      phoneNumber: phone,
      token: inviteToken
    };

    const result = await register(registrationData);

    if (result.success) {
      // Registration successful - redirect to login
      navigate('/login', {
        state: {
          message: 'Account created successfully! Please login with your credentials.'
        }
      });
    } else {
      setError(result.message);
      if (result.details && result.details.length > 0) {
        setErrors(result.details);
      }
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--background)',
        padding: '1rem',
      }}
    >
      <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Register as a Barangay Official
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {errors.length > 0 && (
          <div className="alert alert-error">
            <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
              {errors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Invite Token */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="inviteToken" className="label">
              Invitation Token *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                id="inviteToken"
                name="inviteToken"
                className="input"
                value={formData.inviteToken}
                onChange={handleChange}
                required
                placeholder="Enter your invitation token"
                disabled={loading}
              />
              {verifying && (
                <div
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <span className="loading"></span>
                </div>
              )}
              {tokenInfo && (
                <div
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--success)',
                  }}
                >
                  <CheckCircle size={20} />
                </div>
              )}
            </div>
            {tokenInfo && (
              <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                Valid token for {tokenInfo.role} position
                {tokenInfo.preAssignedEmail && ` (${tokenInfo.preAssignedEmail})`}
              </p>
            )}
          </div>

          {/* Role - Auto-filled from token */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="role" className="label">
              Role
            </label>
            <input
              type="text"
              id="role"
              className="input"
              value={formData.role}
              disabled
              placeholder="Will be auto-filled after token verification"
            />
          </div>

          {/* Full Name */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="fullName" className="label">
              Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="input"
              value={formData.fullName}
              onChange={handleChange}
              required
              placeholder="Juan Dela Cruz"
              disabled={loading || !tokenInfo}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" className="label">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
              disabled={loading || !tokenInfo || tokenInfo?.preAssignedEmail}
            />
            {tokenInfo?.preAssignedEmail && (
              <p style={{ fontSize: '0.75rem', color: 'var(--info)', marginTop: '0.25rem' }}>
                Email pre-assigned by administrator
              </p>
            )}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="phone" className="label">
              Phone Number * (Format: +639XXXXXXXXX)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="input"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+639123456789"
              disabled={loading || !tokenInfo}
            />
          </div>

          {/* Wallet Address */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="walletAddress" className="label">
              Wallet Address *
            </label>
            <input
              type="text"
              id="walletAddress"
              name="walletAddress"
              className="input"
              value={formData.walletAddress}
              onChange={handleChange}
              required
              placeholder="0x..."
              disabled={loading || !tokenInfo}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password" className="label">
              Password * (Minimum 6 characters)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter password"
              disabled={loading || !tokenInfo}
            />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="confirmPassword" className="label">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm password"
              disabled={loading || !tokenInfo}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '1rem' }}
            disabled={loading || !tokenInfo}
          >
            {loading ? (
              <>
                <span className="loading"></span>
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Create Account</span>
              </>
            )}
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
            </span>
            <Link
              to="/login"
              style={{
                color: 'var(--primary)',
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
