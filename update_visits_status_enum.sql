-- Update Visits Status Enum
-- Drop the existing check constraint
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_status_check;

-- Add the new check constraint with the additional statuses
ALTER TABLE visits ADD CONSTRAINT visits_status_check 
CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Pending', 'Confirmed'));
