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
export async function fetchUserJobs(userId = 'trac_local_operator') {
  const effectiveUserId = userId || 'trac_local_operator';
  const key = getUserStorageKey(effectiveUserId, 'jobs');
  let cachedLocal = JSON.parse(localStorage.getItem(key) || '[]');

  // If local list is empty, fallback to universal APK backup storage
  if (cachedLocal.length === 0) {
    const universal = JSON.parse(localStorage.getItem('traculator_universal_jobs_v1') || '[]');
    if (universal.length > 0) {
      cachedLocal = universal;
      localStorage.setItem(key, JSON.stringify(cachedLocal));
    }
  }

  if (isSupabaseConfigured() && supabase && isValidUuid(effectiveUserId)) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetchUserJobs error:', error);
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

      // Merge remote records with any local records
      const mergedMap = new Map();
      mapped.forEach(item => mergedMap.set(item.id, item));
      cachedLocal.forEach(item => {
        if (!mergedMap.has(item.id)) {
          mergedMap.set(item.id, item);
        }
      });

      const merged = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      );

      localStorage.setItem(key, JSON.stringify(merged));
      localStorage.setItem('traculator_universal_jobs_v1', JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.error('fetchUserJobs remote fetch error:', err);
      return cachedLocal;
    }
  }

  return cachedLocal;
}

/**
 * Save a completed job record (Guaranteed storage in APK and Supabase)
 */
export async function saveUserJob(userId = 'trac_local_operator', record) {
  if (!record) return [];

  const effectiveUserId = userId || 'trac_local_operator';
  const key = getUserStorageKey(effectiveUserId, 'jobs');
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  const updatedLocal = [record, ...existing.filter(r => r.id !== record.id)];
  
  // 1. Save directly to local user storage (Instant in APK)
  localStorage.setItem(key, JSON.stringify(updatedLocal));

  // 2. Save to universal APK backup storage
  const universal = JSON.parse(localStorage.getItem('traculator_universal_jobs_v1') || '[]');
  const updatedUniversal = [record, ...universal.filter(r => r.id !== record.id)];
  localStorage.setItem('traculator_universal_jobs_v1', JSON.stringify(updatedUniversal));

  // 3. Sync to Supabase if configured and valid UUID
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
        console.error('Supabase saveUserJob error:', error);
      }
    } catch (err) {
      console.warn('Supabase remote save warning:', err);
    }
  }

  return updatedLocal;
}

/**
 * Update a completed job record
 */
export async function updateUserJob(userId = 'trac_local_operator', updatedRecord) {
  return saveUserJob(userId, updatedRecord);
}

/**
 * Delete a completed job record
 */
export async function deleteUserJob(userId = 'trac_local_operator', recordId) {
  if (!recordId) return [];

  const effectiveUserId = userId || 'trac_local_operator';
  const key = getUserStorageKey(effectiveUserId, 'jobs');
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  const updatedLocal = existing.filter(r => r.id !== recordId);
  localStorage.setItem(key, JSON.stringify(updatedLocal));

  // Update universal backup storage
  const universal = JSON.parse(localStorage.getItem('traculator_universal_jobs_v1') || '[]');
  const updatedUniversal = universal.filter(r => r.id !== recordId);
  localStorage.setItem('traculator_universal_jobs_v1', JSON.stringify(updatedUniversal));

  if (isSupabaseConfigured() && supabase && isValidUuid(effectiveUserId)) {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', recordId)
        .eq('user_id', effectiveUserId);

      if (error) console.error('Supabase deleteUserJob error:', error);
    } catch (err) {
      console.error('deleteUserJob remote error:', err);
    }
  }

  return updatedLocal;
}

/**
 * Fetch customer work queue
 */
export async function fetchUserQueue(userId = 'trac_local_operator') {
  const effectiveUserId = userId || 'trac_local_operator';
  const key = getUserStorageKey(effectiveUserId, 'queue');
  let cachedLocal = JSON.parse(localStorage.getItem(key) || '[]');

  if (isSupabaseConfigured() && supabase && isValidUuid(effectiveUserId)) {
    try {
      const { data, error } = await supabase
        .from('customer_queue')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetchUserQueue error:', error);
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
      console.error('fetchUserQueue remote error:', err);
      return cachedLocal;
    }
  }

  return cachedLocal;
}

/**
 * Add / Update queued customer
 */
export async function saveQueuedCustomer(userId = 'trac_local_operator', customer) {
  if (!customer) return [];

  const effectiveUserId = userId || 'trac_local_operator';
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
      if (error) console.error('Supabase saveQueuedCustomer error:', error);
    } catch (err) {
      console.error('saveQueuedCustomer remote error:', err);
    }
  }

  return updatedLocal;
}

/**
 * Remove queued customer
 */
export async function removeQueuedCustomer(userId = 'trac_local_operator', customerId) {
  if (!customerId) return [];

  const effectiveUserId = userId || 'trac_local_operator';
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

      if (error) console.error('Supabase removeQueuedCustomer error:', error);
    } catch (err) {
      console.error('removeQueuedCustomer remote error:', err);
    }
  }

  return updatedLocal;
}

/**
 * Update Profile Details in public.profiles (id, name, phone, email, address, updated_at)
 */
export async function updateUserProfile(userId = 'trac_local_operator', updates) {
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
