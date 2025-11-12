import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { incomeAPI } from '../services/api';
import { Plus, Upload, TrendingUp } from 'lucide-react';

const Income = () => {
  const { isTreasurer } = useAuth();
  const [revenueTypes, setRevenueTypes] = useState([]);
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [generalFundInfo, setGeneralFundInfo] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
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
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Revenue Source</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Recorded By</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>TX Hash</th>
                </tr>
              </thead>
              <tbody>
                {incomeRecords.map((record) => (
                  <tr key={record._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {record.recordedAt && !isNaN(new Date(record.recordedAt).getTime())
                        ? new Date(record.recordedAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {record.revenueSource}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '500' }}>
                      PHP {Number(record.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {record.recordedBy?.fullName || 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span className={`badge ${record.onChain ? 'badge-success' : 'badge-warning'}`}>
                        {record.onChain ? 'On-Chain' : 'Off-Chain'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      {record.txHash ? `${record.txHash.substring(0, 10)}...` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
};

export default Income;
