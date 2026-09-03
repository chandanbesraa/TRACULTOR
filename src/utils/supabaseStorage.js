import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Storage Keys for Local Offline Mirroring
 */
const getUserStorageKey = (userId, prefix) => `traculator_${prefix}_${userId || 'anon'}`;

/**
 * Fetch all completed jobs for the current authenticated user
 */
export async function fetchUserJobs(userId) {
  if (!userId) return [];

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetchUserJobs error:', error);
      const cached = localStorage.getItem(getUserStorageKey(userId, 'jobs'));
      return cached ? JSON.parse(cached) : [];
    }

    const mapped = (data || []).map(r => ({
      id: r.id,
      userId: r.user_id,
      customerName: r.customer_name,
      mobileNumber: r.mobile_number,
      address: r.address,
      location: r.location,
      workDescription: r.work_description,
      ratePerMinute: Number(r.rate_per_minute) || 100,
      timerMode: r.timer_mode || 'stopwatch',
      durationMinutesPreset: r.duration_minutes_preset,
      startTime: r.start_time,
      endTime: r.end_time,
      durationSeconds: Number(r.duration_seconds) || 0,
      workAmount: Number(r.work_amount) || 0,
      expenses: r.expenses || { diesel: 0, driver: 0, food: 0, other: 0 },
      totalExpenses: Number(r.total_expenses) || 0,
      netEarnings: Number(r.net_earnings) || 0,
      date: r.date,
      status: r.status || 'completed',
      createdAt: r.created_at,
    }));

    localStorage.setItem(getUserStorageKey(userId, 'jobs'), JSON.stringify(mapped));
    return mapped;
  } else {
    // Local multi-user persistence fallback
    const key = getUserStorageKey(userId, 'jobs');
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify([]));
      return [];
    }
    return JSON.parse(stored);
  }
}

/**
 * Save a completed job record
 */
export async function saveUserJob(userId, record) {
  if (!userId || !record) return [];

  if (isSupabaseConfigured() && supabase) {
    const payload = {
      id: record.id,
      user_id: userId,
      customer_name: record.customerName,
      mobile_number: record.mobileNumber || '',
      address: record.address || '',
      location: record.location || record.address || '',
      work_description: record.workDescription || '',
      rate_per_minute: Number(record.ratePerMinute) || 100,
      timer_mode: record.timerMode || 'stopwatch',
      duration_minutes_preset: record.durationMinutesPreset || null,
      start_time: record.startTime || null,
      end_time: record.endTime || null,
      duration_seconds: Number(record.durationSeconds) || 0,
      work_amount: Number(record.workAmount) || 0,
      expenses: record.expenses || { diesel: 0, driver: 0, food: 0, other: 0 },
      total_expenses: Number(record.totalExpenses) || 0,
      net_earnings: Number(record.netEarnings) || 0,
      date: record.date || new Date().toISOString().split('T')[0],
      status: 'completed',
      created_at: record.createdAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('jobs').upsert(payload);
    if (error) console.error('Supabase saveUserJob error:', error);

    return fetchUserJobs(userId);
  } else {
    const key = getUserStorageKey(userId, 'jobs');
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [record, ...existing.filter(r => r.id !== record.id)];
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  }
}

/**
 * Update a completed job record
 */
export async function updateUserJob(userId, updatedRecord) {
  return saveUserJob(userId, updatedRecord);
}

/**
 * Delete a completed job record
 */
export async function deleteUserJob(userId, recordId) {
  if (!userId || !recordId) return [];

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', recordId)
      .eq('user_id', userId);

    if (error) console.error('Supabase deleteUserJob error:', error);
    return fetchUserJobs(userId);
  } else {
    const key = getUserStorageKey(userId, 'jobs');
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = existing.filter(r => r.id !== recordId);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  }
}

/**
 * Fetch customer work queue for active user
 */
export async function fetchUserQueue(userId) {
  if (!userId) return [];

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('customer_queue')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetchUserQueue error:', error);
      const cached = localStorage.getItem(getUserStorageKey(userId, 'queue'));
      return cached ? JSON.parse(cached) : [];
    }

    const mapped = (data || []).map(c => ({
      id: c.id,
      userId: c.user_id,
      customerName: c.customer_name,
      mobileNumber: c.mobile_number,
      address: c.address,
      location: c.location,
      workDescription: c.work_description,
      ratePerMinute: Number(c.rate_per_minute) || 100,
      timerMode: c.timer_mode || 'stopwatch',
      durationMinutesPreset: c.duration_minutes_preset,
      status: c.status || 'pending',
      expenses: c.expenses || { diesel: 0, driver: 0, food: 0, other: 0 },
      createdAt: c.created_at,
    }));

    localStorage.setItem(getUserStorageKey(userId, 'queue'), JSON.stringify(mapped));
    return mapped;
  } else {
    const key = getUserStorageKey(userId, 'queue');
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify([]));
      return [];
    }
    return JSON.parse(stored);
  }
}

/**
 * Add / Update queued customer
 */
export async function saveQueuedCustomer(userId, customer) {
  if (!userId || !customer) return [];

  if (isSupabaseConfigured() && supabase) {
    const payload = {
      id: customer.id,
      user_id: userId,
      customer_name: customer.customerName,
      mobile_number: customer.mobileNumber || '',
      address: customer.address || '',
      location: customer.location || customer.address || '',
      work_description: customer.workDescription || '',
      rate_per_minute: Number(customer.ratePerMinute) || 100,
      timer_mode: customer.timerMode || 'stopwatch',
      duration_minutes_preset: customer.durationMinutesPreset || null,
      status: customer.status || 'pending',
      expenses: customer.expenses || { diesel: 0, driver: 0, food: 0, other: 0 },
      created_at: customer.createdAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('customer_queue').upsert(payload);
    if (error) console.error('Supabase saveQueuedCustomer error:', error);

    return fetchUserQueue(userId);
  } else {
    const key = getUserStorageKey(userId, 'queue');
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [customer, ...existing.filter(c => c.id !== customer.id)];
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  }
}

/**
 * Remove queued customer (e.g. upon job completion)
 */
export async function removeQueuedCustomer(userId, customerId) {
  if (!userId || !customerId) return [];

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('customer_queue')
      .delete()
      .eq('id', customerId)
      .eq('user_id', userId);

    if (error) console.error('Supabase removeQueuedCustomer error:', error);
    return fetchUserQueue(userId);
  } else {
    const key = getUserStorageKey(userId, 'queue');
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = existing.filter(c => c.id !== customerId);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  }
}

/**
 * Update Profile Details
 */
export async function updateUserProfile(userId, updates) {
  if (!userId) return null;

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: updates.fullName,
        mobile_number: updates.mobileNumber,
        location: updates.location,
        default_rate: Number(updates.defaultRate) || 100,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const current = JSON.parse(localStorage.getItem('traculator_current_user_v1') || '{}');
    const updated = { ...current, ...updates };
    localStorage.setItem('traculator_current_user_v1', JSON.stringify(updated));

    const mockUsers = JSON.parse(localStorage.getItem('traculator_mock_users_v1') || '[]');
    const updatedList = mockUsers.map(u => u.id === userId ? { ...u, ...updates } : u);
    localStorage.setItem('traculator_mock_users_v1', JSON.stringify(updatedList));

    return updated;
  }
}

// =========================================================
// ADMIN DATA ACCESS METHODS (Authorized Admin Role Only)
// =========================================================

/**
 * Fetch all registered customers for Admin Panel
 */
export async function fetchAllCustomersForAdmin() {
  if (isSupabaseConfigured() && supabase) {
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (pError) console.error('Admin fetch profiles error:', pError);

    const { data: jobs, error: jError } = await supabase
      .from('jobs')
      .select('user_id, work_amount, total_expenses, net_earnings, duration_seconds');

    if (jError) console.error('Admin fetch jobs error:', jError);

    return (profiles || []).map(p => {
      const userJobs = (jobs || []).filter(j => j.user_id === p.id);
      const totalJobs = userJobs.length;
      const totalIncome = userJobs.reduce((sum, j) => sum + (Number(j.work_amount) || 0), 0);
      const totalExpenses = userJobs.reduce((sum, j) => sum + (Number(j.total_expenses) || 0), 0);
      const totalNet = userJobs.reduce((sum, j) => sum + (Number(j.net_earnings) || 0), 0);
      const totalDuration = userJobs.reduce((sum, j) => sum + (Number(j.duration_seconds) || 0), 0);

      return {
        id: p.id,
        customerId: p.customer_id,
        fullName: p.full_name,
        mobileNumber: p.mobile_number,
        location: p.location,
        defaultRate: Number(p.default_rate) || 100,
        role: p.role,
        createdAt: p.created_at,
        totalJobs,
        totalIncome,
        totalExpenses,
        totalNet,
        totalDuration,
      };
    });
  } else {
    // Local mock users aggregator for Admin
    const mockUsers = JSON.parse(localStorage.getItem('traculator_mock_users_v1') || '[]');
    
    return mockUsers.map(u => {
      const key = getUserStorageKey(u.id, 'jobs');
      const jobs = JSON.parse(localStorage.getItem(key) || '[]');
      const totalJobs = jobs.length;
      const totalIncome = jobs.reduce((sum, j) => sum + (Number(j.workAmount) || 0), 0);
      const totalExpenses = jobs.reduce((sum, j) => sum + (Number(j.totalExpenses) || 0), 0);
      const totalNet = jobs.reduce((sum, j) => sum + (Number(j.netEarnings) || 0), 0);
      const totalDuration = jobs.reduce((sum, j) => sum + (Number(j.durationSeconds) || 0), 0);

      return {
        id: u.id,
        customerId: u.customerId,
        fullName: u.fullName,
        mobileNumber: u.mobileNumber,
        location: u.location,
        defaultRate: u.defaultRate || 100,
        role: u.role || 'customer',
        createdAt: u.createdAt || new Date().toISOString(),
        totalJobs,
        totalIncome,
        totalExpenses,
        totalNet,
        totalDuration,
      };
    });
  }
}

/**
 * Fetch all platform jobs for Admin Panel
 */
export async function fetchAllJobsForAdmin() {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, profiles(customer_id, full_name)')
      .order('created_at', { ascending: false });

    if (error) console.error('Admin fetch all jobs error:', error);

    return (data || []).map(r => ({
      id: r.id,
      userId: r.user_id,
      operatorCustomerId: r.profiles?.customer_id || '@unknown',
      operatorName: r.profiles?.full_name || 'Operator',
      customerName: r.customer_name,
      mobileNumber: r.mobile_number,
      location: r.location,
      workDescription: r.work_description,
      ratePerMinute: Number(r.rate_per_minute) || 100,
      timerMode: r.timer_mode,
      durationSeconds: Number(r.duration_seconds) || 0,
      workAmount: Number(r.work_amount) || 0,
      expenses: r.expenses || { diesel: 0, driver: 0, food: 0, other: 0 },
      totalExpenses: Number(r.total_expenses) || 0,
      netEarnings: Number(r.net_earnings) || 0,
      date: r.date,
      createdAt: r.created_at,
    }));
  } else {
    // Local mock jobs for Admin
    const mockUsers = JSON.parse(localStorage.getItem('traculator_mock_users_v1') || '[]');
    const allJobs = [];
    mockUsers.forEach(u => {
      const key = getUserStorageKey(u.id, 'jobs');
      const userJobs = JSON.parse(localStorage.getItem(key) || '[]');
      userJobs.forEach(j => {
        allJobs.push({
          ...j,
          operatorCustomerId: u.customerId,
          operatorName: u.fullName,
        });
      });
    });
    return allJobs;
  }
}
