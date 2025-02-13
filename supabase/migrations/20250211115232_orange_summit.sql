/*
  # Character Management System

  1. New Tables
    - `groups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `mj_id` (uuid, references users)
      - `created_at` (timestamp)
      - `last_activity` (timestamp)
    
    - `group_members`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references groups)
      - `user_id` (uuid, references users)
      - `joined_at` (timestamp)
    
    - `characters`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `group_id` (uuid, references groups, nullable)
      - `data` (jsonb, stores character sheet data)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_template` (boolean, true if this is an original character)
      - `template_id` (uuid, references characters, for imported characters)

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mj_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  CONSTRAINT mj_group_limit CHECK (
    (SELECT count(*) FROM groups WHERE mj_id = auth.uid()) <= 10
  )
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  group_id uuid REFERENCES groups ON DELETE SET NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_template boolean DEFAULT true,
  template_id uuid REFERENCES characters(id),
  CONSTRAINT character_limit CHECK (
    (SELECT count(*) FROM characters 
     WHERE user_id = auth.uid() AND is_template = true) <= 10
  )
);

-- Enable Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Groups Policies
CREATE POLICY "MJs can create groups"
  ON groups FOR INSERT TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'mj' OR 
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "MJs can update their own groups"
  ON groups FOR UPDATE TO authenticated
  USING (mj_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (mj_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "MJs can delete their own groups"
  ON groups FOR DELETE TO authenticated
  USING (mj_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view groups they're members of"
  ON groups FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    ) OR 
    mj_id = auth.uid() OR 
    auth.jwt() ->> 'role' = 'admin'
  );

-- Group Members Policies
CREATE POLICY "MJs can add members to their groups"
  ON group_members FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT id FROM groups WHERE mj_id = auth.uid()
    ) OR 
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "MJs can remove members from their groups"
  ON group_members FOR DELETE TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups WHERE mj_id = auth.uid()
    ) OR 
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can view group members"
  ON group_members FOR SELECT TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups WHERE 
        id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()) OR
        mj_id = auth.uid()
    ) OR 
    auth.jwt() ->> 'role' = 'admin'
  );

-- Characters Policies
CREATE POLICY "Users can create their own characters"
  ON characters FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "MJs can update characters in their groups"
  ON characters FOR UPDATE TO authenticated
  USING (
    (group_id IN (SELECT id FROM groups WHERE mj_id = auth.uid()) OR user_id = auth.uid()) OR
    auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    (group_id IN (SELECT id FROM groups WHERE mj_id = auth.uid()) OR user_id = auth.uid()) OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can view their characters and characters in their groups"
  ON characters FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    ) OR
    group_id IN (SELECT id FROM groups WHERE mj_id = auth.uid()) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Function to clean up inactive groups
CREATE OR REPLACE FUNCTION cleanup_inactive_groups() RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM groups
  WHERE 
    last_activity < now() - INTERVAL '1 month' AND
    NOT EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = groups.id
    );
END;
$$;