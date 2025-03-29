import { createClient } from '@supabase/supabase-js';
import {URL} from 'react-native-url-polyfill';

const supabaseUrl = 'https://jloahddizurxqzltkksk.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsb2FoZGRpenVyeHF6bHRra3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MDI1NjAsImV4cCI6MjA1MDQ3ODU2MH0.MymEhssDThYw5l3EdADOaMX_MDlkE3UeBdPcM-lrajI'; 

global.URL = URL

export const supabase = createClient(supabaseUrl, supabaseKey);