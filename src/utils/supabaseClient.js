import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('placeholder')
  );
};

// Create Supabase client if configured
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Normalizes identifier (Email or Mobile Phone) into a valid email string for Supabase Authentication
 */
export function normalizeAuthIdentifier(identifier) {
  if (!identifier) return '';
  const clean = identifier.trim();
  if (clean.includes('@') && clean.includes('.')) {
    return clean.toLowerCase();
  }
  // If phone number, format as valid authentication email
  const digits = clean.replace(/\D/g, '');
  return `${digits || clean}@traculator.in`.toLowerCase();
}

/**
 * Customer Sign Up (Using Supabase Auth + profiles table)
 * Columns: id (uuid), name (text), phone (text), email (text), address (text)
 */
export async function signUpCustomer({
  name = '',
  fullName = '',
  email = '',
  phone = '',
  mobileNumber = '',
  address = '',
  location = '',
  defaultRate = 100,
  password = '',
  identifier = '',
}) {
  const cleanName = (name || fullName || 'Operator').trim();
  const cleanEmail = (email || (identifier.includes('@') ? identifier : '')).trim();
  const cleanPhone = (phone || mobileNumber || (!identifier.includes('@') ? identifier : '')).trim();
  const cleanAddress = (address || location || '').trim();
  const effectiveIdentifier = (cleanEmail || cleanPhone || identifier || '').trim();
  const loginEmail = normalizeAuthIdentifier(effectiveIdentifier);

  let createdUserId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  let authUser = null;

  if (isSupabaseConfigured() && supabase) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: loginEmail,
      password,
      options: {
        data: {
          name: cleanName,
          full_name: cleanName,
          phone: cleanPhone,
          mobile_number: cleanPhone,
          email: cleanEmail,
          address: cleanAddress,
          location: cleanAddress,
        },
      },
    });

    if (authError) throw authError;

    if (authData?.user) {
      authUser = authData.user;
      createdUserId = authData.user.id;

      // Upsert to profiles table
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        address: cleanAddress,
        updated_at: new Date().toISOString(),
      });

      if (profileError) console.warn('Profile table upsert note:', profileError);
    }
  }

  // Unified User Profile Object (Without public usernames or displaying internal id)
  const userObj = {
    id: createdUserId,
    name: cleanName,
    fullName: cleanName,
    phone: cleanPhone,
    mobileNumber: cleanPhone,
    email: cleanEmail || loginEmail,
    address: cleanAddress,
    location: cleanAddress,
    defaultRate: Number(defaultRate) || 100,
    role: 'customer',
    createdAt: new Date().toISOString(),
  };

  // Mirror to local device storage for offline resilience
  const mockUsers = JSON.parse(localStorage.getItem('traculator_mock_users_v1') || '[]');
  const existingIdx = mockUsers.findIndex(u => u.id === userObj.id || (u.email && u.email.toLowerCase() === loginEmail.toLowerCase()));
  if (existingIdx >= 0) {
    mockUsers[existingIdx] = { ...mockUsers[existingIdx], ...userObj };
  } else {
    mockUsers.push(userObj);
  }
  localStorage.setItem('traculator_mock_users_v1', JSON.stringify(mockUsers));
  localStorage.setItem('traculator_current_user_v1', JSON.stringify(userObj));

  return { user: userObj };
}

/**
 * Customer Sign In (Using Email OR Mobile Phone + Password)
 */
export async function signInCustomer({ identifier, password }) {
  const loginEmail = normalizeAuthIdentifier(identifier);

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) throw error;

    // Fetch profile row from public.profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    const cleanName = profile?.name || profile?.full_name || data.user?.user_metadata?.name || data.user?.user_metadata?.full_name || 'Operator';
    const cleanPhone = profile?.phone || profile?.mobile_number || data.user?.user_metadata?.phone || data.user?.user_metadata?.mobile_number || '';
    const cleanEmail = profile?.email || data.user?.email || '';
    const cleanAddress = profile?.address || profile?.location || data.user?.user_metadata?.address || data.user?.user_metadata?.location || '';

    const mergedUser = {
      ...data.user,
      name: cleanName,
      fullName: cleanName,
      phone: cleanPhone,
      mobileNumber: cleanPhone,
      email: cleanEmail,
      address: cleanAddress,
      location: cleanAddress,
      defaultRate: 100,
      role: 'customer',
    };

    // Mirror to local storage
    const mockUsers = JSON.parse(localStorage.getItem('traculator_mock_users_v1') || '[]');
    const existingIdx = mockUsers.findIndex(u => u.id === mergedUser.id);
    if (existingIdx >= 0) {
      mockUsers[existingIdx] = { ...mockUsers[existingIdx], ...mergedUser };
    } else {
      mockUsers.push(mergedUser);
    }
    localStorage.setItem('traculator_mock_users_v1', JSON.stringify(mockUsers));
    localStorage.setItem('traculator_current_user_v1', JSON.stringify(mergedUser));

    return { user: mergedUser, profile };
  } else {
    // Local persistence fallback
    const mockUsers = JSON.parse(localStorage.getItem('traculator_mock_users_v1') || '[]');

    const user = mockUsers.find(
      u => (u.email.toLowerCase() === loginEmail || u.phone === identifier || u.identifier === identifier) &&
           u.password === password
    );

    if (!user) {
      throw new Error('Invalid Email/Phone Number or Password.');
    }

    localStorage.setItem('traculator_current_user_v1', JSON.stringify(user));
    return { user, profile: user };
  }
}

/**
 * Admin Sign In (Isolated at #admin)
 */
export async function signInAdmin({ email, password }) {
  // Master Admin Credentials
  if (
    (email.trim() === 'admin@traculator.in' || email.trim().toLowerCase() === 'admin') &&
    (password === 'admin123' || password === 'admin')
  ) {
    const adminUser = {
      id: 'admin_master_001',
      email: 'admin@traculator.in',
      name: 'TRACULATOR Master Admin',
      fullName: 'TRACULATOR Master Admin',
      role: 'admin',
    };
    localStorage.setItem('traculator_admin_user_v1', JSON.stringify(adminUser));
    return { user: adminUser, profile: adminUser };
  }

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;

    // Verify role in profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('Access Denied: You do not have administrator permissions.');
    }

    const adminObj = { ...data.user, ...profile };
    localStorage.setItem('traculator_admin_user_v1', JSON.stringify(adminObj));
    return { user: adminObj, profile };
  } else {
    throw new Error('Invalid Admin Credentials.');
  }
}

/**
 * Sign Out
 */
export async function signOutUser() {
  if (isSupabaseConfigured() && supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem('traculator_current_user_v1');
  localStorage.removeItem('traculator_admin_user_v1');
}

/**
 * Get Current Active User
 */
export async function getCurrentUser() {
  if (isSupabaseConfigured() && supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    const cleanName = profile?.name || profile?.full_name || session.user?.user_metadata?.name || session.user?.user_metadata?.full_name || 'Operator';
    const cleanPhone = profile?.phone || profile?.mobile_number || session.user?.user_metadata?.phone || session.user?.user_metadata?.mobile_number || '';
    const cleanEmail = profile?.email || session.user?.email || '';
    const cleanAddress = profile?.address || profile?.location || session.user?.user_metadata?.address || session.user?.user_metadata?.location || '';

    return {
      ...session.user,
      name: cleanName,
      fullName: cleanName,
      phone: cleanPhone,
      mobileNumber: cleanPhone,
      email: cleanEmail,
      address: cleanAddress,
      location: cleanAddress,
      defaultRate: 100,
      role: 'customer',
    };
  } else {
    const userStr = localStorage.getItem('traculator_current_user_v1');
    return userStr ? JSON.parse(userStr) : null;
  }
}

/**
 * Get Current Admin User
 */
export async function getCurrentAdmin() {
  const adminStr = localStorage.getItem('traculator_admin_user_v1');
  if (adminStr) {
    return JSON.parse(adminStr);
  }

  if (isSupabaseConfigured() && supabase) {
    const user = await getCurrentUser();
    return user?.role === 'admin' ? user : null;
  }
  return null;
}
