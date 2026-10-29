import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { attendanceApi } from '../../api/services';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatTime, formatDuration } from '../../utils/formatters';

const AttendancePage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isHR = user?.role === 'HR';
  const isManager = user?.role === 'Manager';

  // Tabs: 'my' (Personal), 'team' (Manager), 'org' (HR)
  const [activeTab, setActiveTab] = useState('my');

  // Today state
  const [todayState, setTodayState] = useState({ checkedIn: false, checkedOut: false, attendance: null });
  const [todayLoading, setTodayLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');

  // Personal history state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Team attendance state (Manager)
  const [teamDate, setTeamDate] = useState(new Date().toISOString().slice(0, 10));
  const [teamReport, setTeamReport] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);

  // Organization attendance state (HR)
  const [orgDate, setOrgDate] = useState(new Date().toISOString().slice(0, 10));
  const [orgDepartment, setOrgDepartment] = useState('All');
  const [orgData, setOrgData] = useState(null);
  const [orgLoading, setOrgLoading] = useState(false);

  // 1. Fetch today's status
  const fetchTodayStatus = useCallback(async () => {
    try {
      const res = await attendanceApi.getToday();
      if (res.data.success) {
        setTodayState(res.data);
      }
    } catch (err) {
      // Ignore
    } finally {
      setTodayLoading(false);
    }
  }, []);

  // 2. Fetch personal history
  const fetchPersonalHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await attendanceApi.getMyHistory({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 15,
      });
      if (res.data.success) {
        setHistory(res.data.history);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      showToast('Failed to load attendance logs', 'error');
    } finally {
      setHistoryLoading(false);
    }
  }, [startDate, endDate, page, showToast]);

  // 3. Fetch team attendance (Manager)
  const fetchTeamAttendance = useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await attendanceApi.getTeamAttendance({ date: teamDate });
      if (res.data.success) {
        setTeamReport(res.data);
      }
    } catch (err) {
      showToast('Failed to load team attendance', 'error');
    } finally {
      setTeamLoading(false);
    }
  }, [teamDate, showToast]);

  // 4. Fetch organization attendance (HR)
  const fetchOrgAttendance = useCallback(async () => {
    setOrgLoading(true);
    try {
      const res = await attendanceApi.getAllAttendance({
        date: orgDate,
        department: orgDepartment,
      });
      if (res.data.success) {
        setOrgData(res.data);
      }
    } catch (err) {
      showToast('Failed to load organization attendance overview', 'error');
    } finally {
      setOrgLoading(false);
    }
  }, [orgDate, orgDepartment, showToast]);

  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  useEffect(() => {
    if (activeTab === 'my') {
      fetchPersonalHistory();
    } else if (activeTab === 'team') {
      fetchTeamAttendance();
    } else if (activeTab === 'org') {
      fetchOrgAttendance();
    }
  }, [activeTab, fetchPersonalHistory, fetchTeamAttendance, fetchOrgAttendance]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceApi.checkIn({ notes });
      showToast(res.data.message || 'Checked in successfully!', 'success');
      setNotes('');
      fetchTodayStatus();
      fetchPersonalHistory();
    } catch (err) {
      showToast(err.response?.data?.message || 'Check-in failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceApi.checkOut({ notes });
      showToast(res.data.message || 'Checked out successfully!', 'success');
      setNotes('');
      fetchTodayStatus();
      fetchPersonalHistory();
    } catch (err) {
      showToast(err.response?.data?.message || 'Check-out failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const { checkedIn, checkedOut, attendance } = todayState;

  return (
    <div className="container-fluid px-0">
      {/* Page Title */}
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">Attendance Management</h3>
        <p className="text-secondary small mb-0">
          Track daily check-ins, work duration logs, and team shifts
        </p>
      </div>

      {/* Interactive Check-In / Check-Out Punch Card */}
      <div className="card shadow-sm border-0 mb-4 p-4 bg-white">
        <div className="row align-items-center gy-3">
          <div className="col-lg-7">
            <div className="d-flex align-items-center gap-3">
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center text-white ${
                  checkedOut
                    ? 'bg-success'
                    : checkedIn
                    ? 'bg-primary'
                    : 'bg-secondary'
                }`}
                style={{ width: '56px', height: '56px', fontSize: '1.75rem' }}
              >
                <i
                  className={`bi ${
                    checkedOut
                      ? 'bi-check-all'
                      : checkedIn
                      ? 'bi-stopwatch'
                      : 'bi-fingerprint'
                  }`}
                ></i>
              </div>

              <div>
                <h5 className="fw-bold text-dark mb-1">
                  {checkedOut
                    ? 'Today Shift Completed'
                    : checkedIn
                    ? 'Shift Currently In Progress'
                    : 'Punch In for Today'}
                </h5>
                <div className="text-secondary small d-flex flex-wrap gap-3">
                  <span>
                    <i className="bi bi-calendar3 me-1"></i>
                    {new Date().toDateString()}
                  </span>
                  <span>
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Check-in:{' '}
                    <strong className="text-dark">
                      {checkedIn ? formatTime(attendance.checkIn) : '--:--'}
                    </strong>
                  </span>
                  <span>
                    <i className="bi bi-box-arrow-left me-1"></i>
                    Check-out:{' '}
                    <strong className="text-dark">
                      {checkedOut ? formatTime(attendance.checkOut) : '--:--'}
                    </strong>
                  </span>
                  {checkedOut && (
                    <span>
                      <i className="bi bi-clock-history me-1"></i>
                      Duration:{' '}
                      <strong className="text-success">
                        {formatDuration(attendance.workDurationMinutes)}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            {!checkedOut && (
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Optional task note..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            )}
            <div className="d-flex gap-2">
              {!checkedIn ? (
                <button
                  className="btn btn-primary w-100 py-2.5 fw-bold shadow-sm"
                  onClick={handleCheckIn}
                  disabled={actionLoading || todayLoading}
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  {actionLoading ? 'Recording Check-in...' : 'Check In for Today'}
                </button>
              ) : !checkedOut ? (
                <button
                  className="btn btn-danger w-100 py-2.5 fw-bold shadow-sm"
                  onClick={handleCheckOut}
                  disabled={actionLoading || todayLoading}
                >
                  <i className="bi bi-box-arrow-left me-2"></i>
                  {actionLoading ? 'Recording Check-out...' : 'Check Out Now'}
                </button>
              ) : (
                <div className="alert alert-success py-2 w-100 text-center small mb-0 fw-semibold">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Status: {attendance.status} &bull; Recorded Successfully
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-pills mb-4 gap-2 bg-light p-1.5 rounded-3 border">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            <i className="bi bi-person me-1"></i>My Attendance Logs
          </button>
        </li>
        {(isManager || isHR) && (
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
            >
              <i className="bi bi-people me-1"></i>Team Attendance Roster
            </button>
          </li>
        )}
        {isHR && (
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'org' ? 'active' : ''}`}
              onClick={() => setActiveTab('org')}
            >
              <i className="bi bi-building me-1"></i>Company-Wide Overview
            </button>
          </li>
        )}
      </ul>

      {/* TAB 1: Personal History */}
      {activeTab === 'my' && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-bottom py-3">
            <div className="row g-2 align-items-center">
              <div className="col-md-5">
                <h6 className="fw-bold text-dark mb-0">Personal Attendance History</h6>
              </div>
              <div className="col-sm-3 col-md-3">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start date"
                />
              </div>
              <div className="col-sm-3 col-md-3">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End date"
                />
              </div>
              <div className="col-sm-6 col-md-1 text-end">
                <button
                  className="btn btn-sm btn-light border w-100"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setPage(1);
                  }}
                  title="Clear Dates"
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            {historyLoading ? (
              <LoadingSpinner message="Loading attendance logs..." />
            ) : history.length === 0 ? (
              <EmptyState
                icon="bi-calendar2-x"
                title="No attendance records found"
                description="Your past attendance history will appear here as you check in each workday."
              />
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Work Duration</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((rec) => (
                      <tr key={rec._id}>
                        <td className="fw-semibold text-dark">{formatDate(rec.date)}</td>
                        <td className="small text-secondary">{formatTime(rec.checkIn)}</td>
                        <td className="small text-secondary">{formatTime(rec.checkOut)}</td>
                        <td className="small">{formatDuration(rec.workDurationMinutes)}</td>
                        <td>
                          <StatusBadge status={rec.status} />
                        </td>
                        <td className="small text-muted text-truncate" style={{ maxWidth: '200px' }}>
                          {rec.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Manager Team Roster */}
      {activeTab === 'team' && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h6 className="fw-bold text-dark mb-0">Team Attendance for Date</h6>
              <span className="text-secondary small">
                Team Size: {teamReport?.teamSize || 0} &bull; Present: {teamReport?.presentCount || 0} &bull; Absent: {teamReport?.absentCount || 0}
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <label className="small fw-semibold text-secondary mb-0">Select Date:</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={teamDate}
                onChange={(e) => setTeamDate(e.target.value)}
              />
            </div>
          </div>

          <div className="card-body p-0">
            {teamLoading ? (
              <LoadingSpinner message="Compiling team shift records..." />
            ) : !teamReport || teamReport.report.length === 0 ? (
              <EmptyState
                icon="bi-people"
                title="No direct reports found"
                description="Team members assigned to report to you will be tracked here."
              />
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department & Title</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamReport.report.map((item) => (
                      <tr key={item.employee._id}>
                        <td>
                          <div className="fw-bold text-dark">{item.employee.fullName}</div>
                          <div className="text-muted small">{item.employee.employeeId}</div>
                        </td>
                        <td className="small text-secondary">
                          <div>{item.employee.jobTitle}</div>
                          <span className="text-muted">{item.employee.department}</span>
                        </td>
                        <td className="small text-secondary">{formatTime(item.checkIn)}</td>
                        <td className="small text-secondary">{formatTime(item.checkOut)}</td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="small text-muted">{item.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: HR Organization Overview */}
      {activeTab === 'org' && isHR && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-bottom py-3">
            <div className="row g-2 align-items-center justify-content-between">
              <div className="col-md-5">
                <h6 className="fw-bold text-dark mb-0">Company-Wide Daily Attendance</h6>
                {orgData?.summary && (
                  <span className="text-secondary small">
                    Active: {orgData.summary.total} &bull; Present: {orgData.summary.present} &bull; Late: {orgData.summary.late} &bull; Absent: {orgData.summary.absent}
                  </span>
                )}
              </div>
              <div className="col-sm-6 col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={orgDepartment}
                  onChange={(e) => setOrgDepartment(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Finance">Finance</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
              <div className="col-sm-6 col-md-3">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={orgDate}
                  onChange={(e) => setOrgDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            {orgLoading ? (
              <LoadingSpinner message="Aggregating company-wide attendance..." />
            ) : !orgData || orgData.records.length === 0 ? (
              <EmptyState
                icon="bi-calendar-check"
                title="No employees recorded"
                description="No active employees found matching the selected filters."
              />
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgData.records.map((rec) => (
                      <tr key={rec.employee._id}>
                        <td>
                          <div className="fw-bold text-dark">{rec.employee.fullName}</div>
                          <div className="text-muted small">{rec.employee.employeeId}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">{rec.employee.department}</span>
                        </td>
                        <td className="small text-secondary">{formatTime(rec.checkIn)}</td>
                        <td className="small text-secondary">{formatTime(rec.checkOut)}</td>
                        <td className="small">{formatDuration(rec.durationMinutes)}</td>
                        <td>
                          <StatusBadge status={rec.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
