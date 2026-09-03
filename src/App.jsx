import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import BottomNavigation from './components/BottomNavigation';
import AuthModal from './components/AuthModal';
import AdminLogin from './components/AdminLogin';
import CompleteJobModal from './components/CompleteJobModal';
import CustomerDetailsModal from './components/CustomerDetailsModal';
import EditCustomerModal from './components/EditCustomerModal';
import Diary from './pages/Diary';
import HistoryMonthly from './pages/HistoryMonthly';
import AddCustomer from './pages/AddCustomer';
import Weather from './pages/Weather';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import {
  getCurrentUser,
  getCurrentAdmin,
  signOutUser,
} from './utils/supabaseClient';
import {
  fetchUserJobs,
  saveUserJob,
  updateUserJob,
  deleteUserJob,
  fetchUserQueue,
  saveQueuedCustomer,
  removeQueuedCustomer,
} from './utils/supabaseStorage';
import {
  initializeStorage,
  getSavedTimerState,
  saveTimerState,
} from './utils/storage';
import { calculateWorkAmount } from './utils/calculations';
import { playCompletionChime } from './utils/timer';

export default function App() {
  // Navigation & Portal State (Admin portal is separate and accessed via #admin or /admin)
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return window.location.hash === '#admin' || window.location.pathname.startsWith('/admin');
  });
  const [activeTab, setActiveTab] = useState('diary'); // 'diary' | 'history' | 'add_customer' | 'weather' | 'profile'

  // Authenticated Users
  const [currentUser, setCurrentUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Application Data for Authenticated Customer
  const [customersQueue, setCustomersQueue] = useState([]);
  const [activeCustomerId, setActiveCustId] = useState('');
  const [completedRecords, setCompletedRecords] = useState([]);

  // Modals & Popups
  const [completeJobState, setCompleteJobState] = useState(null);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Global Background-Resilient Timer State
  const [timerState, setTimerState] = useState(() => {
    const saved = getSavedTimerState();
    return saved || {
      mode: 'stopwatch',
      isRunning: false,
      startedAt: null,
      accumulatedSeconds: 0,
      targetSeconds: 1200,
      startTimeIso: null,
      customerId: '',
    };
  });

  const [currentElapsedSeconds, setCurrentElapsedSeconds] = useState(0);
  const chimeTriggeredRef = useRef(false);

  // Check URL hash changes for #admin navigation
  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminMode(window.location.hash === '#admin' || window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Initial Auth Check
  useEffect(() => {
    const initAuth = async () => {
      setIsAuthLoading(true);
      initializeStorage();
      try {
        const user = await getCurrentUser();
        const admin = await getCurrentAdmin();
        if (user) {
          setCurrentUser(user);
          await loadCustomerData(user.id);
        }
        if (admin) {
          setAdminUser(admin);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };
    initAuth();
  }, []);

  // Load customer records & queue from Supabase / Storage
  const loadCustomerData = async (userId) => {
    if (!userId) return;
    try {
      const [records, queue] = await Promise.all([
        fetchUserJobs(userId),
        fetchUserQueue(userId),
      ]);
      setCompletedRecords(records || []);
      setCustomersQueue(queue || []);
      if (queue && queue.length > 0) {
        setActiveCustId(queue[0].id);
      } else {
        setActiveCustId('');
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  const activeCustomer = customersQueue.find((c) => c.id === activeCustomerId) || customersQueue[0] || null;

  // Background-Safe Timer Engine (wall-clock based)
  useEffect(() => {
    const calculateCurrentSeconds = () => {
      if (timerState.isRunning && timerState.startedAt) {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - timerState.startedAt) / 1000));
        const total = (timerState.accumulatedSeconds || 0) + diff;
        setCurrentElapsedSeconds(total);

        // Countdown chime alert
        if (timerState.mode === 'countdown') {
          const remaining = (timerState.targetSeconds || 1200) - total;
          if (remaining <= 0 && !chimeTriggeredRef.current) {
            chimeTriggeredRef.current = true;
            playCompletionChime();
          }
        }
      } else {
        setCurrentElapsedSeconds(timerState.accumulatedSeconds || 0);
      }
    };

    calculateCurrentSeconds();
    const interval = setInterval(calculateCurrentSeconds, 500);

    return () => clearInterval(interval);
  }, [timerState]);

  useEffect(() => {
    saveTimerState(timerState);
  }, [timerState]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Customer Auth Handlers
  const handleAuthSuccess = async (user) => {
    setCurrentUser(user);
    await loadCustomerData(user.id);
    showToast(`Welcome, ${user.fullName || user.customerId || 'Operator'}!`);
  };

  const handleCustomerLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    setCustomersQueue([]);
    setCompletedRecords([]);
    setActiveCustId('');
    handleResetTimer();
    setActiveTab('diary');
    showToast('Logged out securely');
  };

  // Admin Portal Handlers
  const handleReturnToCustomerApp = () => {
    window.location.hash = '';
    setIsAdminMode(false);
  };

  const handleAdminLoginSuccess = (admin) => {
    setAdminUser(admin);
    showToast('Admin access granted');
  };

  const handleAdminLogout = async () => {
    await signOutUser();
    setAdminUser(null);
    showToast('Admin logged out');
  };

  // Timer Handlers
  const handleStartTimer = () => {
    const nowEpoch = Date.now();
    const startIso = timerState.startTimeIso || new Date().toISOString();
    const target = (activeCustomer?.durationMinutesPreset || 20) * 60;
    const mode = activeCustomer?.timerMode || timerState.mode || 'stopwatch';

    setTimerState((prev) => ({
      ...prev,
      mode,
      isRunning: true,
      startedAt: nowEpoch,
      startTimeIso: startIso,
      targetSeconds: prev.targetSeconds || target,
      customerId: activeCustomer?.id || '',
    }));
    chimeTriggeredRef.current = false;
  };

  const handlePauseTimer = () => {
    if (!timerState.isRunning || !timerState.startedAt) return;
    const now = Date.now();
    const diff = Math.max(0, Math.floor((now - timerState.startedAt) / 1000));
    const newAccumulated = (timerState.accumulatedSeconds || 0) + diff;

    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      startedAt: null,
      accumulatedSeconds: newAccumulated,
    }));
  };

  const handleResetTimer = () => {
    setTimerState({
      mode: activeCustomer?.timerMode || 'stopwatch',
      isRunning: false,
      startedAt: null,
      accumulatedSeconds: 0,
      targetSeconds: (activeCustomer?.durationMinutesPreset || 20) * 60,
      startTimeIso: null,
      customerId: activeCustomer?.id || '',
    });
    setCurrentElapsedSeconds(0);
    chimeTriggeredRef.current = false;
    showToast('Active timer session reset (Saved records remain secure)');
  };

  const handleCancelWork = () => {
    setTimerState({
      mode: activeCustomer?.timerMode || 'stopwatch',
      isRunning: false,
      startedAt: null,
      accumulatedSeconds: 0,
      targetSeconds: (activeCustomer?.durationMinutesPreset || 20) * 60,
      startTimeIso: null,
      customerId: activeCustomer?.id || '',
    });
    setCurrentElapsedSeconds(0);
    chimeTriggeredRef.current = false;
    setCompleteJobState(null);
    showToast('Work session discarded (Not saved)');
  };

  const handleAdjustCountdownDuration = (newDurationMinutes) => {
    const newTargetSeconds = newDurationMinutes * 60;
    setTimerState((prev) => ({
      ...prev,
      targetSeconds: newTargetSeconds,
    }));
    if (activeCustomer && currentUser) {
      handleUpdateCustomer({
        ...activeCustomer,
        durationMinutesPreset: newDurationMinutes,
      });
    }
  };

  // Customer Queue Handlers
  const handleSelectCustomer = (id) => {
    setActiveCustId(id);
  };

  const handleStartCustomerWork = async (newCustomer) => {
    if (!currentUser) return;
    const updated = await saveQueuedCustomer(currentUser.id, newCustomer);
    setCustomersQueue(updated);
    setActiveCustId(newCustomer.id);
    setActiveTab('diary');

    setTimerState({
      mode: newCustomer.timerMode || 'stopwatch',
      isRunning: false,
      startedAt: null,
      accumulatedSeconds: 0,
      targetSeconds: (newCustomer.durationMinutesPreset || 20) * 60,
      startTimeIso: null,
      customerId: newCustomer.id,
    });
    setCurrentElapsedSeconds(0);
    showToast(`Ready for ${newCustomer.customerName}`);
  };

  const handleSaveToQueue = async (newCustomer) => {
    if (!currentUser) return;
    const updated = await saveQueuedCustomer(currentUser.id, newCustomer);
    setCustomersQueue(updated);
    setActiveTab('diary');
    showToast(`Added ${newCustomer.customerName} to work queue`);
  };

  const handleUpdateCustomer = async (updatedCust) => {
    if (!currentUser) return;
    const updated = await saveQueuedCustomer(currentUser.id, updatedCust);
    setCustomersQueue(updated);
  };

  const handleEndWork = (jobData) => {
    handlePauseTimer();
    if (!activeCustomer) return;
    setCompleteJobState({
      customer: activeCustomer,
      jobData: {
        ...jobData,
        durationSeconds: currentElapsedSeconds,
        startTime: timerState.startTimeIso || new Date(Date.now() - currentElapsedSeconds * 1000).toISOString(),
        endTime: new Date().toISOString(),
      },
    });
  };

  const handleSaveCompletedJob = async (finalRecord, isPdfDownloaded) => {
    if (!currentUser) return;

    // 1. Save to Supabase
    const updatedRecords = await saveUserJob(currentUser.id, finalRecord);
    setCompletedRecords(updatedRecords);

    // 2. Reset active timer
    handleResetTimer();

    // 3. Remove customer from queue
    if (activeCustomer) {
      const updatedQueue = await removeQueuedCustomer(currentUser.id, activeCustomer.id);
      setCustomersQueue(updatedQueue);
      if (updatedQueue.length > 0) {
        setActiveCustId(updatedQueue[0].id);
      } else {
        setActiveCustId('');
      }
    }

    // 4. Close modal and notify
    setCompleteJobState(null);
    showToast(
      isPdfDownloaded
        ? `Job saved permanently & PDF bill downloaded!`
        : `Job for ${finalRecord.customerName} saved permanently!`
    );
  };

  const handleDeleteRecord = async (recordId) => {
    if (!currentUser) return;
    const updated = await deleteUserJob(currentUser.id, recordId);
    setCompletedRecords(updated);
    if (selectedRecordForDetails?.id === recordId) {
      setSelectedRecordForDetails(null);
    }
    showToast('Record deleted permanently');
  };

  const handleUpdateRecord = async (updatedRecord) => {
    if (!currentUser) return;
    const updated = await updateUserJob(currentUser.id, updatedRecord);
    setCompletedRecords(updated);
    setSelectedRecordForDetails(updatedRecord);
    showToast('Job record updated successfully');
  };

  // Active Timer Payload for Diary Display
  const activeTimerPayload = {
    mode: activeCustomer?.timerMode || timerState.mode || 'stopwatch',
    isRunning: timerState.isRunning,
    elapsedSeconds: currentElapsedSeconds,
    targetSeconds: timerState.targetSeconds ?? ((activeCustomer?.durationMinutesPreset || 20) * 60),
    startTime: timerState.startTimeIso,
    accruedAmount: calculateWorkAmount(Number(activeCustomer?.ratePerMinute) || 0, currentElapsedSeconds),
  };

  // =========================================================
  // RENDER SEPARATE ADMIN PANEL IF IN ADMIN MODE (#admin)
  // =========================================================
  if (isAdminMode) {
    if (!adminUser) {
      return (
        <AdminLogin
          onAdminLoginSuccess={handleAdminLoginSuccess}
          onReturnToCustomerApp={handleReturnToCustomerApp}
        />
      );
    }
    return (
      <AdminDashboard
        adminUser={adminUser}
        onAdminLogout={handleAdminLogout}
        onReturnToCustomerApp={handleReturnToCustomerApp}
        onViewRecordDetails={(record) => setSelectedRecordForDetails(record)}
      />
    );
  }

  // =========================================================
  // RENDER CUSTOMER APPLICATION
  // =========================================================
  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#1A1A1A] flex flex-col font-sans select-none">
      {/* Top Header with Clickable Tractor Logo to open Profile */}
      <Header
        onOpenProfile={() => setActiveTab('profile')}
      />

      {/* Main Screen Content with Mobile Safe Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 safe-bottom">
        {/* Diary Tab */}
        {activeTab === 'diary' && (
          <Diary
            activeCustomer={activeCustomer}
            customersQueue={customersQueue}
            completedRecords={completedRecords}
            activeTimerState={activeTimerPayload}
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onResetTimer={handleResetTimer}
            onCancelWork={handleCancelWork}
            onSelectCustomer={handleSelectCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onEditCustomer={(cust) => setEditingCustomer(cust)}
            onEndWork={handleEndWork}
            onAdjustCountdownDuration={handleAdjustCountdownDuration}
            onSaveCompletedJob={handleSaveCompletedJob}
            onOpenAddCustomer={() => setActiveTab('add_customer')}
            onViewRecordDetails={(record) => setSelectedRecordForDetails(record)}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {/* Unified History + Monthly Tab with Side-by-Side Tabs & Touch Swipe */}
        {activeTab === 'history' && (
          <HistoryMonthly
            records={completedRecords}
            onViewRecord={(record) => setSelectedRecordForDetails(record)}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {/* Add Customer Tab */}
        {activeTab === 'add_customer' && (
          <AddCustomer
            onStartCustomerWork={handleStartCustomerWork}
            onSaveToQueue={handleSaveToQueue}
          />
        )}

        {/* Weather Tab */}
        {activeTab === 'weather' && <Weather />}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Profile
            currentUser={currentUser}
            completedRecords={completedRecords}
            onUpdateUser={(updated) => setCurrentUser(updated)}
            onLogout={handleCustomerLogout}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation (5 Tabs: Diary, History, Add Customer, Weather, Profile) */}
      <BottomNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTimerRunning={timerState.isRunning}
        currentUser={currentUser}
      />

      {/* Customer Auth / Sign In Modal if not authenticated */}
      {!currentUser && !isAuthLoading && (
        <AuthModal
          onAuthSuccess={handleAuthSuccess}
          onClose={() => {}}
        />
      )}

      {/* Job Completion & Bill Modal */}
      {completeJobState && (
        <CompleteJobModal
          customer={completeJobState.customer}
          jobData={completeJobState.jobData}
          onSave={handleSaveCompletedJob}
          onClose={() => setCompleteJobState(null)}
          onCancel={handleCancelWork}
        />
      )}

      {/* Job Record Details Modal */}
      {selectedRecordForDetails && (
        <CustomerDetailsModal
          record={selectedRecordForDetails}
          onClose={() => setSelectedRecordForDetails(null)}
          onDelete={handleDeleteRecord}
          onUpdateRecord={handleUpdateRecord}
        />
      )}

      {/* Edit Active Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onSave={handleUpdateCustomer}
          onClose={() => setEditingCustomer(null)}
        />
      )}

      {/* Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[#16452B] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
