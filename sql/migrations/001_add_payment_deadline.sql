-- Migration: 001_add_payment_deadline.sql
-- Tambah kolom payment_deadline ke tabel bookings
-- Jalankan ini di database (psql / Supabase SQL editor)

BEGIN;

-- 1) Tambah kolom payment_deadline (timestamp with time zone)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_deadline timestamptz DEFAULT NULL;

-- 2) (Opsional) index untuk query pencarian booking yang lewat deadline
CREATE INDEX IF NOT EXISTS idx_bookings_payment_deadline ON public.bookings (payment_deadline);

COMMIT;

-- Catatan:
-- - Setelah menjalankan migration ini, insert booking akan menyimpan nilai deadline.
-- - Untuk otomatis membatalkan booking yang melewati deadline, jalankan SQL periodic:
--   UPDATE public.bookings
--   SET status = 'cancelled'
--   WHERE status = 'pending' AND payment_deadline IS NOT NULL AND payment_deadline < now();
