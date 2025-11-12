import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { proposalsAPI } from '../services/api';
import { Plus, Upload, FileText, X } from 'lucide-react';

const Proposals = () => {
  const { isTreasurer, isChairman } = useAuth();
  const [fundSources, setFundSources] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [generalFundInfo, setGeneralFundInfo] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [rejectingProposalId, setRejectingProposalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    fundSource: '',
    expenseType: '',
    proposer: '',
    supportingDocument: null,
  });

  const [formErrors, setFormErrors] = useState({});
  const [uploadedFileName, setUploadedFileName] = useState('');

  useEffect(() => {
    fetchFundSources();
    fetchProposals();
    fetchGeneralFund();
  }, []);

  const fetchFundSources = async () => {
    try {
      const response = await proposalsAPI.getFundSources();
      setFundSources(response.data.data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to fetch fund sources',
      });
    }
  };

  const fetchProposals = async () => {
    try {
      const response = await proposalsAPI.getAll();
      setProposals(response.data.data);
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    }
  };

  const fetchGeneralFund = async () => {
    try {
      const response = await proposalsAPI.getGeneralFund();
      setGeneralFundInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching general fund:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFileName(file.name);
      setFormErrors({ ...formErrors, supportingDocument: false });
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          supportingDocument: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation with error highlighting
    const errors = {};
    if (!formData.purpose) errors.purpose = true;
    if (!formData.amount) errors.amount = true;
    if (!formData.fundSource) errors.fundSource = true;
    if (!formData.expenseType) errors.expenseType = true;
    if (!formData.proposer) errors.proposer = true;
    if (!formData.supportingDocument) errors.supportingDocument = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields including uploading a document',
      });
      return;
    }

    setFormErrors({});
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await proposalsAPI.create(formData);
      setMessage({
        type: 'success',
        text: 'Proposal submitted successfully and is pending approval',
      });
      setShowCreateModal(false);
      setFormData({
        amount: '',
        purpose: '',
        fundSource: '',
        expenseType: '',
        proposer: '',
        supportingDocument: null,
      });
      setUploadedFileName('');
      setFormErrors({});
      // Refresh proposals list
      fetchProposals();
      fetchGeneralFund();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit proposal',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this proposal?')) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await proposalsAPI.approve(id);
      setMessage({
        type: 'success',
        text: `Proposal approved successfully. Blockchain TX: ${response.data.data.txHash || 'N/A'}`,
      });
      fetchProposals();
      fetchGeneralFund();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to approve proposal',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (id) => {
    setRejectingProposalId(id);
    setShowRejectModal(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();

    if (!rejectionReason.trim()) {
      setMessage({
        type: 'error',
        text: 'Please provide a reason for rejection',
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await proposalsAPI.reject(rejectingProposalId, rejectionReason);
      setMessage({
        type: 'success',
        text: 'Proposal rejected successfully',
      });
      setShowRejectModal(false);
      setRejectionReason('');
      setRejectingProposalId(null);
      fetchProposals();
      fetchGeneralFund();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to reject proposal',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Proposals
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isTreasurer
              ? 'Submit and manage financial proposals'
              : 'Review and approve proposal requests'}
          </p>
        </div>
        {isTreasurer && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>New Proposal</span>
          </button>
        )}
      </div>

      {/* General Fund Information Card */}
      {generalFundInfo && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--card-bg)', border: '2px solid var(--primary)' }}>
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>
              Financial Summary
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Total Income (General Fund)
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  PHP {generalFundInfo.generalFund.toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Available Balance
                </p>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: generalFundInfo.availableBalance >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  PHP {generalFundInfo.availableBalance.toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Total Proposals
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  PHP {generalFundInfo.totalProposals.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      {/* Fund Sources Info */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Available Fund Sources
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
          {fundSources.map((source, index) => (
            <div
              key={index}
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--background)',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
              }}
            >
              {source}
            </div>
          ))}
        </div>
      </div>

      {/* Proposals List */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          {isChairman ? 'Pending Approvals' : 'My Proposals'}
        </h2>
        {proposals.length === 0 ? (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No proposals to display. {isTreasurer && 'Click "New Proposal" to create one.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {proposals.map((proposal) => (
              <div
                key={proposal._id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  backgroundColor: 'var(--background)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      {proposal.purpose}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Proposed by: {proposal.proposer}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      proposal.status === 'APPROVED'
                        ? 'badge-success'
                        : proposal.status === 'REJECTED'
                        ? 'badge-danger'
                        : 'badge-warning'
                    }`}
                  >
                    {proposal.status}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Amount
                    </p>
                    <p style={{ fontWeight: '600' }}>
                      PHP {Number(proposal.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Fund Source
                    </p>
                    <p style={{ fontWeight: '500' }}>{proposal.fundSource}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Expense Type
                    </p>
                    <p style={{ fontWeight: '500' }}>{proposal.expenseType}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Created
                    </p>
                    <p style={{ fontWeight: '500' }}>
                      {proposal.recordedAt && !isNaN(new Date(proposal.recordedAt).getTime())
                        ? new Date(proposal.recordedAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                {proposal.supportingDocument && (
                  <button
                    onClick={() => handleViewDocument(proposal.supportingDocument)}
                    className="btn btn-outline"
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    <FileText size={16} />
                    <span>View Supporting Document</span>
                  </button>
                )}
                {isChairman && proposal.status === 'PROPOSED' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      onClick={() => handleApprove(proposal._id)}
                      className="btn btn-success"
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectClick(proposal._id)}
                      className="btn btn-danger"
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {proposal.status === 'APPROVED' && proposal.txHash && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.375rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Blockchain TX
                    </p>
                    <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {proposal.txHash}
                    </p>
                  </div>
                )}
                {proposal.status === 'REJECTED' && proposal.rejectionReason && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.375rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Rejection Reason
                    </p>
                    <p style={{ fontSize: '0.875rem' }}>{proposal.rejectionReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                Submit New Proposal
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="purpose" className="label">
                    Purpose *
                  </label>
                  <textarea
                    id="purpose"
                    name="purpose"
                    className="textarea"
                    value={formData.purpose}
                    onChange={(e) => {
                      setFormData({ ...formData, purpose: e.target.value });
                      setFormErrors({ ...formErrors, purpose: false });
                    }}
                    required
                    placeholder="Describe the purpose of this proposal..."
                    style={{
                      borderColor: formErrors.purpose ? '#ef4444' : undefined,
                      borderWidth: formErrors.purpose ? '2px' : undefined,
                    }}
                  />
                  {formErrors.purpose && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      This field is required
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="amount" className="label">
                    Amount (PHP) *
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    className="input"
                    value={formData.amount}
                    onChange={(e) => {
                      setFormData({ ...formData, amount: e.target.value });
                      setFormErrors({ ...formErrors, amount: false });
                    }}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    style={{
                      borderColor: formErrors.amount ? '#ef4444' : undefined,
                      borderWidth: formErrors.amount ? '2px' : undefined,
                    }}
                  />
                  {formErrors.amount && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      This field is required
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="fundSource" className="label">
                    Fund Source *
                  </label>
                  <select
                    id="fundSource"
                    name="fundSource"
                    className="select"
                    value={formData.fundSource}
                    onChange={(e) => {
                      setFormData({ ...formData, fundSource: e.target.value });
                      setFormErrors({ ...formErrors, fundSource: false });
                    }}
                    required
                    style={{
                      borderColor: formErrors.fundSource ? '#ef4444' : undefined,
                      borderWidth: formErrors.fundSource ? '2px' : undefined,
                    }}
                  >
                    <option value="">Select fund source</option>
                    {fundSources.map((source, index) => (
                      <option key={index} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                  {formErrors.fundSource && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      This field is required
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="expenseType" className="label">
                    Expense Type *
                  </label>
                  <input
                    type="text"
                    id="expenseType"
                    name="expenseType"
                    className="input"
                    value={formData.expenseType}
                    onChange={(e) => {
                      setFormData({ ...formData, expenseType: e.target.value });
                      setFormErrors({ ...formErrors, expenseType: false });
                    }}
                    required
                    placeholder="e.g., Infrastructure, Services, Supplies"
                    style={{
                      borderColor: formErrors.expenseType ? '#ef4444' : undefined,
                      borderWidth: formErrors.expenseType ? '2px' : undefined,
                    }}
                  />
                  {formErrors.expenseType && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      This field is required
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="proposer" className="label">
                    Proposer (Name/Role) *
                  </label>
                  <input
                    type="text"
                    id="proposer"
                    name="proposer"
                    className="input"
                    value={formData.proposer}
                    onChange={(e) => {
                      setFormData({ ...formData, proposer: e.target.value });
                      setFormErrors({ ...formErrors, proposer: false });
                    }}
                    required
                    placeholder="e.g., Barangay Captain - Juan Dela Cruz"
                    style={{
                      borderColor: formErrors.proposer ? '#ef4444' : undefined,
                      borderWidth: formErrors.proposer ? '2px' : undefined,
                    }}
                  />
                  {formErrors.proposer && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      This field is required
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="supportingDocument" className="label">
                    Supporting Document *
                  </label>
                  <div
                    style={{
                      border: `2px dashed ${formErrors.supportingDocument ? '#ef4444' : 'var(--border)'}`,
                      borderRadius: '0.375rem',
                      padding: '1.5rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: formErrors.supportingDocument ? 'rgba(239, 68, 68, 0.05)' : undefined,
                    }}
                    onClick={() => document.getElementById('supportingDocument').click()}
                  >
                    <Upload size={32} color={formErrors.supportingDocument ? '#ef4444' : 'var(--text-secondary)'} style={{ margin: '0 auto 0.5rem' }} />
                    {uploadedFileName ? (
                      <>
                        <p style={{ fontSize: '0.875rem', color: 'var(--success)', fontWeight: '500', marginBottom: '0.25rem' }}>
                          Document uploaded successfully
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {uploadedFileName}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                          Click to change document
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize: '0.875rem', color: formErrors.supportingDocument ? '#ef4444' : 'var(--text-secondary)' }}>
                        {formErrors.supportingDocument ? 'Document required - Click to upload' : 'Click to upload document'}
                      </p>
                    )}
                    <input
                      type="file"
                      id="supportingDocument"
                      onChange={handleFileChange}
                      required
                      style={{ display: 'none' }}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>
                  {formErrors.supportingDocument && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Please upload a supporting document
                    </p>
                  )}
                  {uploadedFileName && !formErrors.supportingDocument && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Accepted formats: PDF, JPG, JPEG, PNG
                    </p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Proposal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                Reject Proposal
              </h3>
            </div>
            <form onSubmit={handleReject}>
              <div className="modal-body">
                <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.875rem' }}>
                    Please provide a clear reason for rejecting this proposal. This will be visible to the treasurer.
                  </p>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="rejectionReason" className="label">
                    Rejection Reason *
                  </label>
                  <textarea
                    id="rejectionReason"
                    name="rejectionReason"
                    className="textarea"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    placeholder="Enter the reason for rejection..."
                    rows="4"
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setRejectingProposalId(null);
                  }}
                  className="btn btn-outline"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading"></span>
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <span>Reject Proposal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="modal-overlay" onClick={() => setShowDocumentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                Supporting Document
              </h3>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="btn btn-outline"
                style={{ padding: '0.5rem' }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0, maxHeight: '70vh', overflow: 'auto' }}>
              {selectedDocument.startsWith('data:application/pdf') ? (
                <iframe
                  src={selectedDocument}
                  style={{ width: '100%', height: '70vh', border: 'none' }}
                  title="Document Viewer"
                />
              ) : (
                <img
                  src={selectedDocument}
                  alt="Supporting Document"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              )}
            </div>
            <div className="modal-footer">
              <a
                href={selectedDocument}
                download="document"
                className="btn btn-primary"
              >
                Download Document
              </a>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proposals;
