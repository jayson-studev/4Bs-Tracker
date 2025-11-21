import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, DollarSign, LogIn, FileText, X, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedIncomeRows, setExpandedIncomeRows] = useState(new Set());
  const [expandedAllocationRows, setExpandedAllocationRows] = useState(new Set());
  const [expandedExpenditureRows, setExpandedExpenditureRows] = useState(new Set());
  const [expandedProposalRows, setExpandedProposalRows] = useState(new Set());
  const [expandedModalRows, setExpandedModalRows] = useState(new Set());
  const [selectedIncomeCategory, setSelectedIncomeCategory] = useState(null);
  const [selectedAllocationCategory, setSelectedAllocationCategory] = useState(null);
  const [selectedExpenditureCategory, setSelectedExpenditureCategory] = useState(null);
  const [selectedProposalCategory, setSelectedProposalCategory] = useState(null);

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
    setExpandedModalRows(new Set()); // Reset expanded rows when opening modal
    setShowFullListModal(true);
  };

  const toggleIncomeRow = (idx) => {
    const newExpanded = new Set(expandedIncomeRows);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedIncomeRows(newExpanded);
  };

  const toggleAllocationRow = (idx) => {
    const newExpanded = new Set(expandedAllocationRows);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedAllocationRows(newExpanded);
  };

  const toggleExpenditureRow = (idx) => {
    const newExpanded = new Set(expandedExpenditureRows);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedExpenditureRows(newExpanded);
  };

  const toggleProposalRow = (idx) => {
    const newExpanded = new Set(expandedProposalRows);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedProposalRows(newExpanded);
  };

  const toggleModalRow = (idx) => {
    const newExpanded = new Set(expandedModalRows);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedModalRows(newExpanded);
  };


  // Group income records by revenue source
  const groupIncomeByCategory = (incomeList) => {
    const grouped = {};
    incomeList.forEach(income => {
      const category = income.revenueSource || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(income);
    });
    return grouped;
  };

  // Group allocations by allocation type
  const groupAllocationsByCategory = (allocationList) => {
    const grouped = {};
    allocationList.forEach(allocation => {
      const category = allocation.allocationType || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(allocation);
    });
    return grouped;
  };

  // Group expenditures by fund source
  const groupExpendituresByCategory = (expenditureList) => {
    const grouped = {};
    expenditureList.forEach(expenditure => {
      const category = expenditure.fundSource || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(expenditure);
    });
    return grouped;
  };

  // Group proposals by fund source
  const groupProposalsByCategory = (proposalList) => {
    const grouped = {};
    proposalList.forEach(proposal => {
      const category = proposal.fundSource || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(proposal);
    });
    return grouped;
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
          marginBottom: '2rem',
          padding: '2.5rem',
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.15) 0%, rgba(37, 99, 235, 0.08) 50%, rgba(249, 115, 22, 0.05) 100%)',
          borderRadius: '1rem',
          border: '3px solid transparent',
          backgroundImage: 'linear-gradient(var(--card-bg), var(--card-bg)), linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #f97316 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          position: 'relative',
          boxShadow: '0 10px 40px rgba(37, 99, 235, 0.15), 0 0 60px rgba(249, 115, 22, 0.1)',
          overflow: 'hidden'
        }}>
          {/* Decorative background pattern - circuit board style */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.04,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'%232563eb\' stroke-width=\'2\'%3E%3Cline x1=\'0\' y1=\'20\' x2=\'30\' y2=\'20\'/%3E%3Cline x1=\'30\' y1=\'20\' x2=\'30\' y2=\'40\'/%3E%3Ccircle cx=\'30\' cy=\'40\' r=\'3\' fill=\'%23f97316\'/%3E%3Cline x1=\'50\' y1=\'10\' x2=\'80\' y2=\'10\'/%3E%3Cline x1=\'50\' y1=\'10\' x2=\'50\' y2=\'35\'/%3E%3Ccircle cx=\'50\' cy=\'35\' r=\'3\' fill=\'%23f97316\'/%3E%3Cline x1=\'0\' y1=\'60\' x2=\'25\' y2=\'60\'/%3E%3Ccircle cx=\'25\' cy=\'60\' r=\'3\' fill=\'%232563eb\'/%3E%3Cline x1=\'60\' y1=\'70\' x2=\'80\' y2=\'70\'/%3E%3Ccircle cx=\'15\' cy=\'75\' r=\'3\' fill=\'%23f97316\'/%3E%3C/g%3E%3C/svg%3E")',
            pointerEvents: 'none'
          }}></div>

          {/* Login Button - Responsive */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1
          }}>
            <Link
              to="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                padding: '0.625rem 1.25rem',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                color: 'white',
                borderRadius: '0.375rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
                transition: 'all 0.3s ease',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(30, 58, 138, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 58, 138, 0.3)';
              }}
            >
              <LogIn size={16} style={{ flexShrink: 0 }} />
              <span style={{ display: 'inline' }}>Official Login</span>
            </Link>
          </div>

          {/* Header Content */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            position: 'relative',
            zIndex: 1,
            flexWrap: 'wrap'
          }}>
            {/* 4B's Logo */}
            <img
              src="/Adobe Express - file.png"
              alt="4B's Logo"
              style={{
                width: 'clamp(100px, 15vw, 180px)',
                height: 'clamp(100px, 15vw, 180px)',
                objectFit: 'contain',
                flexShrink: 0,
                filter: 'drop-shadow(0 8px 16px rgba(37, 99, 235, 0.3))',
                animation: 'float 3s ease-in-out infinite'
              }}
            />

            {/* Title Section */}
            <div style={{ flex: '1 1 400px', minWidth: '280px' }}>
              <h1 style={{
                fontSize: 'clamp(1.75rem, 5vw, 3rem)',
                fontWeight: '900',
                color: '#1e3a8a',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #f97316 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                MozBackgroundClip: 'text',
                MozTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '0.75rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                display: 'inline-block'
              }}>
                Barangay Blockchain-Based Budget Tracker
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  width: '4px',
                  height: '20px',
                  background: 'linear-gradient(180deg, #1e3a8a 0%, #2563eb 50%, #f97316 100%)',
                  borderRadius: '2px'
                }}></div>
                <p style={{
                  fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
                  color: 'var(--text)',
                  fontWeight: '600'
                }}>
                  Real-time financial data monitoring system
                </p>
              </div>
              <p style={{
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                paddingLeft: '1rem'
              }}>
                All data is securely stored on the blockchain and publicly verifiable
              </p>
            </div>
          </div>
        </div>

        {/* Floating animation keyframes */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}</style>

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
                backgroundColor: '  rgba(197, 129, 34, 0.1)',
                padding: '0.75rem',
                borderRadius: '0.5rem'
              }}>
                <DollarSign size={24} color="#F28C28" />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Total Income
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: "#F28C28" }}>
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
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: "#2D7FF9" }}>
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
                backgroundColor: 'rgba(68, 122, 239, 0.1)',
                padding: '0.75rem',
                borderRadius: '0.5rem'
              }}>
                <BarChart3 size={24} color="#1B3B94" />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Total Expenditures
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: "#1B3B94" }}>
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
                  color: (blockchainData?.availableBalance || 0) >= 0 ? "#10B981" : 'var(--danger)'
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
          <div className="card" style={{
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.03) 0%, rgba(249, 115, 22, 0.03) 100%)',
            border: '1px solid transparent',
            backgroundImage: 'linear-gradient(var(--card-bg), var(--card-bg)), linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative corner accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'radial-gradient(circle at top right, rgba(249, 115, 22, 0.1) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <PieChartIcon size={24} style={{ color: '#2563eb' }} />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 70%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0
              }}>
                Financial Distribution
              </h2>
            </div>

            {getPieChartData().length > 0 ? (
              <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <defs>
                      <filter id="shadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                      </filter>
                      {/* Gradient for Allocations (Blue) */}
                      <linearGradient id="gradientAllocations" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      </linearGradient>
                      {/* Gradient for Expenditures (Dark Blue/Red) */}
                      <linearGradient id="gradientExpenditures" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#1e3a8a" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#1e40af" stopOpacity={0.8}/>
                      </linearGradient>
                      {/* Gradient for Available (Orange/Green) */}
                      <linearGradient id="gradientAvailable" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#19b843a8" stopOpacity={1}/>
                        <stop offset="100%" stopColor=" #10B981" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={120}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={3}
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {getPieChartData().map((entry, index) => {
                        // Assign gradient based on entry name
                        let gradientId = 'gradientAllocations';
                        if (entry.name === 'Allocations') gradientId = 'gradientAllocations';
                        else if (entry.name === 'Expenditures') gradientId = 'gradientExpenditures';
                        else if (entry.name === 'Available') gradientId = 'gradientAvailable';

                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#${gradientId})`}
                            filter="url(#shadow)"
                            strokeWidth={2}
                            stroke="#fff"
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `PHP ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        border: '2px solid',
                        borderColor: 'var(--border)',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        padding: '0.75rem'
                      }}
                      labelStyle={{
                        fontWeight: '600',
                        color: 'var(--text)'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      iconSize={12}
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{
                height: '350px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                gap: '1rem'
              }}>
                <PieChartIcon size={48} style={{ opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '1rem' }}>No financial data available yet</p>
              </div>
            )}
          </div>

          {/* Bar Chart - Category Breakdown */}
          <div className="card" style={{
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.03) 0%, rgba(30, 58, 138, 0.03) 100%)',
            border: '1px solid transparent',
            backgroundImage: 'linear-gradient(var(--card-bg), var(--card-bg)), linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(30, 58, 138, 0.2) 100%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative corner accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100px',
              height: '100px',
              background: 'radial-gradient(circle at top left, rgba(30, 58, 138, 0.1) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <BarChart3 size={24} style={{ color: '#f97316' }} />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #f97316 0%, #2563eb 70%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0
              }}>
                Category Breakdown
              </h2>
            </div>

            {getBarChartData().length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={getBarChartData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#fb923c" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="colorAllocations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="colorExpenditures" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#1e40af" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    opacity={0.3}
                    vertical={false}
                  />
                  <YAxis
                    stroke="var(--text-secondary)"
                    style={{ fontSize: '0.75rem' }}
                    tickFormatter={(value) => `${value.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(value) => `PHP ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    contentStyle={{
                      backgroundColor: 'var(--card-bg)',
                      border: '2px solid var(--border)',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      padding: '0.75rem'
                    }}
                    labelStyle={{
                      fontWeight: '600',
                      color: 'var(--text)',
                      marginBottom: '0.5rem'
                    }}
                    cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={12}
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  />
                  <Bar
                    dataKey="Income"
                    fill="url(#colorIncome)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                    animationDuration={800}
                  />
                  <Bar
                    dataKey="Allocations"
                    fill="url(#colorAllocations)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                    animationDuration={800}
                  />
                  <Bar
                    dataKey="Expenditures"
                    fill="url(#colorExpenditures)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                height: '350px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                gap: '1rem'
              }}>
                <BarChart3 size={48} style={{ opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '1rem' }}>No category data available yet</p>
              </div>
            )}
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
          {blockchainData?.transactions?.income?.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {(() => {
                  const groupedIncome = groupIncomeByCategory(blockchainData.transactions.income);
                  return Object.entries(groupedIncome).map(([category, records]) => {
                    const categoryTotal = records.reduce((sum, r) => sum + (r.amount || 0), 0);
                    return (
                      <div
                        key={category}
                        onClick={() => handleSeeMore(`income-${category}`, records)}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          padding: '1.25rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor: 'var(--card-bg)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#f97316';
                          e.currentTarget.style.backgroundColor = 'var(--bg)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text)' }}>
                          {category}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          {records.length} record{records.length !== 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f97316' }}>
                          PHP {categoryTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No income records found</p>
          )}
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
          {blockchainData?.transactions?.allocations?.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {(() => {
                  const groupedAllocations = groupAllocationsByCategory(blockchainData.transactions.allocations);
                  return Object.entries(groupedAllocations).map(([category, records]) => {
                    const categoryTotal = records.reduce((sum, r) => sum + (r.amount || 0), 0);
                    return (
                      <div
                        key={category}
                        onClick={() => handleSeeMore(`allocations-${category}`, records)}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          padding: '1.25rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor: 'var(--card-bg)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#2563eb';
                          e.currentTarget.style.backgroundColor = 'var(--bg)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text)' }}>
                          {category}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          {records.length} record{records.length !== 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2563eb' }}>
                          PHP {categoryTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No allocation records found</p>
          )}
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
          {blockchainData?.transactions?.expenditures?.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {(() => {
                  const groupedExpenditures = groupExpendituresByCategory(blockchainData.transactions.expenditures);
                  return Object.entries(groupedExpenditures).map(([category, records]) => {
                    const categoryTotal = records.reduce((sum, r) => sum + (r.amount || 0), 0);
                    return (
                      <div
                        key={category}
                        onClick={() => handleSeeMore(`expenditures-${category}`, records)}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          padding: '1.25rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor: 'var(--card-bg)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#1B3B94";
                          e.currentTarget.style.backgroundColor = 'var(--bg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                        }}
                      >
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text)' }}>
                          {category}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          {records.length} record{records.length !== 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: "#1B3B94" }}>
                          PHP {categoryTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No expenditure records found</p>
          )}
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
          {blockchainData?.transactions?.proposals?.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {(() => {
                  const groupedProposals = groupProposalsByCategory(blockchainData.transactions.proposals);
                  return Object.entries(groupedProposals).map(([category, records]) => {
                    const categoryTotal = records.reduce((sum, r) => sum + (r.amount || 0), 0);
                    return (
                      <div
                        key={category}
                        onClick={() => handleSeeMore(`proposals-${category}`, records)}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          padding: '1.25rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor: 'var(--card-bg)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--text)';
                          e.currentTarget.style.backgroundColor = 'var(--bg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                        }}
                      >
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text)' }}>
                          {category}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          {records.length} record{records.length !== 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text)' }}>
                          PHP {categoryTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No proposal records found</p>
          )}
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3>
                {(fullListType === 'income' || fullListType.startsWith('income-')) && (
                  fullListType.startsWith('income-') ? fullListType.replace('income-', '') : 'All Income Records'
                )}
                {(fullListType === 'allocations' || fullListType.startsWith('allocations-')) && (
                  fullListType.startsWith('allocations-') ? fullListType.replace('allocations-', '') : 'All Allocation Records'
                )}
                {(fullListType === 'expenditures' || fullListType.startsWith('expenditures-')) && (
                  fullListType.startsWith('expenditures-') ? fullListType.replace('expenditures-', '') : 'All Expenditure Records'
                )}
                {(fullListType === 'proposals' || fullListType.startsWith('proposals-')) && (
                  fullListType.startsWith('proposals-') ? fullListType.replace('proposals-', '') : 'All Proposal Records'
                )}
              </h3>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto', padding: '1rem' }}>
              {(fullListType === 'income' || fullListType.startsWith('income-')) && (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {fullListData.map((income) => (
                    <div
                      key={income.id}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        backgroundColor: 'var(--card-bg)',
                      }}
                    >
                      {/* Main Row - Always Visible */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '3rem 1fr auto auto auto',
                          gap: '1rem',
                          padding: '1rem',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onClick={() => toggleModalRow(income.id)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                          #{income.displayId || income.id}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                            {income.revenueSource}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {new Date(income.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '700', color: "#F28C28" }}>
                          PHP {income.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {income.supportingDocument && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDocument(income.supportingDocument);
                            }}
                            className="btn btn-outline"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <FileText size={14} />
                            <span>View Doc</span>
                          </button>
                        )}
                        <div>
                          {expandedModalRows.has(income.id) ? (
                            <ChevronUp size={20} color="var(--text-secondary)" />
                          ) : (
                            <ChevronDown size={20} color="var(--text-secondary)" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Details - Blockchain Data */}
                      {expandedModalRows.has(income.id) && (
                        <div style={{
                          padding: '1rem',
                          borderTop: '1px solid var(--border)',
                          backgroundColor: 'var(--bg)',
                        }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                            Blockchain Details
                          </h4>
                          <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {/* Treasurer Address */}
                            <div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                Treasurer Address
                              </div>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {income.treasurerAddress || 'N/A'}
                              </div>
                            </div>
                            {/* Document Hash */}
                            <div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                Document Hash
                              </div>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {income.documentHash || 'N/A'}
                              </div>
                            </div>
                            {/* Transaction Hash */}
                            {income.txHash && (
                              <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                  Transaction Hash (Database)
                                </div>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--primary)' }}>
                                  {income.txHash}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(fullListType === 'allocations' || fullListType.startsWith('allocations-')) && (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {fullListData.map((allocation) => (
                    <div key={allocation.id} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: 'var(--card-bg)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '3rem 1fr auto auto auto', gap: '1rem', padding: '1rem', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onClick={() => toggleModalRow(allocation.id)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>#{allocation.displayId || allocation.id}</div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.25rem' }}>{allocation.allocationType}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(allocation.timestamp).toLocaleDateString()}</div>
                        </div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--primary)' }}>PHP {allocation.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        {allocation.supportingDocument && (
                          <button onClick={(e) => { e.stopPropagation(); handleViewDocument(allocation.supportingDocument); }}
                            className="btn btn-outline" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FileText size={14} /><span>View Doc</span>
                          </button>
                        )}
                        <div>{expandedModalRows.has(allocation.id) ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}</div>
                      </div>
                      {expandedModalRows.has(allocation.id) && (
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Blockchain Details</h4>
                          <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Fund Type</div><div style={{ fontSize: '0.9rem' }}>{allocation.fundType || 'N/A'}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Treasurer Address</div><div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>{allocation.treasurerAddress || 'N/A'}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Chairman Address</div><div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>{allocation.chairmanAddress || 'N/A'}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Document Hash</div><div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>{allocation.documentHash || 'N/A'}</div></div>
                            {allocation.txHash && (<div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Transaction Hash (Database)</div><div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--primary)' }}>{allocation.txHash}</div></div>)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(fullListType === 'expenditures' || fullListType.startsWith('expenditures-')) && (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {fullListData.map((expenditure) => (
                    <div key={expenditure.id} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: 'var(--card-bg)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '3rem 1fr auto auto auto', gap: '1rem', padding: '1rem', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onClick={() => toggleModalRow(expenditure.id)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>#{expenditure.displayId || expenditure.id}</div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.25rem' }}>{expenditure.purpose}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(expenditure.timestamp).toLocaleDateString()}</div>
                        </div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '700', color: "#1B3B94" }}>PHP {expenditure.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        {expenditure.supportingDocument && (
                          <button onClick={(e) => { e.stopPropagation(); handleViewDocument(expenditure.supportingDocument); }}
                            className="btn btn-outline" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FileText size={14} /><span>View Doc</span>
                          </button>
                        )}
                        <div>{expandedModalRows.has(expenditure.id) ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}</div>
                      </div>
                      {expandedModalRows.has(expenditure.id) && (
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Blockchain Details</h4>
                          <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Fund Source</div><div style={{ fontSize: '0.9rem' }}>{expenditure.fundSource || 'N/A'}</div></div>
                            {expenditure.proposalId && (<div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Proposal ID</div><div style={{ fontSize: '0.9rem' }}>{expenditure.proposalId}</div></div>)}
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Treasurer Address</div><div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>{expenditure.treasurerAddress || 'N/A'}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Chairman Address</div><div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>{expenditure.chairmanAddress || 'N/A'}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Document Hash</div><div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>{expenditure.documentHash || 'N/A'}</div></div>
                            {expenditure.txHash && (<div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Transaction Hash (Database)</div><div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--primary)' }}>{expenditure.txHash}</div></div>)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(fullListType === 'proposals' || fullListType.startsWith('proposals-')) && (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {fullListData.map((proposal) => (
                    <div key={proposal.id} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: 'var(--card-bg)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '3rem 1fr auto auto auto', gap: '1rem', padding: '1rem', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onClick={() => toggleModalRow(proposal.id)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>#{proposal.displayId || proposal.id}</div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.25rem' }}>{proposal.purpose}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(proposal.timestamp).toLocaleDateString()}</div>
                        </div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text)' }}>PHP {proposal.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        {proposal.supportingDocument && (
                          <button onClick={(e) => { e.stopPropagation(); handleViewDocument(proposal.supportingDocument); }}
                            className="btn btn-outline" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FileText size={14} /><span>View Doc</span>
                          </button>
                        )}
                        <div>{expandedModalRows.has(proposal.id) ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}</div>
                      </div>
                      {expandedModalRows.has(proposal.id) && (
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Blockchain Details</h4>
                          <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {proposal.proposalId && (<div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Proposal ID</div><div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary)' }}>{proposal.proposalId}</div></div>)}
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Expense Type</div><div style={{ fontSize: '0.9rem' }}>{proposal.expenseType || 'N/A'}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Fund Source</div><div style={{ fontSize: '0.9rem' }}>{proposal.fundSource || 'N/A'}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Proposed By</div><div style={{ fontSize: '0.9rem' }}>{proposal.proposer || 'N/A'}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Treasurer Address</div><div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>{proposal.treasurerAddress || 'N/A'}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Chairman Address</div><div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>{proposal.chairmanAddress || 'N/A'}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Document Hash</div><div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>{proposal.documentHash || 'N/A'}</div></div>
                            {proposal.txHash && (<div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Transaction Hash (Database)</div><div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--primary)' }}>{proposal.txHash}</div></div>)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
