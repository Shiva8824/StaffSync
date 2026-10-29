import React from 'react';

const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => {
  return (
    <div className={`card stat-card stat-${color} h-100 shadow-sm`}>
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
            {title}
          </span>
          <h2 className="my-1 fw-bold text-dark">{value}</h2>
          {subtitle && (
            <p className="text-muted mb-0 small" style={{ fontSize: '0.8rem' }}>
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`d-flex align-items-center justify-content-center rounded-3 bg-${color} bg-opacity-10 text-${color}`}
          style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}
        >
          <i className={icon}></i>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
