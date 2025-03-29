import { createClient } from '@supabase/supabase-js';
import {URL} from 'react-native-url-polyfill';
import { AppState } from 'react-native'
import 'react-native-url-polyfill/auto'

const supabaseUrl = 'https://jloahddizurxqzltkksk.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsb2FoZGRpenVyeHF6bHRra3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MDI1NjAsImV4cCI6MjA1MDQ3ODU2MH0.MymEhssDThYw5l3EdADOaMX_MDlkE3UeBdPcM-lrajI';

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})