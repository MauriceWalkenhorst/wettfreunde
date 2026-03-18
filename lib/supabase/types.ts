export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          points: number
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          avatar_url?: string | null
          points?: number
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar_url?: string | null
          points?: number
          created_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          id: string
          user_a: string
          user_b: string
          status: 'pending' | 'accepted'
          created_at: string
        }
        Insert: {
          id?: string
          user_a: string
          user_b: string
          status?: 'pending' | 'accepted'
          created_at?: string
        }
        Update: {
          id?: string
          user_a?: string
          user_b?: string
          status?: 'pending' | 'accepted'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'friendships_user_a_fkey'
            columns: ['user_a']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'friendships_user_b_fkey'
            columns: ['user_b']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      invite_links: {
        Row: {
          id: string
          created_by: string
          token: string
          used_by: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          created_by: string
          token?: string
          used_by?: string | null
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          token?: string
          used_by?: string | null
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
      bets: {
        Row: {
          id: string
          question: string
          stake: string
          subject_id: string
          subject_answer: boolean | null
          proof_photo_path: string | null
          status: 'pending' | 'answered' | 'expired'
          created_by: string
          expires_at: string | null
          created_at: string
          answered_at: string | null
        }
        Insert: {
          id?: string
          question: string
          stake: string
          subject_id: string
          subject_answer?: boolean | null
          proof_photo_path?: string | null
          status?: 'pending' | 'answered' | 'expired'
          created_by: string
          expires_at?: string | null
          created_at?: string
          answered_at?: string | null
        }
        Update: {
          id?: string
          question?: string
          stake?: string
          subject_id?: string
          subject_answer?: boolean | null
          proof_photo_path?: string | null
          status?: 'pending' | 'answered' | 'expired'
          created_by?: string
          expires_at?: string | null
          created_at?: string
          answered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'bets_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bets_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      bet_photos: {
        Row: {
          id: string
          bet_id: string
          uploaded_by: string
          photo_path: string
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          bet_id: string
          uploaded_by: string
          photo_path: string
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          bet_id?: string
          uploaded_by?: string
          photo_path?: string
          caption?: string | null
          created_at?: string
        }
        Relationships: []
      }
      bet_participants: {
        Row: {
          id: string
          bet_id: string
          user_id: string
          side: boolean | null
          won: boolean | null
          points_awarded: number
        }
        Insert: {
          id?: string
          bet_id: string
          user_id: string
          side?: boolean | null
          won?: boolean | null
          points_awarded?: number
        }
        Update: {
          id?: string
          bet_id?: string
          user_id?: string
          side?: boolean | null
          won?: boolean | null
          points_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: 'bet_participants_bet_id_fkey'
            columns: ['bet_id']
            isOneToOne: false
            referencedRelation: 'bets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bet_participants_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'bet_request' | 'bet_result' | 'friend_request' | 'friend_accepted'
          title: string
          body: string | null
          ref_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'bet_request' | 'bet_result' | 'friend_request' | 'friend_accepted'
          title: string
          body?: string | null
          ref_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'bet_request' | 'bet_result' | 'friend_request' | 'friend_accepted'
          title?: string
          body?: string | null
          ref_id?: string | null
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Friendship = Database['public']['Tables']['friendships']['Row']
export type InviteLink = Database['public']['Tables']['invite_links']['Row']
export type Bet = Database['public']['Tables']['bets']['Row']
export type BetParticipant = Database['public']['Tables']['bet_participants']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

export type BetWithDetails = Bet & {
  subject: Profile
  creator: Profile
  participants: (BetParticipant & { user: Profile })[]
}
