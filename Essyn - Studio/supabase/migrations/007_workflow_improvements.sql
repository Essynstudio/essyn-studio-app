-- Add category and color to workflow_templates
ALTER TABLE public.workflow_templates
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#007AFF';

-- Add comment
COMMENT ON COLUMN public.workflow_templates.category IS 'Category: casamento, ensaio, corporativo, album, geral';
COMMENT ON COLUMN public.workflow_templates.color IS 'HEX color for visual identification';
