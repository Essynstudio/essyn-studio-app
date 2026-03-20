-- Add "agendada" status to gallery_status enum
ALTER TYPE public.gallery_status ADD VALUE IF NOT EXISTS 'agendada' BEFORE 'rascunho';
