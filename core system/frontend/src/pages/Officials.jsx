import { useState, useEffect } from 'react';
import { inviteAPI, officialsAPI } from '../services/api';
import { Key, Copy, CheckCircle, Users as UsersIcon, Mail, Phone, Wallet, Calendar, CheckCircle2, XCircle } from 'lucide-react';

const Officials = () => {
  const [showGenerateTokensModal, setShowGenerateTokensModal] = useState(false);
  const [tokens, setTokens] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copied, setCopied] = useState({ chairman: false, treasurer: false });
  const [officials, setOfficials] = useState([]);

  const [tokenForm, setTokenForm] = useState({
    chairmanEmail: '',
    treasurerEmail: '',
  });

  useEffect(() => {
    fetchOfficials();
  }, []);

  const fetchOfficials = async () => {
    try {
      const response = await officialsAPI.getAll();
      setOfficials(response.data.data);
    } catch (error) {
      console.error('Failed to fetch officials:', error);
    }
  };

  const handleGenerateTokens = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = {};
      if (tokenForm.chairmanEmail) {
        data.chairmanEmail = tokenForm.chairmanEmail;
      }
      if (tokenForm.treasurerEmail) {
        data.treasurerEmail = tokenForm.treasurerEmail;
      }

      const response = await inviteAPI.generateSuccessionTokens(data);
      setTokens(response.data.data);
      setMessage({
        type: 'success',
        text: 'Succession tokens generated successfully',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to generate tokens',
      });
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
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Officials Management
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage barangay officials and generate succession tokens
        </p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      {/* Generate Succession Tokens */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Generate Succession Tokens
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Generate invitation tokens for the next term's Chairman and Treasurer. You can optionally
          pre-assign email addresses.
        </p>
        <button
          onClick={() => setShowGenerateTokensModal(true)}
          className="btn btn-primary"
        >
          <Key size={16} />
          <span>Generate Tokens</span>
        </button>
      </div>

      {/* Current Officials List */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Current Officials
        </h2>
        {officials.length === 0 ? (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            <UsersIcon size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem' }} />
            <p>No officials registered yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
            {officials.map((official) => (
              <div
                key={official._id}
                className="card"
                style={{
                  backgroundColor: 'var(--background)',
                  border: official.isActive ? '2px solid var(--success)' : '2px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {official.fullName}
                    </h3>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: official.role === 'Chairman' ? 'var(--primary-light)' : 'var(--secondary-light)',
                        color: official.role === 'Chairman' ? 'var(--primary)' : 'var(--secondary)',
                      }}
                    >
                      {official.role}
                    </span>
                  </div>
                  {official.isActive ? (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: 'var(--success-light)',
                        color: 'var(--success)',
                      }}
                    >
                      <CheckCircle2 size={14} />
                      Active
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: 'var(--error-light)',
                        color: 'var(--error)',
                      }}
                    >
                      <XCircle size={14} />
                      Inactive
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Mail size={16} />
                    <span>{official.email}</span>
                  </div>
                  {official.phoneNumber && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <Phone size={16} />
                      <span>{official.phoneNumber}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Wallet size={16} />
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {official.walletAddress.substring(0, 10)}...{official.walletAddress.substring(official.walletAddress.length - 8)}
                    </span>
                  </div>
                  {official.termStart && official.termEnd && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <Calendar size={16} />
                      <span>
                        {new Date(official.termStart).toLocaleDateString()} - {new Date(official.termEnd).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Tokens Modal */}
      {showGenerateTokensModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateTokensModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                Generate Succession Tokens
              </h3>
            </div>

            {!tokens ? (
              <form onSubmit={handleGenerateTokens}>
                <div className="modal-body">
                  <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                      Optional Email Pre-Assignment
                    </h4>
                    <p style={{ fontSize: '0.875rem' }}>
                      You can optionally pre-assign email addresses for the next term officials.
                      If provided, only those email addresses can use the respective tokens.
                      Leave blank if you want to allow any email to use the tokens.
                    </p>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="chairmanEmail" className="label">
                      Chairman Email (Optional)
                    </label>
                    <input
                      type="email"
                      id="chairmanEmail"
                      name="chairmanEmail"
                      className="input"
                      value={tokenForm.chairmanEmail}
                      onChange={(e) =>
                        setTokenForm({ ...tokenForm, chairmanEmail: e.target.value })
                      }
                      placeholder="chairman@example.com"
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="treasurerEmail" className="label">
                      Treasurer Email (Optional)
                    </label>
                    <input
                      type="email"
                      id="treasurerEmail"
                      name="treasurerEmail"
                      className="input"
                      value={tokenForm.treasurerEmail}
                      onChange={(e) =>
                        setTokenForm({ ...tokenForm, treasurerEmail: e.target.value })
                      }
                      placeholder="treasurer@example.com"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setShowGenerateTokensModal(false)}
                    className="btn btn-outline"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
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
              </form>
            ) : (
              <>
                <div className="modal-body">
                  <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={20} />
                      <span style={{ fontWeight: '600' }}>Tokens Generated Successfully!</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      Share these tokens with the next term officials. They will use these to register
                      their accounts.
                    </p>
                  </div>

                  {/* Chairman Token */}
                  <div
                    className="card"
                    style={{ backgroundColor: 'var(--background)', marginBottom: '1rem' }}
                  >
                    <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '1rem' }}>
                      Chairman Token
                    </h4>
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
                      {tokens.chairman.preAssignedEmail && (
                        <> • Pre-assigned to: {tokens.chairman.preAssignedEmail}</>
                      )}
                    </p>
                  </div>

                  {/* Treasurer Token */}
                  <div
                    className="card"
                    style={{ backgroundColor: 'var(--background)', marginBottom: '1rem' }}
                  >
                    <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '1rem' }}>
                      Treasurer Token
                    </h4>
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
                      {tokens.treasurer.preAssignedEmail && (
                        <> • Pre-assigned to: {tokens.treasurer.preAssignedEmail}</>
                      )}
                    </p>
                  </div>

                  <div className="alert alert-warning">
                    <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                      Make sure to save these tokens now. You will not be able to retrieve them later.
                    </p>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    onClick={() => {
                      setShowGenerateTokensModal(false);
                      setTokens(null);
                      setTokenForm({ chairmanEmail: '', treasurerEmail: '' });
                    }}
                    className="btn btn-primary"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Officials;
