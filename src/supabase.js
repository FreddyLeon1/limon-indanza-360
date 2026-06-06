import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ntiyaqjwhwqcjfcurxmf.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50aXlhcWp3aHdxY2pmY3VyeG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjI4NTksImV4cCI6MjA5NjMzODg1OX0.oOr9ONPXL7GONIqQ8asnJ1IdBqN1WnIN7MhpIorkNHs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)