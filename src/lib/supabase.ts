import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        role: 'joueur' // Default role
      }
    }
  });
  
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Group Management
export async function createGroup(name: string) {
  const { data, error } = await supabase
    .from('groups')
    .insert([{ name, mj_id: (await supabase.auth.getUser()).data.user?.id }])
    .select()
    .single();
  
  return { data, error };
}

export async function getGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members (
        user_id
      )
    `);
  
  return { data, error };
}

export async function addMemberToGroup(groupId: string, email: string) {
  // First get the user ID from the email
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (userError || !userData) {
    return { error: userError || new Error('User not found') };
  }

  const { data, error } = await supabase
    .from('group_members')
    .insert([{ group_id: groupId, user_id: userData.id }])
    .select();

  return { data, error };
}

// Character Management
export async function createCharacter(characterData: any, groupId?: string) {
  const { data: existingCharacters, error: countError } = await supabase
    .from('characters')
    .select('id')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .eq('is_template', true);

  if (countError) {
    return { error: countError };
  }

  if (existingCharacters.length >= 10) {
    return { error: new Error('Character limit reached (10)') };
  }

  const { data, error } = await supabase
    .from('characters')
    .insert([{
      data: characterData,
      group_id: groupId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      is_template: !groupId
    }])
    .select();

  return { data, error };
}

export async function importCharacter(characterId: string, groupId: string) {
  // First get the original character
  const { data: originalChar, error: fetchError } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single();

  if (fetchError || !originalChar) {
    return { error: fetchError || new Error('Character not found') };
  }

  // Create the copy
  const { data, error } = await supabase
    .from('characters')
    .insert([{
      data: originalChar.data,
      group_id: groupId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      is_template: false,
      template_id: characterId
    }])
    .select();

  return { data, error };
}

export async function getCharacters(groupId?: string) {
  let query = supabase
    .from('characters')
    .select('*');
  
  if (groupId) {
    query = query.eq('group_id', groupId);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function updateCharacter(characterId: string, characterData: any) {
  const { data, error } = await supabase
    .from('characters')
    .update({ data: characterData, updated_at: new Date().toISOString() })
    .eq('id', characterId)
    .select();

  return { data, error };
}