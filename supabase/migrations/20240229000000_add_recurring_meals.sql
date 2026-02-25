-- Add recurring days to meals (0=Sun, 1=Mon, ..., 6=Sat)
ALTER TABLE meals ADD COLUMN recurring_days INTEGER[] DEFAULT NULL;

ALTER TABLE meals ADD CONSTRAINT valid_recurring_days
  CHECK (recurring_days IS NULL OR recurring_days <@ ARRAY[0,1,2,3,4,5,6]);
