import { useState } from 'react';
import { Link } from 'react-router-dom';
import { inviteAPI } from '../services/api';
import { Key, Copy, CheckCircle } from 'lucide-react';

const InitialSetup = () => {
  const [tokens, setTokens] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState({ chairman: false, treasurer: false });

  const generateTokens = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await inviteAPI.generateInitialTokens();
      setTokens(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate tokens');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, role) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [role]: true });
    setTimeout(() => {
      setCopied({ ...copied, [role]: false });
    }, 2000);
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
      <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Initial System Setup
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Generate invitation tokens for Chairman and Treasurer
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!tokens ? (
          <div style={{ textAlign: 'center' }}>
            <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                Important Information:
              </h3>
              <ul style={{ marginLeft: '1.5rem', fontSize: '0.875rem' }}>
                <li>This is a one-time setup for the first Chairman and Treasurer</li>
                <li>You will receive two invitation tokens</li>
                <li>Tokens are valid for 30 days</li>
                <li>Each token can only be used once</li>
                <li>Keep these tokens secure and share only with intended officials</li>
              </ul>
            </div>

            <button
              onClick={generateTokens}
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '200px' }}
            >
              {loading ? (
                <>
                  <span className="loading"></span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Key size={16} />
                  <span>Generate Tokens</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} />
                <span style={{ fontWeight: '600' }}>Tokens Generated Successfully!</span>
              </div>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Share these tokens with the respective officials. They will use these to register
                their accounts.
              </p>
            </div>

            {/* Chairman Token */}
            <div
              className="card"
              style={{ backgroundColor: 'var(--background)', marginBottom: '1rem' }}
            >
              <h3 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '1rem' }}>
                Chairman Token
              </h3>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <input
                  type="text"
                  value={tokens.chairman.token}
                  readOnly
                  className="input"
                  style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                />
                <button
                  onClick={() => copyToClipboard(tokens.chairman.token, 'chairman')}
                  className="btn btn-outline"
                  style={{ minWidth: '80px' }}
                >
                  {copied.chairman ? (
                    <>
                      <CheckCircle size={16} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Expires: {new Date(tokens.chairman.expiresAt).toLocaleDateString()}
              </p>
            </div>

            {/* Treasurer Token */}
            <div
              className="card"
              style={{ backgroundColor: 'var(--background)', marginBottom: '1.5rem' }}
            >
              <h3 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '1rem' }}>
                Treasurer Token
              </h3>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <input
                  type="text"
                  value={tokens.treasurer.token}
                  readOnly
                  className="input"
                  style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                />
                <button
                  onClick={() => copyToClipboard(tokens.treasurer.token, 'treasurer')}
                  className="btn btn-outline"
                  style={{ minWidth: '80px' }}
                >
                  {copied.treasurer ? (
                    <>
                      <CheckCircle size={16} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Expires: {new Date(tokens.treasurer.expiresAt).toLocaleDateString()}
              </p>
            </div>

            <div className="alert alert-warning">
              <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                Make sure to save these tokens now. You will not be able to retrieve them later.
              </p>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          <Link
            to="/login"
            style={{
              color: 'var(--primary)',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InitialSetup;
