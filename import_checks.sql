-- ============================================
-- IMPORT LOST CHECKS DATA
-- Run this in Supabase SQL Editor
-- ============================================

-- First, let's truncate the existing checks (if you want to replace all)
-- TRUNCATE TABLE public.checks CASCADE;

-- Check current data
SELECT COUNT(*) as current_checks FROM public.checks;

-- The data file is large, so we'll copy it and run it

-- You can paste the data from:
-- C:\Users\aziz\OneDrive\Desktop\New folder (5)\checks_rows.sql

-- After running, verify:
SELECT COUNT(*) as imported_checks FROM public.checks;
SELECT COUNT(*) as pending_checks FROM public.checks WHERE status = 'pending';