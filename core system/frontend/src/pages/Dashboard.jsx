import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { allocationsAPI } from '../services/api';
import {
  DollarSign,
  FileText,
  ShoppingCart,
  Wallet,
  Users,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const Dashboard = () => {
  const { user, isChairman, isTreasurer } = useAuth();
  const [generalFundInfo, setGeneralFundInfo] = useState(null);

  const getTermEndDate = () => {
    if (user?.termEnd) {
      return new Date(user.termEnd).toLocaleDateString();
    }
    return 'Not set';
  };

  const getDaysUntilTermEnd = () => {
    if (user?.termEnd) {
      const termEnd = new Date(user.termEnd);
      const today = new Date();
      const diff = Math.ceil((termEnd - today) / (1000 * 60 * 60 * 24));
      return diff;
    }
    return null;
  };

  const daysLeft = getDaysUntilTermEnd();

  useEffect(() => {
    fetchGeneralFund();
  }, []);

  const fetchGeneralFund = async () => {
    try {
      const response = await allocationsAPI.getGeneralFund();
      setGeneralFundInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching general fund:', error);
    }
  };

  const quickActions = [
    {
      title: 'Allocations',
      description: isTreasurer
        ? 'Submit new allocation'
        : 'Review pending allocations',
      icon: DollarSign,
      link: '/allocations',
      color: '#3b82f6',
      roles: ['Chairman', 'Treasurer'],
    },
    {
      title: 'Proposals',
      description: isTreasurer
        ? 'Submit new proposal'
        : 'Review pending proposals',
      icon: FileText,
      link: '/proposals',
      color: '#8b5cf6',
      roles: ['Chairman', 'Treasurer'],
    },
    {
      title: 'Expenditures',
      description: isTreasurer
        ? 'Submit new expenditure'
        : 'Review pending expenditures',
      icon: ShoppingCart,
      link: '/expenditures',
      color: '#f59e0b',
      roles: ['Chairman', 'Treasurer'],
    },
    {
      title: 'Income',
      description: 'Record barangay income',
      icon: Wallet,
      link: '/income',
      color: '#10b981',
      roles: ['Chairman', 'Treasurer'],
    },
    {
      title: 'Officials',
      description: 'Manage barangay officials',
      icon: Users,
      link: '/officials',
      color: '#64748b',
      roles: ['Chairman'],
    },
  ];

  const filteredActions = quickActions.filter((action) =>
    action.roles.includes(user?.role)
  );

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Welcome back, {user?.fullName}. Here's an overview of the system.
        </p>
      </div>

      {/* Term Information */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
          <div
            style={{
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              padding: '0.75rem',
              borderRadius: '0.5rem',
            }}
          >
            <Calendar size={24} color="var(--primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Term Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Term Start
                </p>
                <p style={{ fontWeight: '500' }}>
                  {user?.termStart ? new Date(user.termStart).toLocaleDateString() : 'Not set'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Term End
                </p>
                <p style={{ fontWeight: '500' }}>{getTermEndDate()}</p>
              </div>
              {daysLeft !== null && (
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Days Remaining
                  </p>
                  <p
                    style={{
                      fontWeight: '500',
                      color: daysLeft < 30 ? 'var(--danger)' : daysLeft < 90 ? 'var(--warning)' : 'inherit',
                    }}
                  >
                    {daysLeft} days
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Warning for term ending soon */}
      {daysLeft !== null && daysLeft < 90 && daysLeft > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: '600' }}>
              Your term is ending in {daysLeft} days
            </span>
          </div>
          {isChairman && (
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Consider generating succession tokens for the next term officials.
            </p>
          )}
        </div>
      )}

      {/* General Fund Summary */}
      {generalFundInfo && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--card-bg)', border: '2px solid var(--primary)' }}>
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>
              General Fund Summary
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
                  Total Allocations
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  PHP {generalFundInfo.totalAllocations.toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Total Expenditures
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  PHP {generalFundInfo.totalExpenditures.toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Total Proposals
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  PHP {generalFundInfo.totalProposals.toFixed(2)}
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

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Quick Actions
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1rem',
          }}
        >
          {filteredActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.link}
                to={action.link}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card"
                  style={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderLeft: `4px solid ${action.color}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                    <div
                      style={{
                        backgroundColor: `${action.color}15`,
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                      }}
                    >
                      <Icon size={24} color={action.color} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text)' }}>
                        {action.title}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Account Information */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Account Information
        </h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Full Name</span>
            <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>{user?.fullName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Email</span>
            <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>{user?.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Phone</span>
            <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>{user?.phoneNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Role</span>
            <span className="badge badge-info">{user?.role}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Wallet Address</span>
            <span style={{ fontWeight: '500', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              {user?.walletAddress}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Status</span>
            <span className="badge badge-success">{user?.status || 'Active'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
