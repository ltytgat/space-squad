/*
  # Initial schema for Space Squad

  1. New Tables
    - groups: For managing game groups
    - group_members: For tracking group membership
    - characters: For storing character data
  
  2. Security
    - Enable RLS on all tables
    - Add policies for MJs, players, and admins
    - Add cleanup function for inactive groups
*/

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mj_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now()
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
  template_id uuid REFERENCES characters(id)
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

-- Function to enforce group limits
CREATE OR REPLACE FUNCTION check_group_limit() 
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM groups WHERE mj_id = NEW.mj_id) >= 10 THEN
    RAISE EXCEPTION 'MJ cannot have more than 10 groups';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_group_limit
  BEFORE INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION check_group_limit();

-- Function to enforce character limits
CREATE OR REPLACE FUNCTION check_character_limit() 
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM characters WHERE user_id = NEW.user_id AND is_template = true) >= 10 THEN
    RAISE EXCEPTION 'User cannot have more than 10 template characters';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_character_limit
  BEFORE INSERT ON characters
  FOR EACH ROW
  WHEN (NEW.is_template = true)
  EXECUTE FUNCTION check_character_limit();

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