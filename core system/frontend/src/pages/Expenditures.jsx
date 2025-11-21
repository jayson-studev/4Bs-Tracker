import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { expendituresAPI, proposalsAPI } from '../services/api';
import { Plus, Upload, FileText, X } from 'lucide-react';

const Expenditures = () => {
  const { isTreasurer, isChairman } = useAuth();
  const [expenditures, setExpenditures] = useState([]);
  const [approvedProposals, setApprovedProposals] = useState([]);
  const [generalFundInfo, setGeneralFundInfo] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [rejectingExpenditureId, setRejectingExpenditureId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formErrors, setFormErrors] = useState({});
  const [uploadedFileName, setUploadedFileName] = useState('');

  const [formData, setFormData] = useState({
    supportingDocument: null,
    proposalId: '', // Required - link to a proposal
  });

  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedFundSource, setSelectedFundSource] = useState(null);

  useEffect(() => {
    fetchExpenditures();
    fetchGeneralFund();
    fetchApprovedProposals();
  }, []);

  const fetchExpenditures = async () => {
    try {
      const response = await expendituresAPI.getAll();
      setExpenditures(response.data.data);
    } catch (error) {
      console.error('Failed to fetch expenditures:', error);
    }
  };

  const fetchGeneralFund = async () => {
    try {
      const response = await expendituresAPI.getGeneralFund();
      setGeneralFundInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching general fund:', error);
    }
  };

  const fetchApprovedProposals = async () => {
    try {
      const response = await proposalsAPI.getAll();
      // Filter only approved proposals
      const approved = response.data.data.filter(proposal => proposal.status === 'APPROVED');
      setApprovedProposals(approved);
    } catch (error) {
      console.error('Failed to fetch approved proposals:', error);
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

  const handleProposalChange = (e) => {
    const proposalId = e.target.value;
    setFormData({ ...formData, proposalId });
    setFormErrors({ ...formErrors, proposalId: false });

    // Find and set the selected proposal details
    const proposal = approvedProposals.find(p => p._id === proposalId);
    setSelectedProposal(proposal || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Client-side validation
    const errors = {};
    if (!formData.proposalId) errors.proposalId = true;
    if (!formData.supportingDocument) errors.supportingDocument = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields including uploading a document',
      });
      return;
    }

    setLoading(true);

    try {
      await expendituresAPI.create(formData);
      setMessage({
        type: 'success',
        text: 'Expenditure submitted successfully and is pending approval',
      });
      setShowCreateModal(false);
      setFormData({
        supportingDocument: null,
        proposalId: '',
      });
      setSelectedProposal(null);
      setFormErrors({});
      setUploadedFileName('');
      fetchExpenditures();
      fetchGeneralFund();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit expenditure',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this expenditure?')) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await expendituresAPI.approve(id);
      setMessage({
        type: 'success',
        text: `Expenditure approved successfully. Blockchain TX: ${response.data.data.txHash || 'N/A'}`,
      });
      fetchExpenditures();
      fetchGeneralFund();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to approve expenditure',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (id) => {
    setRejectingExpenditureId(id);
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
      await expendituresAPI.reject(rejectingExpenditureId, rejectionReason);
      setMessage({
        type: 'success',
        text: 'Expenditure rejected successfully',
      });
      setShowRejectModal(false);
      setRejectionReason('');
      setRejectingExpenditureId(null);
      fetchExpenditures();
      fetchGeneralFund();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to reject expenditure',
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
            Expenditures
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isTreasurer
              ? 'Click on approved proposals below to record expenditures'
              : 'Review and approve expenditure requests'}
          </p>
        </div>
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
                  Income Balance
                </p>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: (Number(generalFundInfo.availableBalance) || 0) >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  PHP {(Number(generalFundInfo.availableBalance) || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Total Expenditures
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  PHP {(Number(generalFundInfo.totalExpenditures) || 0).toFixed(2)}
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

      {/* Approved Proposals by Fund Source */}
      {isTreasurer && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
              {selectedFundSource ? `${selectedFundSource} - Approved Proposals` : 'Select Fund Source Category'}
            </h2>
            {selectedFundSource && (
              <button
                onClick={() => setSelectedFundSource(null)}
                className="btn btn-outline"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                ← Back to Categories
              </button>
            )}
          </div>

          {approvedProposals.length === 0 ? (
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              No approved proposals available. Proposals must be approved before recording expenditures.
            </div>
          ) : !selectedFundSource ? (
            // Show Fund Source Categories
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {(() => {
                // Group proposals by fund source
                const groupedProposals = {};
                approvedProposals.forEach(proposal => {
                  if (!groupedProposals[proposal.fundSource]) {
                    groupedProposals[proposal.fundSource] = [];
                  }
                  groupedProposals[proposal.fundSource].push(proposal);
                });

                return Object.keys(groupedProposals).map((fundSource) => {
                  const proposals = groupedProposals[fundSource];
                  const totalAmount = proposals.reduce((sum, p) => sum + Number(p.amount), 0);
                  const recordedCount = proposals.filter(p =>
                    expenditures.some(exp => exp.proposalId === p._id && (exp.status === 'PROPOSED' || exp.status === 'APPROVED'))
                  ).length;

                  return (
                    <div
                      key={fundSource}
                      onClick={() => setSelectedFundSource(fundSource)}
                      style={{
                        border: '2px solid var(--primary)',
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        backgroundColor: 'var(--background)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>
                        {fundSource}
                      </h3>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span>Total Proposals:</span>
                          <span style={{ fontWeight: '600', color: 'var(--text)' }}>{proposals.length}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span>Expenditures Recorded:</span>
                          <span style={{ fontWeight: '600', color: 'var(--success)' }}>{recordedCount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Pending:</span>
                          <span style={{ fontWeight: '600', color: 'var(--warning)' }}>{proposals.length - recordedCount}</span>
                        </div>
                      </div>
                      <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          Total Amount
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>
                          PHP {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '500', marginTop: '1rem' }}>
                        Click to view proposals →
                      </p>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            // Show Proposals for Selected Fund Source
            <div style={{ display: 'grid', gap: '1rem' }}>
              {approvedProposals
                .filter(proposal => proposal.fundSource === selectedFundSource)
                .map((proposal) => {
                  const hasExpenditure = expenditures.some(exp =>
                    exp.proposalId === proposal._id && (exp.status === 'PROPOSED' || exp.status === 'APPROVED')
                  );

                  return (
                    <div
                      key={proposal._id}
                      onClick={() => {
                        if (!hasExpenditure) {
                          setFormData({ ...formData, proposalId: proposal._id });
                          setSelectedProposal(proposal);
                          setShowCreateModal(true);
                        }
                      }}
                      style={{
                        border: hasExpenditure ? '1px solid var(--border)' : '2px solid var(--primary)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        backgroundColor: hasExpenditure ? 'var(--background-secondary)' : 'var(--background)',
                        cursor: hasExpenditure ? 'not-allowed' : 'pointer',
                        opacity: hasExpenditure ? 0.6 : 1,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                            {proposal.purpose}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {proposal.expenseType}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--primary)' }}>
                            PHP {Number(proposal.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          {hasExpenditure && (
                            <span style={{
                              display: 'inline-block',
                              marginTop: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: 'var(--success-light)',
                              color: 'var(--success)',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              Expenditure Recorded
                            </span>
                          )}
                        </div>
                      </div>
                      {!hasExpenditure && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '500', marginTop: '0.5rem' }}>
                          Click to record expenditure for this proposal
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Expenditures List */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          {isChairman ? 'Pending Approvals' : 'My Expenditures'}
        </h2>
        {expenditures.length === 0 ? (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No expenditures to display. {isTreasurer && 'Click "New Expenditure" to create one.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {expenditures.map((expenditure) => (
              <div
                key={expenditure._id}
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
                      {expenditure.purpose}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Created by: {expenditure.createdBy?.fullName || 'N/A'}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      expenditure.status === 'APPROVED'
                        ? 'badge-success'
                        : expenditure.status === 'REJECTED'
                        ? 'badge-danger'
                        : 'badge-warning'
                    }`}
                  >
                    {expenditure.status}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Amount
                    </p>
                    <p style={{ fontWeight: '600' }}>
                      PHP {Number(expenditure.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Fund Source
                    </p>
                    <p style={{ fontWeight: '500' }}>{expenditure.fundSource}</p>
                  </div>
                  {expenditure.proposalId && (
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Linked Proposal
                      </p>
                      <p style={{ fontWeight: '500', fontSize: '0.75rem', fontFamily: 'monospace' }}>{expenditure.proposalId}</p>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Created
                    </p>
                    <p style={{ fontWeight: '500' }}>
                      {expenditure.createdAt && !isNaN(new Date(expenditure.createdAt).getTime())
                        ? new Date(expenditure.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                {expenditure.supportingDocument && (
                  <button
                    onClick={() => handleViewDocument(expenditure.supportingDocument)}
                    className="btn btn-outline"
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    <FileText size={16} />
                    <span>View Supporting Document</span>
                  </button>
                )}
                {isChairman && expenditure.status === 'PROPOSED' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      onClick={() => handleApprove(expenditure._id)}
                      className="btn btn-success"
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectClick(expenditure._id)}
                      className="btn btn-danger"
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {expenditure.status === 'APPROVED' && expenditure.txHash && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.375rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Blockchain TX
                    </p>
                    <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {expenditure.txHash}
                    </p>
                  </div>
                )}
                {expenditure.status === 'REJECTED' && expenditure.rejectionReason && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.375rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Rejection Reason
                    </p>
                    <p style={{ fontSize: '0.875rem' }}>{expenditure.rejectionReason}</p>
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                Record Expenditure from Approved Proposal
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Display selected proposal details */}
                {selectedProposal && (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem'
                  }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                      Proposal Details
                    </h4>
                    <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div>
                        <strong>Purpose:</strong>
                        <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>{selectedProposal.purpose}</p>
                      </div>
                      <div>
                        <strong>Amount:</strong> PHP {Number(selectedProposal.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div>
                        <strong>Fund Source:</strong> {selectedProposal.fundSource}
                      </div>
                      <div>
                        <strong>Expense Type:</strong> {selectedProposal.expenseType}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="supportingDocument" className="label">
                    Supporting Document *
                  </label>
                  <div
                    style={{
                      border: formErrors.supportingDocument ? '2px dashed #ef4444' : '2px dashed var(--border)',
                      borderRadius: '0.375rem',
                      padding: '1.5rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => document.getElementById('supportingDocument').click()}
                  >
                    <Upload size={32} color="var(--text-secondary)" style={{ margin: '0 auto 0.5rem' }} />
                    {uploadedFileName ? (
                      <>
                        <p style={{ fontSize: '0.875rem', color: 'var(--success)', fontWeight: '500' }}>
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
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      Accepted formats: PDF, JPG, JPEG, PNG
                    </p>
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
                    <span>Submit Expenditure</span>
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
                Reject Expenditure
              </h3>
            </div>
            <form onSubmit={handleReject}>
              <div className="modal-body">
                <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.875rem' }}>
                    Please provide a clear reason for rejecting this expenditure. This will be visible to the treasurer.
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
                    setRejectingExpenditureId(null);
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
                    <span>Reject Expenditure</span>
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

export default Expenditures;
