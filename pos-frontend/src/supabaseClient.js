import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqfpbvrrxutqvmpwapdg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZnBidnJyeHV0cXZtcHdhcGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0Nzg1NjEsImV4cCI6MjA5MTA1NDU2MX0.55kz-LdHl3n2wcZJ-wVe7zePafyJQYrtC2geUIYhk5c';

export const supabase = createClient(supabaseUrl, supabaseKey);