import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, DollarSign, LogIn, FileText, X, ChevronRight } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const PublicDashboard = () => {
  const [blockchainData, setBlockchainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [fullListType, setFullListType] = useState(null);
  const [fullListData, setFullListData] = useState([]);

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  const fetchBlockchainData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/public/blockchain-data');
      const data = await response.json();

      if (data.status === 'success') {
        setBlockchainData(data.data);
        setError(null);
      } else {
        setError(data.message || 'Failed to load blockchain data');
      }
    } catch (err) {
      console.error('Error fetching blockchain data:', err);
      setError('Failed to load blockchain data. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document) => {
    // Close full list modal if open
    if (showFullListModal) {
      setShowFullListModal(false);
    }
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  const handleSeeMore = (type, data) => {
    setFullListType(type);
    setFullListData(data);
    setShowFullListModal(true);
  };

  // Prepare data for pie chart (Financial Distribution)
  const getPieChartData = () => {
    if (!blockchainData) return [];

    // Only show data if total income is meaningful (> 0.01 PHP)
    if (!blockchainData.totalIncome || blockchainData.totalIncome < 0.01) {
      return [];
    }

    return [
      {
        name: 'Allocations',
        value: blockchainData.totalAllocations || 0,
        color: '#2563eb', // primary
      },
      {
        name: 'Expenditures',
        value: blockchainData.totalExpenditures || 0,
        color: '#ef4444', // danger
      },
      {
        name: 'Available',
        value: Math.max(0, blockchainData.availableBalance || 0),
        color: '#22c55e', // success
      },
    ].filter(item => item.value > 0); // Only show non-zero values
  };

  // Prepare data for bar chart (Category Breakdown)
  const getBarChartData = () => {
    if (!blockchainData?.categories) return [];

    const categories = new Set();

    // Collect all unique categories
    Object.keys(blockchainData.categories.income || {}).forEach(cat => categories.add(cat));
    Object.keys(blockchainData.categories.allocations || {}).forEach(cat => categories.add(cat));
    Object.keys(blockchainData.categories.expenditures || {}).forEach(cat => categories.add(cat));

    // Build data array
    const data = Array.from(categories).map(category => ({
      category,
      Income: blockchainData.categories.income[category] || 0,
      Allocations: blockchainData.categories.allocations[category] || 0,
      Expenditures: blockchainData.categories.expenditures[category] || 0,
    }));

    // Filter out categories where all values are too small (< 0.01 PHP)
    return data.filter(item =>
      item.Income >= 0.01 || item.Allocations >= 0.01 || item.Expenditures >= 0.01
    );
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg)'
      }}>
        <div className="loading" style={{ width: '3rem', height: '3rem' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        padding: '2rem'
      }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>
          <button onClick={fetchBlockchainData} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '2rem',
          backgroundColor: 'var(--card-bg)',
          borderRadius: '0.5rem',
          border: '2px solid var(--primary)',
          position: 'relative'
        }}>
          {/* Login Button - Top Right */}
          <Link
            to="/login"
            className="btn btn-primary"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem'
            }}
          >
            <LogIn size={16} />
            <span>Official Login</span>
          </Link>

          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: 'var(--primary)',
            marginBottom: '0.5rem'
          }}>
            Barangay Financial Transparency Dashboard
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)'
          }}>
            Real-time financial data from blockchain
          </p>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginTop: '0.5rem'
          }}>
            All data is securely stored on the blockchain and publicly verifiable
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div className="card" style={{
            padding: '1.5rem',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                padding: '0.75rem',
                borderRadius: '0.5rem'
              }}>
                <DollarSign size={24} color="var(--success)" />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Total Income
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  PHP {blockchainData?.totalIncome?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{
            padding: '1.5rem',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                padding: '0.75rem',
                borderRadius: '0.5rem'
              }}>
                <TrendingUp size={24} color="var(--primary)" />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Total Allocations
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  PHP {blockchainData?.totalAllocations?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{
            padding: '1.5rem',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                padding: '0.75rem',
                borderRadius: '0.5rem'
              }}>
                <BarChart3 size={24} color="var(--danger)" />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Total Expenditures
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                  PHP {blockchainData?.totalExpenditures?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{
            padding: '1.5rem',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                padding: '0.75rem',
                borderRadius: '0.5rem'
              }}>
                <PieChartIcon size={24} color="#eab308" />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Available Balance
                </p>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: (blockchainData?.availableBalance || 0) >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  PHP {blockchainData?.availableBalance?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Pie Chart - Financial Distribution */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: 'var(--text)'
            }}>
              Financial Distribution
            </h2>
            {getPieChartData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getPieChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getPieChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `PHP ${value.toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.375rem',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}>
                <p>No financial data available yet</p>
              </div>
            )}
          </div>

          {/* Bar Chart - Category Breakdown */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: 'var(--text)'
            }}>
              Category Breakdown
            </h2>
            {getBarChartData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getBarChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="category"
                    stroke="var(--text-secondary)"
                    style={{ fontSize: '0.75rem' }}
                  />
                  <YAxis
                    stroke="var(--text-secondary)"
                    style={{ fontSize: '0.75rem' }}
                  />
                  <Tooltip
                    formatter={(value) => `PHP ${value.toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.375rem',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Income" fill="#22c55e" />
                  <Bar dataKey="Allocations" fill="#2563eb" />
                  <Bar dataKey="Expenditures" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}>
                <p>No category data available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Categories */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: 'var(--text)'
          }}>
            Detailed Financial Breakdown
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg)' }}>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    borderBottom: '2px solid var(--border)'
                  }}>
                    Category
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    borderBottom: '2px solid var(--border)'
                  }}>
                    Amount (PHP)
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    borderBottom: '2px solid var(--border)'
                  }}>
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    Total Income
                  </td>
                  <td style={{
                    padding: '1rem',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: 'var(--success)',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    {blockchainData?.totalIncome?.toFixed(2) || '0.00'}
                  </td>
                  <td style={{
                    padding: '1rem',
                    textAlign: 'right',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    100%
                  </td>
                </tr>
                <tr>
                  <td style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    Allocations
                  </td>
                  <td style={{
                    padding: '1rem',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: 'var(--primary)',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    {blockchainData?.totalAllocations?.toFixed(2) || '0.00'}
                  </td>
                  <td style={{
                    padding: '1rem',
                    textAlign: 'right',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    {blockchainData?.totalIncome > 0
                      ? ((blockchainData.totalAllocations / blockchainData.totalIncome) * 100).toFixed(1)
                      : '0.0'}%
                  </td>
                </tr>
                <tr>
                  <td style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    Expenditures
                  </td>
                  <td style={{
                    padding: '1rem',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: 'var(--danger)',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    {blockchainData?.totalExpenditures?.toFixed(2) || '0.00'}
                  </td>
                  <td style={{
                    padding: '1rem',
                    textAlign: 'right',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    {blockchainData?.totalIncome > 0
                      ? ((blockchainData.totalExpenditures / blockchainData.totalIncome) * 100).toFixed(1)
                      : '0.0'}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction History - Income */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: 'var(--text)'
          }}>
            Income History
          </h2>
          <div style={{ overflowX: 'auto' }}>
            {blockchainData?.transactions?.income?.length > 0 ? (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Revenue Source</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--border)' }}>Amount</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--border)' }}>Document</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockchainData.transactions.income.slice(0, 5).map((income, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{income.id}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{income.revenueSource}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--success)', fontWeight: '600' }}>
                          PHP {income.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                          {new Date(income.timestamp).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                          {income.supportingDocument ? (
                            <button
                              onClick={() => handleViewDocument(income.supportingDocument)}
                              className="btn btn-outline"
                              style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <FileText size={14} />
                              <span>View</span>
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {blockchainData.transactions.income.length > 5 && (
                  <button
                    onClick={() => handleSeeMore('income', blockchainData.transactions.income)}
                    className="btn btn-outline"
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    <span>See More ({blockchainData.transactions.income.length} total)</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No income records found</p>
            )}
          </div>
        </div>

        {/* Transaction History - Allocations */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: 'var(--text)'
          }}>
            Allocation History
          </h2>
          <div style={{ overflowX: 'auto' }}>
            {blockchainData?.transactions?.allocations?.length > 0 ? (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Allocation Type</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Fund Type</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--border)' }}>Amount</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--border)' }}>Document</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockchainData.transactions.allocations.slice(0, 5).map((allocation, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{allocation.id}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{allocation.allocationType}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{allocation.fundType}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--primary)', fontWeight: '600' }}>
                          PHP {allocation.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                          {new Date(allocation.timestamp).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                          {allocation.supportingDocument ? (
                            <button
                              onClick={() => handleViewDocument(allocation.supportingDocument)}
                              className="btn btn-outline"
                              style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <FileText size={14} />
                              <span>View</span>
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {blockchainData.transactions.allocations.length > 5 && (
                  <button
                    onClick={() => handleSeeMore('allocations', blockchainData.transactions.allocations)}
                    className="btn btn-outline"
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    <span>See More ({blockchainData.transactions.allocations.length} total)</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No allocation records found</p>
            )}
          </div>
        </div>

        {/* Transaction History - Expenditures */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: 'var(--text)'
          }}>
            Expenditure History
          </h2>
          <div style={{ overflowX: 'auto' }}>
            {blockchainData?.transactions?.expenditures?.length > 0 ? (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Purpose</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Fund Source</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--border)' }}>Amount</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--border)' }}>Document</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockchainData.transactions.expenditures.slice(0, 5).map((expenditure, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{expenditure.id}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{expenditure.purpose}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{expenditure.fundSource}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--danger)', fontWeight: '600' }}>
                          PHP {expenditure.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                          {new Date(expenditure.timestamp).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                          {expenditure.supportingDocument ? (
                            <button
                              onClick={() => handleViewDocument(expenditure.supportingDocument)}
                              className="btn btn-outline"
                              style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <FileText size={14} />
                              <span>View</span>
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {blockchainData.transactions.expenditures.length > 5 && (
                  <button
                    onClick={() => handleSeeMore('expenditures', blockchainData.transactions.expenditures)}
                    className="btn btn-outline"
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    <span>See More ({blockchainData.transactions.expenditures.length} total)</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No expenditure records found</p>
            )}
          </div>
        </div>

        {/* Transaction History - Proposals */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: 'var(--text)'
          }}>
            Proposal History
          </h2>
          <div style={{ overflowX: 'auto' }}>
            {blockchainData?.transactions?.proposals?.length > 0 ? (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Purpose</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Expense Type</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Fund Source</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--border)' }}>Amount</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--border)' }}>Document</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockchainData.transactions.proposals.slice(0, 5).map((proposal, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{proposal.id}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{proposal.purpose}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{proposal.expenseType}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{proposal.fundSource}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid var(--border)', fontWeight: '600' }}>
                          PHP {proposal.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                          {new Date(proposal.timestamp).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                          {proposal.supportingDocument ? (
                            <button
                              onClick={() => handleViewDocument(proposal.supportingDocument)}
                              className="btn btn-outline"
                              style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <FileText size={14} />
                              <span>View</span>
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {blockchainData.transactions.proposals.length > 5 && (
                  <button
                    onClick={() => handleSeeMore('proposals', blockchainData.transactions.proposals)}
                    className="btn btn-outline"
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    <span>See More ({blockchainData.transactions.proposals.length} total)</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No proposal records found</p>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div style={{
          textAlign: 'center',
          padding: '1.5rem',
          backgroundColor: 'var(--card-bg)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem'
          }}>
            This dashboard displays real-time financial data stored on the blockchain
          </p>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            All transactions are transparent, immutable, and publicly verifiable
          </p>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="modal-overlay" onClick={() => setShowDocumentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3>Supporting Document</h3>
            </div>
            <div className="modal-body" style={{ padding: 0, maxHeight: '70vh', overflow: 'auto' }}>
              {selectedDocument.startsWith('data:application/pdf') ? (
                <iframe src={selectedDocument} style={{ width: '100%', height: '70vh', border: 'none' }} title="Document Viewer" />
              ) : (
                <img src={selectedDocument} alt="Supporting Document" style={{ width: '100%', height: 'auto' }} />
              )}
            </div>
            <div className="modal-footer">
              <a href={selectedDocument} download="document" className="btn btn-primary">Download</a>
              <button onClick={() => setShowDocumentModal(false)} className="btn btn-outline">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Full List Modal */}
      {showFullListModal && fullListData.length > 0 && (
        <div className="modal-overlay" onClick={() => setShowFullListModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1200px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3>
                {fullListType === 'income' && 'All Income Records'}
                {fullListType === 'allocations' && 'All Allocation Records'}
                {fullListType === 'expenditures' && 'All Expenditure Records'}
                {fullListType === 'proposals' && 'All Proposal Records'}
              </h3>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto', padding: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg)', zIndex: 1 }}>
                  <tr style={{ backgroundColor: 'var(--bg)' }}>
                    {fullListType === 'income' && (
                      <>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>ID</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Revenue Source</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--border)' }}>Amount</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Date</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--border)' }}>Document</th>
                      </>
                    )}
                    {fullListType === 'allocations' && (
                      <>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>ID</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Allocation Type</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--border)' }}>Amount</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Date</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--border)' }}>Document</th>
                      </>
                    )}
                    {fullListType === 'expenditures' && (
                      <>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>ID</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Purpose</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Fund Source</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--border)' }}>Amount</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Date</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--border)' }}>Document</th>
                      </>
                    )}
                    {fullListType === 'proposals' && (
                      <>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>ID</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Purpose</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Expense Type</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--border)' }}>Amount</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Date</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--border)' }}>Document</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {fullListType === 'income' && fullListData.map((income, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>{income.id}</td>
                      <td style={{ padding: '0.75rem' }}>{income.revenueSource}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: 'var(--success)' }}>
                        PHP {income.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{new Date(income.timestamp).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {income.supportingDocument ? (
                          <button onClick={() => handleViewDocument(income.supportingDocument)} className="btn btn-outline" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FileText size={14} />
                            <span>View</span>
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {fullListType === 'allocations' && fullListData.map((allocation, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>{allocation.id}</td>
                      <td style={{ padding: '0.75rem' }}>{allocation.allocationType}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: 'var(--primary)' }}>
                        PHP {allocation.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{new Date(allocation.timestamp).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {allocation.supportingDocument ? (
                          <button onClick={() => handleViewDocument(allocation.supportingDocument)} className="btn btn-outline" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FileText size={14} />
                            <span>View</span>
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {fullListType === 'expenditures' && fullListData.map((expenditure, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>{expenditure.id}</td>
                      <td style={{ padding: '0.75rem' }}>{expenditure.purpose}</td>
                      <td style={{ padding: '0.75rem' }}>{expenditure.fundSource}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: 'var(--danger)' }}>
                        PHP {expenditure.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{new Date(expenditure.timestamp).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {expenditure.supportingDocument ? (
                          <button onClick={() => handleViewDocument(expenditure.supportingDocument)} className="btn btn-outline" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FileText size={14} />
                            <span>View</span>
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {fullListType === 'proposals' && fullListData.map((proposal, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>{proposal.id}</td>
                      <td style={{ padding: '0.75rem' }}>{proposal.purpose}</td>
                      <td style={{ padding: '0.75rem' }}>{proposal.expenseType}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                        PHP {proposal.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{new Date(proposal.timestamp).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {proposal.supportingDocument ? (
                          <button onClick={() => handleViewDocument(proposal.supportingDocument)} className="btn btn-outline" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FileText size={14} />
                            <span>View</span>
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowFullListModal(false)} className="btn btn-outline">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicDashboard;
