import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Storage Keys for Local Offline Mirroring & Fast APK Startup
 */
const getUserStorageKey = (userId, prefix) => `traculator_${prefix}_${userId || 'local_operator'}`;

/**
 * Helper to check valid UUID
 */
function isValidUuid(id) {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Helper to ensure safe ISO date string
 */
function safeIsoDate(val) {
  if (!val) return new Date().toISOString();
  try {
    const d = new Date(val);
    return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

/**
 * Helper to ensure a profile row exists in public.profiles before foreign key operations
 * Columns: id (uuid), name (text), phone (text), email (text), address (text)
 */
async function ensureProfileExists(userId) {
  if (!isSupabaseConfigured() || !supabase || !isValidUuid(userId)) return;
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!existing) {
      const userStr = localStorage.getItem('traculator_current_user_v1');
      const cachedUser = userStr ? JSON.parse(userStr) : null;
      const name = cachedUser?.name || cachedUser?.fullName || cachedUser?.full_name || 'Operator';
      const phone = cachedUser?.phone || cachedUser?.mobileNumber || cachedUser?.mobile_number || '';
      const email = cachedUser?.email || '';
      const address = cachedUser?.address || cachedUser?.location || '';

      await supabase.from('profiles').upsert({
        id: userId,
        name,
        phone,
        email,
        address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Could not verify profile before save:', err);
  }
}

/**
 * Fetch all completed jobs for the current authenticated user (with APK & offline resilience)
 */
export async function fetchUserJobs(userId) {
  if (!userId) return [];
  const effectiveUserId = userId;
  const key = getUserStorageKey(effectiveUserId, 'jobs');
  const cachedLocal = JSON.parse(localStorage.getItem(key) || '[]');

  if (isSupabaseConfigured() && supabase && isValidUuid(effectiveUserId)) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchUserJobs notice:', error.message);
        return cachedLocal;
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

      // Cache strictly for this authenticated user
      localStorage.setItem(key, JSON.stringify(mapped));
      return mapped;
    } catch (err) {
      console.warn('fetchUserJobs remote fetch issue:', err);
      return cachedLocal;
    }
  }

  return cachedLocal;
}

/**
 * Save a completed job record (Guaranteed storage in APK and Supabase)
 */
export async function saveUserJob(userId, record) {
  if (!userId || !record) return [];

  const effectiveUserId = userId;
  const key = getUserStorageKey(effectiveUserId, 'jobs');
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  const updatedLocal = [record, ...existing.filter(r => r.id !== record.id)];
  
  // Save directly to user-specific local storage
  localStorage.setItem(key, JSON.stringify(updatedLocal));

  // Sync to Supabase if configured and valid UUID
  if (isSupabaseConfigured() && supabase && isValidUuid(effectiveUserId)) {
    try {
      await ensureProfileExists(effectiveUserId);

      const payload = {
        id: record.id,
        user_id: effectiveUserId,
        customer_name: record.customerName || 'Field Customer',
        mobile_number: record.mobileNumber || '',
        address: record.address || '',
        location: record.location || record.address || '',
        work_description: record.workDescription || '',
        rate_per_minute: Number(record.ratePerMinute) || 100,
        timer_mode: record.timerMode || 'stopwatch',
        duration_minutes_preset: record.durationMinutesPreset || null,
        start_time: safeIsoDate(record.startTime),
        end_time: safeIsoDate(record.endTime),
        duration_seconds: Number(record.durationSeconds) || 0,
        work_amount: Number(record.workAmount) || 0,
        expenses: record.expenses || { diesel: 0, driver: 0, food: 0, other: 0 },
        total_expenses: Number(record.totalExpenses) || 0,
        net_earnings: Number(record.netEarnings) || 0,
        date: record.date || new Date().toISOString().split('T')[0],
        status: 'completed',
        created_at: safeIsoDate(record.createdAt),
      };

      const { error } = await supabase.from('jobs').upsert(payload);
      if (error) {
        console.warn('Supabase saveUserJob notice:', error.message);
      }
    } catch (err) {
      console.warn('Supabase remote save issue:', err);
    }
  }

  return updatedLocal;
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

  const effectiveUserId = userId;
  const key = getUserStorageKey(effectiveUserId, 'jobs');
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  const updatedLocal = existing.filter(r => r.id !== recordId);
  localStorage.setItem(key, JSON.stringify(updatedLocal));

  if (isSupabaseConfigured() && supabase && isValidUuid(effectiveUserId)) {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', recordId)
        .eq('user_id', effectiveUserId);

      if (error) console.warn('Supabase deleteUserJob notice:', error.message);
    } catch (err) {
      console.warn('deleteUserJob remote error:', err);
    }
  }

  return updatedLocal;
}

/**
 * Fetch customer work queue
 */
export async function fetchUserQueue(userId) {
  if (!userId) return [];
  const effectiveUserId = userId;
  const key = getUserStorageKey(effectiveUserId, 'queue');
  const cachedLocal = JSON.parse(localStorage.getItem(key) || '[]');

  if (isSupabaseConfigured() && supabase && isValidUuid(effectiveUserId)) {
    try {
      const { data, error } = await supabase
        .from('customer_queue')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchUserQueue notice:', error.message);
        return cachedLocal;
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

      localStorage.setItem(key, JSON.stringify(mapped));
      return mapped;
    } catch (err) {
      console.warn('fetchUserQueue remote error:', err);
      return cachedLocal;
    }
  }

  return cachedLocal;
}

/**
 * Add / Update queued customer
 */
export async function saveQueuedCustomer(userId, customer) {
  if (!userId || !customer) return [];

  const effectiveUserId = userId;
  const key = getUserStorageKey(effectiveUserId, 'queue');
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  const updatedLocal = [customer, ...existing.filter(c => c.id !== customer.id)];
  localStorage.setItem(key, JSON.stringify(updatedLocal));

  if (isSupabaseConfigured() && supabase && isValidUuid(effectiveUserId)) {
    try {
      await ensureProfileExists(effectiveUserId);

      const payload = {
        id: customer.id,
        user_id: effectiveUserId,
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
        created_at: safeIsoDate(customer.createdAt),
      };

      const { error } = await supabase.from('customer_queue').upsert(payload);
      if (error) console.warn('Supabase saveQueuedCustomer notice:', error.message);
    } catch (err) {
      console.warn('saveQueuedCustomer remote error:', err);
    }
  }

  return updatedLocal;
}

/**
 * Remove queued customer
 */
export async function removeQueuedCustomer(userId, customerId) {
  if (!userId || !customerId) return [];

  const effectiveUserId = userId;
  const key = getUserStorageKey(effectiveUserId, 'queue');
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  const updatedLocal = existing.filter(c => c.id !== customerId);
  localStorage.setItem(key, JSON.stringify(updatedLocal));

  if (isSupabaseConfigured() && supabase && isValidUuid(effectiveUserId)) {
    try {
      const { error } = await supabase
        .from('customer_queue')
        .delete()
        .eq('id', customerId)
        .eq('user_id', effectiveUserId);

      if (error) console.warn('Supabase removeQueuedCustomer notice:', error.message);
    } catch (err) {
      console.warn('removeQueuedCustomer remote error:', err);
    }
  }

  return updatedLocal;
}

/**
 * Update Profile Details in public.profiles (id, name, phone, email, address, updated_at)
 */
export async function updateUserProfile(userId, updates) {
  if (!userId) return null;
  const current = JSON.parse(localStorage.getItem('traculator_current_user_v1') || '{}');
  const updated = { ...current, ...updates };
  localStorage.setItem('traculator_current_user_v1', JSON.stringify(updated));

  const mockUsers = JSON.parse(localStorage.getItem('traculator_mock_users_v1') || '[]');
  const updatedList = mockUsers.map(u => u.id === userId ? { ...u, ...updates } : u);
  localStorage.setItem('traculator_mock_users_v1', JSON.stringify(updatedList));

  if (isSupabaseConfigured() && supabase && isValidUuid(userId)) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: updates.name || updates.fullName,
          phone: updates.phone || updates.mobileNumber,
          email: updates.email,
          address: updates.address || updates.location,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('updateUserProfile error:', err);
    }
  }

  return updated;
}

// =========================================================
// CUSTOMER PAYMENTS & REUSABLE PROFILES STORAGE
// =========================================================

/**
 * Fetch all payments for the current user/operator
 */
export async function fetchUserPayments(userId) {
  if (!userId) return [];
  const effectiveUserId = userId;
  const key = getUserStorageKey(effectiveUserId, 'payments');
  const cachedLocal = JSON.parse(localStorage.getItem(key) || '[]');

  if (isSupabaseConfigured() && supabase && isValidUuid(effectiveUserId)) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchUserPayments notice:', error.message);
        return cachedLocal;
      }

      const mapped = (data || []).map(p => ({
        id: p.id,
        userId: p.user_id,
        customerId: p.customer_id,
        customerName: p.customer_name,
        mobileNumber: p.mobile_number || '',
        amount: Number(p.amount) || 0,
        date: p.date,
        time: p.time,
        timestamp: p.timestamp || p.created_at,
        paymentMode: p.payment_mode || 'Cash',
        notes: p.notes || '',
        createdAt: p.created_at,
      }));

      localStorage.setItem(key, JSON.stringify(mapped));
      return mapped;
    } catch (err) {
      console.warn('Supabase fetchUserPayments error:', err);
      return cachedLocal;
    }
  }

  return cachedLocal;
}

/**
 * Save a new or updated payment record
 */
export async function saveUserPayment(userId, payment) {
  if (!userId || !payment) return [];

  const effectiveUserId = userId;
  const key = getUserStorageKey(effectiveUserId, 'payments');
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  const updatedLocal = [payment, ...existing.filter(p => p.id !== payment.id)];

  localStorage.setItem(key, JSON.stringify(updatedLocal));

  if (isSupabaseConfigured() && supabase && isValidUuid(effectiveUserId)) {
    try {
      await ensureProfileExists(effectiveUserId);

      const payload = {
        id: payment.id,
        user_id: effectiveUserId,
        customer_id: payment.customerId || null,
        customer_name: payment.customerName || 'Customer',
        mobile_number: payment.mobileNumber || '',
        amount: Number(payment.amount) || 0,
        date: payment.date || new Date().toISOString().split('T')[0],
        time: payment.time || '',
        timestamp: safeIsoDate(payment.timestamp || payment.createdAt),
        payment_mode: payment.paymentMode || 'Cash',
        notes: payment.notes || '',
        created_at: safeIsoDate(payment.createdAt),
      };

      const { error } = await supabase.from('payments').upsert(payload);
      if (error) console.warn('Supabase saveUserPayment note:', error.message);
    } catch (err) {
      console.warn('saveUserPayment remote error:', err);
    }
  }

  return updatedLocal;
}

/**
 * Update an existing payment record
 */
export async function updateUserPayment(userId, updatedPayment) {
  return saveUserPayment(userId, updatedPayment);
}

/**
 * Delete a payment record
 */
export async function deleteUserPayment(userId, paymentId) {
  if (!userId || !paymentId) return [];

  const effectiveUserId = userId;
  const key = getUserStorageKey(effectiveUserId, 'payments');
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  const updatedLocal = existing.filter(p => p.id !== paymentId);
  localStorage.setItem(key, JSON.stringify(updatedLocal));

  if (isSupabaseConfigured() && supabase && isValidUuid(effectiveUserId)) {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)
        .eq('user_id', effectiveUserId);

      if (error) console.warn('Supabase deleteUserPayment note:', error.message);
    } catch (err) {
      console.warn('deleteUserPayment remote error:', err);
    }
  }

  return updatedLocal;
}

/**
 * Fetch reusable Customer Profiles (Aggregated from Supabase and user-specific local jobs & queue)
 */
export async function fetchCustomerProfiles(userId) {
  if (!userId) return [];
  const effectiveUserId = userId;
  const key = getUserStorageKey(effectiveUserId, 'customer_profiles');
  const cachedLocal = JSON.parse(localStorage.getItem(key) || '[]');

  let remoteProfiles = [];
  if (isSupabaseConfigured() && supabase && isValidUuid(effectiveUserId)) {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('customer_name', { ascending: true });

      if (!error && data) {
        remoteProfiles = data.map(p => ({
          id: p.id,
          userId: p.user_id,
          customerName: p.customer_name,
          mobileNumber: p.mobile_number || '',
          address: p.address || '',
          location: p.location || p.address || '',
          workDescription: p.work_description || '',
          ratePerMinute: Number(p.rate_per_minute) || 100,
          timerMode: p.timer_mode || 'stopwatch',
          durationMinutesPreset: p.duration_minutes_preset || 20,
          createdAt: p.created_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchCustomerProfiles note:', err);
    }
  }

  const profileMap = new Map();

  // 1. Add remote profiles first (source of truth)
  remoteProfiles.forEach(p => {
    const normKey = (p.customerName || p.id || '').toLowerCase().trim();
    if (normKey) profileMap.set(normKey, p);
  });

  // 2. Add local profiles for this user
  cachedLocal.forEach(p => {
    const normKey = (p.customerName || p.id || '').toLowerCase().trim();
    if (normKey && !profileMap.has(normKey)) profileMap.set(normKey, p);
  });

  // 3. Discover from this user's jobs
  const jobsKey = getUserStorageKey(effectiveUserId, 'jobs');
  const userJobs = JSON.parse(localStorage.getItem(jobsKey) || '[]');
  userJobs.forEach(j => {
    const cName = (j.customerName || '').trim();
    if (!cName) return;
    const normKey = cName.toLowerCase();
    if (!profileMap.has(normKey)) {
      profileMap.set(normKey, {
        id: j.customerId || `CUST-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        customerName: cName,
        mobileNumber: j.mobileNumber || '',
        address: j.address || '',
        location: j.location || j.address || '',
        workDescription: j.workDescription || 'Standard Agricultural Tractor Work',
        ratePerMinute: Number(j.ratePerMinute) || 100,
        timerMode: j.timerMode || 'stopwatch',
        durationMinutesPreset: j.durationMinutesPreset || 20,
        createdAt: j.createdAt || new Date().toISOString(),
      });
    }
  });

  // 4. Discover from this user's queue
  const queueKey = getUserStorageKey(effectiveUserId, 'queue');
  const userQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
  userQueue.forEach(q => {
    const cName = (q.customerName || '').trim();
    if (!cName) return;
    const normKey = cName.toLowerCase();
    if (!profileMap.has(normKey)) {
      profileMap.set(normKey, {
        id: q.id || `CUST-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        customerName: cName,
        mobileNumber: q.mobileNumber || '',
        address: q.address || '',
        location: q.location || q.address || '',
        workDescription: q.workDescription || 'Standard Agricultural Tractor Work',
        ratePerMinute: Number(q.ratePerMinute) || 100,
        timerMode: q.timerMode || 'stopwatch',
        durationMinutesPreset: q.durationMinutesPreset || 20,
        createdAt: q.createdAt || new Date().toISOString(),
      });
    }
  });

  const allProfiles = Array.from(profileMap.values()).sort(
    (a, b) => (a.customerName || '').localeCompare(b.customerName || '')
  );

  localStorage.setItem(key, JSON.stringify(allProfiles));
  return allProfiles;
}

/**
 * Save / Update a Reusable Customer Profile
 */
export async function saveCustomerProfile(userId, profile) {
  if (!userId || !profile || !profile.customerName) return [];

  const effectiveUserId = userId;
  const key = getUserStorageKey(effectiveUserId, 'customer_profiles');
  const existing = JSON.parse(localStorage.getItem(key) || '[]');

  const normTarget = (profile.customerName || '').trim().toLowerCase();
  const filtered = existing.filter(p => {
    if (profile.id && p.id === profile.id) return false;
    if ((p.customerName || '').trim().toLowerCase() === normTarget) return false;
    return true;
  });

  const updatedLocal = [profile, ...filtered];
  localStorage.setItem(key, JSON.stringify(updatedLocal));

  if (isSupabaseConfigured() && supabase && isValidUuid(effectiveUserId)) {
    try {
      await ensureProfileExists(effectiveUserId);
      const payload = {
        id: profile.id,
        user_id: effectiveUserId,
        customer_name: profile.customerName,
        mobile_number: profile.mobileNumber || '',
        address: profile.address || '',
        location: profile.location || profile.address || '',
        work_description: profile.workDescription || '',
        rate_per_minute: Number(profile.ratePerMinute) || 100,
        timer_mode: profile.timerMode || 'stopwatch',
        duration_minutes_preset: profile.durationMinutesPreset || null,
        created_at: safeIsoDate(profile.createdAt),
      };
      const { error } = await supabase.from('customer_profiles').upsert(payload);
      if (error) console.warn('Supabase saveCustomerProfile note:', error.message);
    } catch (err) {
      console.warn('saveCustomerProfile remote error:', err);
    }
  }

  return updatedLocal;
}

// =========================================================
// ADMIN DATA ACCESS METHODS (Unified Cloud + Local Aggregation)
// =========================================================

/**
 * Fetch all registered customers across Supabase and Local Storage for Admin Panel
 */
export async function fetchAllCustomersForAdmin() {
  const customerMap = new Map();

  // 1. Fetch remote profiles and jobs from Supabase if configured
  let remoteProfiles = [];
  let remoteJobs = [];

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!pError && profiles) {
        remoteProfiles = profiles;
      } else if (pError) {
        console.warn('Supabase admin profiles fetch notice:', pError);
      }

      const { data: jobs, error: jError } = await supabase
        .from('jobs')
        .select('*');

      if (!jError && jobs) {
        remoteJobs = jobs;
      } else if (jError) {
        console.warn('Supabase admin jobs fetch notice:', jError);
      }
    } catch (err) {
      console.warn('Supabase admin fetch network issue:', err);
    }
  }

  // 2. Add remote profiles to map (name, phone, email, address)
  remoteProfiles.forEach(p => {
    const cleanName = p.name || p.full_name || 'Operator';
    const cleanPhone = p.phone || p.mobile_number || '';
    const cleanEmail = p.email || '';
    const cleanAddress = p.address || p.location || '';

    customerMap.set(p.id, {
      id: p.id,
      name: cleanName,
      fullName: cleanName,
      phone: cleanPhone,
      mobileNumber: cleanPhone,
      email: cleanEmail,
      address: cleanAddress,
      location: cleanAddress,
      defaultRate: 100,
      role: 'customer',
      createdAt: p.created_at || new Date().toISOString(),
      jobs: [],
    });
  });

  // 3. Read all local registered users from localStorage
  const mockUsers = JSON.parse(localStorage.getItem('traculator_mock_users_v1') || '[]');
  mockUsers.forEach(u => {
    if (!customerMap.has(u.id)) {
      const cleanName = u.name || u.fullName || u.full_name || 'Operator';
      const cleanPhone = u.phone || u.mobileNumber || u.mobile_number || '';
      const cleanEmail = u.email || '';
      const cleanAddress = u.address || u.location || '';

      customerMap.set(u.id, {
        id: u.id,
        name: cleanName,
        fullName: cleanName,
        phone: cleanPhone,
        mobileNumber: cleanPhone,
        email: cleanEmail,
        address: cleanAddress,
        location: cleanAddress,
        defaultRate: Number(u.defaultRate || u.default_rate) || 100,
        role: u.role || 'customer',
        createdAt: u.createdAt || u.created_at || new Date().toISOString(),
        jobs: [],
      });
    }
  });

  // 4. Also check current user in localStorage
  const currentUserStr = localStorage.getItem('traculator_current_user_v1');
  if (currentUserStr) {
    try {
      const cu = JSON.parse(currentUserStr);
      if (cu && cu.id && !customerMap.has(cu.id) && cu.role !== 'admin') {
        const cleanName = cu.name || cu.fullName || cu.full_name || 'Operator';
        const cleanPhone = cu.phone || cu.mobileNumber || cu.mobile_number || '';
        const cleanEmail = cu.email || '';
        const cleanAddress = cu.address || cu.location || '';

        customerMap.set(cu.id, {
          id: cu.id,
          name: cleanName,
          fullName: cleanName,
          phone: cleanPhone,
          mobileNumber: cleanPhone,
          email: cleanEmail,
          address: cleanAddress,
          location: cleanAddress,
          defaultRate: Number(cu.defaultRate || cu.default_rate) || 100,
          role: cu.role || 'customer',
          createdAt: cu.createdAt || cu.created_at || new Date().toISOString(),
          jobs: [],
        });
      }
    } catch (e) {
      console.warn('Error parsing current user for admin:', e);
    }
  }

  // 5. Gather all jobs (both remote and local)
  const allJobsMap = new Map();

  // Add remote jobs
  remoteJobs.forEach(j => {
    allJobsMap.set(j.id, {
      id: j.id,
      userId: j.user_id,
      workAmount: Number(j.work_amount) || 0,
      totalExpenses: Number(j.total_expenses) || 0,
      netEarnings: Number(j.net_earnings) || 0,
      durationSeconds: Number(j.duration_seconds) || 0,
    });
  });

  // Add universal local jobs
  const universalJobs = JSON.parse(localStorage.getItem('traculator_universal_jobs_v1') || '[]');
  universalJobs.forEach(j => {
    if (!allJobsMap.has(j.id)) {
      allJobsMap.set(j.id, {
        id: j.id,
        userId: j.userId || 'trac_local_operator',
        workAmount: Number(j.workAmount) || 0,
        totalExpenses: Number(j.totalExpenses) || 0,
        netEarnings: Number(j.netEarnings) || 0,
        durationSeconds: Number(j.durationSeconds) || 0,
      });
    }
  });

  // Add user-specific local jobs across localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('traculator_jobs_')) {
      const uId = key.replace('traculator_jobs_', '');
      try {
        const uJobs = JSON.parse(localStorage.getItem(key) || '[]');
        uJobs.forEach(j => {
          if (!allJobsMap.has(j.id)) {
            allJobsMap.set(j.id, {
              id: j.id,
              userId: j.userId || uId,
              workAmount: Number(j.workAmount) || 0,
              totalExpenses: Number(j.totalExpenses) || 0,
              netEarnings: Number(j.netEarnings) || 0,
              durationSeconds: Number(j.durationSeconds) || 0,
            });
          }
        });
      } catch (e) {
        console.warn('Error parsing local jobs for admin:', e);
      }
    }
  }

  // If map is empty but jobs exist, ensure at least a default operator account
  if (customerMap.size === 0) {
    customerMap.set('trac_local_operator', {
      id: 'trac_local_operator',
      name: 'Tractor Operator',
      fullName: 'Tractor Operator',
      phone: '',
      mobileNumber: '',
      email: '',
      address: 'Field Work',
      location: 'Field Work',
      defaultRate: 100,
      role: 'customer',
      createdAt: new Date().toISOString(),
      jobs: [],
    });
  }

  // 6. Aggregate metrics for each customer
  const customersList = Array.from(customerMap.values()).map(cust => {
    const custJobs = Array.from(allJobsMap.values()).filter(j => j.userId === cust.id);
    const totalJobs = custJobs.length;
    const totalIncome = custJobs.reduce((sum, j) => sum + (j.workAmount || 0), 0);
    const totalExpenses = custJobs.reduce((sum, j) => sum + (j.totalExpenses || 0), 0);
    const totalNet = custJobs.reduce((sum, j) => sum + (j.netEarnings || 0), 0);
    const totalDuration = custJobs.reduce((sum, j) => sum + (j.durationSeconds || 0), 0);

    return {
      ...cust,
      totalJobs,
      totalIncome,
      totalExpenses,
      totalNet,
      totalDuration,
    };
  });

  return customersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Fetch all completed jobs across all customers for Admin Panel
 */
export async function fetchAllJobsForAdmin() {
  const jobsMap = new Map();

  // 1. Fetch remote jobs from Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        data.forEach(r => {
          jobsMap.set(r.id, {
            id: r.id,
            userId: r.user_id,
            operatorName: 'Operator',
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
          });
        });
      }
    } catch (err) {
      console.warn('Supabase fetchAllJobsForAdmin notice:', err);
    }
  }

  // 2. Add universal local jobs
  const universalJobs = JSON.parse(localStorage.getItem('traculator_universal_jobs_v1') || '[]');
  universalJobs.forEach(j => {
    if (!jobsMap.has(j.id)) {
      jobsMap.set(j.id, {
        id: j.id,
        userId: j.userId || 'trac_local_operator',
        operatorName: j.operatorName || 'Operator',
        customerName: j.customerName || 'Field Customer',
        mobileNumber: j.mobileNumber || '',
        address: j.address || '',
        location: j.location || '',
        workDescription: j.workDescription || '',
        ratePerMinute: Number(j.ratePerMinute) || 100,
        timerMode: j.timerMode || 'stopwatch',
        durationMinutesPreset: j.durationMinutesPreset,
        startTime: j.startTime,
        endTime: j.endTime,
        durationSeconds: Number(j.durationSeconds) || 0,
        workAmount: Number(j.workAmount) || 0,
        expenses: j.expenses || { diesel: 0, driver: 0, food: 0, other: 0 },
        totalExpenses: Number(j.totalExpenses) || 0,
        netEarnings: Number(j.netEarnings) || 0,
        date: j.date || new Date().toISOString().split('T')[0],
        status: j.status || 'completed',
        createdAt: j.createdAt || new Date().toISOString(),
      });
    }
  });

  // 3. Add jobs from all local user storage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('traculator_jobs_')) {
      const uId = key.replace('traculator_jobs_', '');
      try {
        const uJobs = JSON.parse(localStorage.getItem(key) || '[]');
        uJobs.forEach(j => {
          if (!jobsMap.has(j.id)) {
            jobsMap.set(j.id, {
              id: j.id,
              userId: j.userId || uId,
              operatorName: j.operatorName || 'Operator',
              customerName: j.customerName || 'Field Customer',
              mobileNumber: j.mobileNumber || '',
              address: j.address || '',
              location: j.location || '',
              workDescription: j.workDescription || '',
              ratePerMinute: Number(j.ratePerMinute) || 100,
              timerMode: j.timerMode || 'stopwatch',
              durationMinutesPreset: j.durationMinutesPreset,
              startTime: j.startTime,
              endTime: j.endTime,
              durationSeconds: Number(j.durationSeconds) || 0,
              workAmount: Number(j.workAmount) || 0,
              expenses: j.expenses || { diesel: 0, driver: 0, food: 0, other: 0 },
              totalExpenses: Number(j.totalExpenses) || 0,
              netEarnings: Number(j.netEarnings) || 0,
              date: j.date || new Date().toISOString().split('T')[0],
              status: j.status || 'completed',
              createdAt: j.createdAt || new Date().toISOString(),
            });
          }
        });
      } catch (e) {
        console.warn('Error reading jobs for admin:', e);
      }
    }
  }

  // 4. Enhance with actual user names if known
  const customers = await fetchAllCustomersForAdmin();
  const custMap = new Map(customers.map(c => [c.id, c]));

  const allJobs = Array.from(jobsMap.values()).map(j => {
    const cust = custMap.get(j.userId);
    return {
      ...j,
      operatorName: cust?.name || cust?.fullName || j.operatorName || 'Operator',
    };
  });

  return allJobs.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
}
