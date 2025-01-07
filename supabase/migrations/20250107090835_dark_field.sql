/*
  # Content Management System Tables

  1. New Tables
    - `content_categories` - Stores encyclopedia categories
    - `content_pages` - Stores all encyclopedia pages
    - `timeline_events` - Stores timeline events for different races

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for admin write access
*/

-- Create enum for content types
CREATE TYPE content_type AS ENUM ('timeline', 'race', 'faction', 'ship', 'equipment');

-- Categories table
CREATE TABLE IF NOT EXISTS content_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  type content_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pages table
CREATE TABLE IF NOT EXISTS content_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES content_categories(id),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Timeline events table
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race text NOT NULL,
  year text NOT NULL,
  event text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Allow public read access" ON content_categories
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read access" ON content_pages
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read access" ON timeline_events
  FOR SELECT TO public USING (true);

-- Admin write policies
CREATE POLICY "Allow admin write access" ON content_categories
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin write access" ON content_pages
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin write access" ON timeline_events
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');