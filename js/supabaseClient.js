
// js/supabaseClient.js

// Supabase Configuration
const SUPABASE_URL = 'https://xjceggpabmlwurprierg.supabase.co';
// Using the JWT part of the key provided.
// If the full string is required, it can be swapped, but standard is JWT.
// The provided key was: "sb_publishable_...,eyJ..."
// We will use the second part (JWT) which is standard for the JS client.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqY2VnZ3BhYm1sd3VycHJpZXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzkwMjcsImV4cCI6MjA4NzM1NTAyN30.nkFv1ld5npPy_xWQIOal_hCsPGy1wg75dwMdEwi1184';

// Initialize Supabase
let supabase;

if (window.supabase) {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase Client Initialized');
    } catch (err) {
        console.error('❌ Failed to initialize Supabase:', err);
    }
} else {
    console.error('❌ Supabase SDK not found. Ensure the CDN script is loaded.');
}

// --- Auth Functions ---

/**
 * Sign up a new user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user, session, error}>}
 */
async function signUp(email, password) {
    console.log('Supabase: Signing up...', email);
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        console.error('❌ Signup Error:', error.message);
        alert('Signup Failed: ' + error.message);
        return { error };
    }

    console.log('✅ Signup Successful:', data);
    return data;
}

/**
 * Sign in an existing user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user, session, error}>}
 */
async function signIn(email, password) {
    console.log('Supabase: Signing in...', email);
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error('❌ Login Error:', error.message);
        alert('Login Failed: ' + error.message);
        return { error };
    }

    console.log('✅ Login Successful:', data);
    return data;
}

/**
 * Sign out the current user
 */
async function signOut() {
    console.log('Supabase: Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('❌ Logout Error:', error.message);
        return { error };
    }
    console.log('✅ Logout Successful');
    return { success: true };
}

/**
 * Get the current active session
 * @returns {Promise<{session, error}>}
 */
async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error('❌ Session Error:', error.message);
        return null;
    }
    return data.session;
}

/**
 * Example: Fetch users from a 'users' table
 * Note: This requires a 'users' table to exist and RLS policies to allow reading.
 */
async function getUsers() {
    console.log('Supabase: Fetching users...');
    const { data, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error('❌ Fetch Users Error:', error.message);
        return null;
    }

    console.log('✅ Users Data:', data);
    return data;
}

// Expose functions globally for the SPA
window.sb = {
    client: supabase,
    signUp,
    signIn,
    signOut,
    getSession,
    getUsers
};
