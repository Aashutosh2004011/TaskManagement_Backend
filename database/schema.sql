-- Smart Task Manager Database Schema
-- PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS task_history CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('scheduling', 'finance', 'technical', 'safety', 'general')),
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    assigned_to TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    extracted_entities JSONB DEFAULT '{}',
    suggested_actions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task history/audit log table
CREATE TABLE task_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'status_changed', 'completed')),
    old_value JSONB,
    new_value JSONB,
    changed_by TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_task_history_changed_at ON task_history(changed_at);

-- Create full-text search index for title and description
CREATE INDEX idx_tasks_search ON tasks USING gin(
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on tasks table
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO tasks (title, description, category, priority, status, assigned_to, due_date, extracted_entities, suggested_actions) VALUES
(
    'Schedule urgent meeting with team today about budget allocation',
    'Need to discuss Q4 budget allocations and resource planning with the entire team. This is critical for our upcoming project.',
    'scheduling',
    'high',
    'pending',
    'John Smith',
    NOW() + INTERVAL '1 day',
    '{"dates": ["today"], "persons": ["team"], "actionVerbs": ["schedule"]}',
    '["Block calendar", "Send invite", "Prepare agenda", "Set reminder"]'
),
(
    'Fix production server error',
    'Critical bug causing 500 errors on the API server. Need to diagnose and repair immediately.',
    'technical',
    'high',
    'in_progress',
    'Jane Doe',
    NOW() + INTERVAL '2 hours',
    '{"actionVerbs": ["fix", "repair"]}',
    '["Diagnose issue", "Check resources", "Assign technician", "Document fix"]'
),
(
    'Process vendor invoice payment',
    'Review and pay the pending invoice from office supplies vendor. Amount: $5,000. Budget approval required.',
    'finance',
    'medium',
    'pending',
    'Finance Team',
    NOW() + INTERVAL '3 days',
    '{"actionVerbs": ["review", "pay"]}',
    '["Check budget", "Get approval", "Generate invoice", "Update records"]'
),
(
    'Conduct monthly safety inspection',
    'Perform routine safety inspection of all facilities. Check PPE compliance and hazard protocols.',
    'safety',
    'medium',
    'pending',
    'Safety Officer',
    NOW() + INTERVAL '7 days',
    '{"actionVerbs": ["check"]}',
    '["Conduct inspection", "File report", "Notify supervisor", "Update checklist"]'
),
(
    'Update project documentation',
    'Review and update the project documentation with latest changes and improvements.',
    'general',
    'low',
    'pending',
    NULL,
    NOW() + INTERVAL '14 days',
    '{"actionVerbs": ["review", "update"]}',
    '["Review details", "Assign owner", "Set deadline", "Track progress"]'
);

-- Comments for documentation
COMMENT ON TABLE tasks IS 'Main tasks table with auto-classification fields';
COMMENT ON TABLE task_history IS 'Audit log for task changes';
COMMENT ON COLUMN tasks.extracted_entities IS 'JSON field containing extracted dates, persons, locations, and action verbs';
COMMENT ON COLUMN tasks.suggested_actions IS 'JSON array of suggested actions based on task category';
