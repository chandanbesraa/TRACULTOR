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
 * Normalizes identifier into an email for Supabase authentication
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
 * Customer Sign Up (Using only Email or Mobile Number + Password)
 */
export async function signUpCustomer({ identifier, password }) {
  const loginEmail = normalizeAuthIdentifier(identifier);
  const isPhone = !identifier.includes('@');
  const displayName = isPhone ? identifier : identifier.split('@')[0];

  if (isSupabaseConfigured() && supabase) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: loginEmail,
      password,
      options: {
        data: {
          full_name: displayName,
          mobile_number: isPhone ? identifier : '',
          email: identifier.includes('@') ? identifier : '',
          role: 'customer',
        },
      },
    });

    if (authError) throw authError;

    if (authData?.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        customer_id: displayName,
        full_name: displayName,
        mobile_number: isPhone ? identifier : '',
        location: '',
        default_rate: 100,
        role: 'customer',
        updated_at: new Date().toISOString(),
      });

      if (profileError) console.error('Error creating profile:', profileError);
    }

    return { user: authData.user };
  } else {
    // Local persistence fallback
    const mockUsers = JSON.parse(localStorage.getItem('traculator_mock_users_v1') || '[]');
    
    if (mockUsers.some(u => u.email === loginEmail || u.identifier === identifier)) {
      throw new Error('An account with this Email or Mobile Number already exists. Please sign in.');
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      email: loginEmail,
      identifier,
      password,
      fullName: displayName,
      mobileNumber: isPhone ? identifier : '',
      location: '',
      defaultRate: 100,
      role: 'customer',
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);
    localStorage.setItem('traculator_mock_users_v1', JSON.stringify(mockUsers));
    localStorage.setItem('traculator_current_user_v1', JSON.stringify(newUser));

    return { user: newUser };
  }
}

/**
 * Customer Sign In (Using only Email or Mobile Number + Password)
 */
export async function signInCustomer({ identifier, password }) {
  const loginEmail = normalizeAuthIdentifier(identifier);

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) throw error;

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    return { user: data.user, profile };
  } else {
    // Local persistence fallback
    const mockUsers = JSON.parse(localStorage.getItem('traculator_mock_users_v1') || '[]');

    const user = mockUsers.find(
      u => (u.email.toLowerCase() === loginEmail || u.identifier === identifier) &&
           u.password === password
    );

    if (!user) {
      throw new Error('Invalid Email/Mobile Number or Password.');
    }

    localStorage.setItem('traculator_current_user_v1', JSON.stringify(user));
    return { user, profile: user };
  }
}

/**
 * Admin Sign In
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

    return { user: data.user, profile };
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
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    return { ...session.user, ...profile };
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
