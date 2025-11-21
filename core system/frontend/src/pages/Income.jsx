import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { incomeAPI } from '../services/api';
import { Plus, Upload, TrendingUp, FileText } from 'lucide-react';

const Income = () => {
  const { isTreasurer } = useAuth();
  const [revenueTypes, setRevenueTypes] = useState([]);
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [generalFundInfo, setGeneralFundInfo] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formErrors, setFormErrors] = useState({});
  const [uploadedFileName, setUploadedFileName] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    revenueSource: '',
    supportingDocument: null,
  });

  useEffect(() => {
    fetchRevenueTypes();
    fetchIncomeRecords();
    fetchGeneralFund();
  }, []);

  const fetchGeneralFund = async () => {
    try {
      const response = await incomeAPI.getGeneralFund();
      setGeneralFundInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching general fund:', error);
    }
  };

  const fetchRevenueTypes = async () => {
    try {
      const response = await incomeAPI.getTypes();
      setRevenueTypes(response.data.data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to fetch revenue types',
      });
    }
  };

  const fetchIncomeRecords = async () => {
    try {
      const response = await incomeAPI.getAll();
      setIncomeRecords(response.data.data);
    } catch (error) {
      console.error('Failed to fetch income records:', error);
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

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validate all required fields
    const errors = {};
    if (!formData.revenueSource) errors.revenueSource = true;
    if (!formData.amount) errors.amount = true;
    if (!formData.supportingDocument) errors.supportingDocument = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields including uploading a document',
      });
      setLoading(false);
      return;
    }

    try {
      const response = await incomeAPI.record(formData);
      const data = response.data.data;

      // Refresh the income records list first
      await fetchIncomeRecords();
      await fetchGeneralFund();

      setMessage({
        type: 'success',
        text: `Income recorded successfully! Blockchain TX: ${data.txHash || 'N/A'}. ${
          data.onChain ? 'Successfully recorded on blockchain.' : 'Warning: Blockchain recording failed.'
        }`,
      });
      setShowRecordModal(false);
      setFormData({
        amount: '',
        revenueSource: '',
        supportingDocument: null,
      });
      setFormErrors({});
      setUploadedFileName('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to record income',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Income Records
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Record and track barangay revenue and income
          </p>
        </div>
        {isTreasurer && (
          <button
            onClick={() => setShowRecordModal(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Record Income</span>
          </button>
        )}
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      {/* Financial Summary */}
      {generalFundInfo && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--card-bg)', border: '2px solid var(--primary)' }}>
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>
              Financial Summary
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Total Income (General Fund)
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  PHP {(Number(generalFundInfo.generalFund) || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Available Balance
                </p>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: (Number(generalFundInfo.availableBalance) || 0) >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  PHP {(Number(generalFundInfo.availableBalance) || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Important Info */}
      <div className="alert alert-info" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <TrendingUp size={20} />
          <span style={{ fontWeight: '600' }}>Important Information</span>
        </div>
        <p style={{ fontSize: '0.875rem' }}>
          Income records are automatically recorded on the blockchain immediately upon submission.
          No approval process is required for income entries.
        </p>
      </div>

      {/* Revenue Types Info */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Revenue Source Types
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
          {revenueTypes.map((type, index) => (
            <div
              key={index}
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--background)',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
              }}
            >
              {type}
            </div>
          ))}
        </div>
      </div>

      {/* Income History */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Income History
        </h2>
        {incomeRecords.length === 0 ? (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No income records to display. {isTreasurer && 'Click "Record Income" to add one.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {incomeRecords.map((record) => (
              <div
                key={record._id}
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
                      {record.revenueSource}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Recorded by: {record.recordedBy?.fullName || 'N/A'}
                    </p>
                  </div>
                  <span className={`badge ${record.onChain ? 'badge-success' : 'badge-warning'}`}>
                    {record.onChain ? 'On-Chain' : 'Off-Chain'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Amount
                    </p>
                    <p style={{ fontWeight: '600' }}>
                      PHP {Number(record.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Date Recorded
                    </p>
                    <p style={{ fontWeight: '500' }}>
                      {record.recordedAt && !isNaN(new Date(record.recordedAt).getTime())
                        ? new Date(record.recordedAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                {record.supportingDocument && (
                  <button
                    onClick={() => handleViewDocument(record.supportingDocument)}
                    className="btn btn-outline"
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    <FileText size={16} />
                    <span>View Supporting Document</span>
                  </button>
                )}
                {record.onChain && record.txHash && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.375rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Blockchain TX
                    </p>
                    <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {record.txHash}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Income Modal */}
      {showRecordModal && (
        <div className="modal-overlay" onClick={() => setShowRecordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                Record New Income
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.875rem' }}>
                    This income will be recorded immediately on the blockchain upon submission.
                  </p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="revenueSource" className="label">
                    Revenue Source *
                  </label>
                  <select
                    id="revenueSource"
                    name="revenueSource"
                    className="select"
                    value={formData.revenueSource}
                    onChange={(e) => {
                      setFormData({ ...formData, revenueSource: e.target.value });
                      setFormErrors({ ...formErrors, revenueSource: false });
                    }}
                    required
                    style={{
                      borderColor: formErrors.revenueSource ? '#ef4444' : undefined,
                      borderWidth: formErrors.revenueSource ? '2px' : undefined,
                    }}
                  >
                    <option value="">Select revenue source</option>
                    {revenueTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {formErrors.revenueSource && (
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
                  onClick={() => setShowRecordModal(false)}
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
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Record Income</span>
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

export default Income;
