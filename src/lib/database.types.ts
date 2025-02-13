export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          mj_id: string
          created_at: string
          last_activity: string
        }
        Insert: {
          id?: string
          name: string
          mj_id: string
          created_at?: string
          last_activity?: string
        }
        Update: {
          id?: string
          name?: string
          mj_id?: string
          created_at?: string
          last_activity?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      characters: {
        Row: {
          id: string
          user_id: string
          group_id: string | null
          data: Json
          created_at: string
          updated_at: string
          is_template: boolean
          template_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          group_id?: string | null
          data: Json
          created_at?: string
          updated_at?: string
          is_template?: boolean
          template_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          group_id?: string | null
          data?: Json
          created_at?: string
          updated_at?: string
          is_template?: boolean
          template_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_inactive_groups: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}