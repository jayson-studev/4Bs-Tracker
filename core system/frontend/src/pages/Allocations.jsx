import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { allocationsAPI, proposalsAPI } from '../services/api';
import { Plus, Upload, FileText, X } from 'lucide-react';

const Allocations = () => {
  const { isTreasurer, isChairman } = useAuth();
  const [allocationTypes, setAllocationTypes] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [categoryBudgets, setCategoryBudgets] = useState(null);
  const [generalFundInfo, setGeneralFundInfo] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [rejectingAllocationId, setRejectingAllocationId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formErrors, setFormErrors] = useState({});
  const [uploadedFileName, setUploadedFileName] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    fundSource: '',
    supportingDocument: null,
  });

  useEffect(() => {
    fetchAllocationTypes();
    fetchAllocations();
    fetchGeneralFund();
    fetchCategoryBudgets();
  }, []);

  const fetchAllocationTypes = async () => {
    try {
      const response = await allocationsAPI.getTypes();
      setAllocationTypes(response.data.data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to fetch allocation types',
      });
    }
  };

  const fetchAllocations = async () => {
    try {
      const response = await allocationsAPI.getAll();
      setAllocations(response.data.data);
    } catch (error) {
      console.error('Failed to fetch allocations:', error);
    }
  };

  const fetchGeneralFund = async () => {
    try {
      const response = await allocationsAPI.getGeneralFund();
      setGeneralFundInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching general fund:', error);
    }
  };

  const fetchCategoryBudgets = async () => {
    try {
      const response = await proposalsAPI.getCategoryBudgets();
      setCategoryBudgets(response.data.data);
    } catch (error) {
      console.error('Error fetching category budgets:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFileName(file.name);
      setFormErrors({ ...formErrors, supportingDocument: false });
      // Convert to base64
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
    setMessage({ type: '', text: '' });

    // Client-side validation
    const errors = {};
    if (!formData.purpose) errors.purpose = true;
    if (!formData.amount) errors.amount = true;
    if (!formData.fundSource) errors.fundSource = true;
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
      await allocationsAPI.create(formData);
      setMessage({
        type: 'success',
        text: 'Allocation submitted successfully and is pending approval',
      });
      setShowCreateModal(false);
      setFormData({
        amount: '',
        purpose: '',
        fundSource: '',
        supportingDocument: null,
      });
      setFormErrors({});
      setUploadedFileName('');
      fetchAllocations();
      fetchGeneralFund();
      fetchCategoryBudgets();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit allocation',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this allocation?')) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await allocationsAPI.approve(id);
      setMessage({
        type: 'success',
        text: `Allocation approved successfully. Blockchain TX: ${response.data.data.txHash || 'N/A'}`,
      });
      fetchAllocations();
      fetchGeneralFund();
      fetchCategoryBudgets();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to approve allocation',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (id) => {
    setRejectingAllocationId(id);
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
      await allocationsAPI.reject(rejectingAllocationId, rejectionReason);
      setMessage({
        type: 'success',
        text: 'Allocation rejected successfully',
      });
      setShowRejectModal(false);
      setRejectionReason('');
      setRejectingAllocationId(null);
      fetchAllocations();
      fetchGeneralFund();
      fetchCategoryBudgets();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to reject allocation',
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
            Allocations
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isTreasurer
              ? 'Submit and manage budget allocations'
              : 'Review and approve allocation requests'}
          </p>
        </div>
        {isTreasurer && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>New Allocation</span>
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
                  Available Income
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
                  Total Allocations
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  PHP {(Number(generalFundInfo.totalAllocations) || 0).toFixed(2)}
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

      {/* Category Budgets */}
      {categoryBudgets && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Available Allocation Types
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {allocationTypes.map((type, index) => {
              const budget = categoryBudgets.categoryBudgets[type];
              return (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--background)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                  }}
                >
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {type}
                  </h3>
                  {budget ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span>Allocated:</span>
                        <span style={{ fontWeight: '600', color: 'var(--text)' }}>
                          PHP {(Number(budget.allocated) || 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span>Spent (Proposals):</span>
                        <span style={{ fontWeight: '600', color: 'var(--warning)' }}>
                          PHP {(Number(budget.spent) || 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Available Balance:</span>
                        <span style={{ fontWeight: '600', color: (Number(budget.remaining) || 0) > 0 ? 'var(--success)' : 'var(--danger)' }}>
                          PHP {(Number(budget.remaining) || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No allocations yet
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Allocations List */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          {isChairman ? 'Pending Approvals' : 'My Allocations'}
        </h2>
        {allocations.length === 0 ? (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No allocations to display. {isTreasurer && 'Click "New Allocation" to create one.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {allocations.map((allocation) => (
              <div
                key={allocation._id}
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
                      {allocation.purpose}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Created by: {allocation.createdBy?.fullName || 'N/A'}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      allocation.status === 'APPROVED'
                        ? 'badge-success'
                        : allocation.status === 'REJECTED'
                        ? 'badge-danger'
                        : 'badge-warning'
                    }`}
                  >
                    {allocation.status}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Amount
                    </p>
                    <p style={{ fontWeight: '600' }}>
                      PHP {Number(allocation.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Fund Source
                    </p>
                    <p style={{ fontWeight: '500' }}>{allocation.fundSource}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Created
                    </p>
                    <p style={{ fontWeight: '500' }}>
                      {allocation.createdAt && !isNaN(new Date(allocation.createdAt).getTime())
                        ? new Date(allocation.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                {allocation.supportingDocument && (
                  <button
                    onClick={() => handleViewDocument(allocation.supportingDocument)}
                    className="btn btn-outline"
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    <FileText size={16} />
                    <span>View Supporting Document</span>
                  </button>
                )}
                {isChairman && allocation.status === 'PROPOSED' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      onClick={() => handleApprove(allocation._id)}
                      className="btn btn-success"
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectClick(allocation._id)}
                      className="btn btn-danger"
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {allocation.status === 'APPROVED' && allocation.txHash && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.375rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Blockchain TX
                    </p>
                    <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {allocation.txHash}
                    </p>
                  </div>
                )}
                {allocation.status === 'REJECTED' && allocation.rejectionReason && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.375rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Rejection Reason
                    </p>
                    <p style={{ fontSize: '0.875rem' }}>{allocation.rejectionReason}</p>
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
                Submit New Allocation
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="purpose" className="label">
                    Purpose/Allocation Type *
                  </label>
                  <select
                    id="purpose"
                    name="purpose"
                    className="select"
                    value={formData.purpose}
                    onChange={(e) => {
                      setFormData({ ...formData, purpose: e.target.value });
                      setFormErrors({ ...formErrors, purpose: false });
                    }}
                    required
                    style={{
                      borderColor: formErrors.purpose ? '#ef4444' : undefined,
                      borderWidth: formErrors.purpose ? '2px' : undefined,
                    }}
                  >
                    <option value="">Select allocation type</option>
                    {allocationTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
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
                  <input
                    type="text"
                    id="fundSource"
                    name="fundSource"
                    className="input"
                    value={formData.fundSource}
                    onChange={(e) => {
                      setFormData({ ...formData, fundSource: e.target.value });
                      setFormErrors({ ...formErrors, fundSource: false });
                    }}
                    required
                    placeholder="e.g., General Fund, Special Fund"
                    style={{
                      borderColor: formErrors.fundSource ? '#ef4444' : undefined,
                      borderWidth: formErrors.fundSource ? '2px' : undefined,
                    }}
                  />
                  {formErrors.fundSource && (
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
                    <span>Submit Allocation</span>
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
                Reject Allocation
              </h3>
            </div>
            <form onSubmit={handleReject}>
              <div className="modal-body">
                <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.875rem' }}>
                    Please provide a clear reason for rejecting this allocation. This will be visible to the treasurer.
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
                    setRejectingAllocationId(null);
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
                    <span>Reject Allocation</span>
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

export default Allocations;
