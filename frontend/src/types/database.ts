export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blacklist: {
        Row: {
          added_at: string | null
          added_by: string | null
          company_id: string | null
          evidence_photos: string[] | null
          id: string
          id_proof_number: string | null
          id_proof_type: string | null
          incident_date: string | null
          lifted_at: string | null
          lifted_by: string | null
          lifted_reason: string | null
          name: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          reason: string
          severity: string | null
          status: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          company_id?: string | null
          evidence_photos?: string[] | null
          id?: string
          id_proof_number?: string | null
          id_proof_type?: string | null
          incident_date?: string | null
          lifted_at?: string | null
          lifted_by?: string | null
          lifted_reason?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          reason: string
          severity?: string | null
          status?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          company_id?: string | null
          evidence_photos?: string[] | null
          id?: string
          id_proof_number?: string | null
          id_proof_type?: string | null
          incident_date?: string | null
          lifted_at?: string | null
          lifted_by?: string | null
          lifted_reason?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          reason?: string
          severity?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blacklist_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blacklist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blacklist_lifted_by_fkey"
            columns: ["lifted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blacklist_attempts: {
        Row: {
          attempt_photo_url: string | null
          attempt_time: string | null
          attempted_name: string | null
          attempted_phone: string | null
          blacklist_id: string | null
          company_id: string | null
          guard_id: string | null
          id: string
          notes: string | null
        }
        Insert: {
          attempt_photo_url?: string | null
          attempt_time?: string | null
          attempted_name?: string | null
          attempted_phone?: string | null
          blacklist_id?: string | null
          company_id?: string | null
          guard_id?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          attempt_photo_url?: string | null
          attempt_time?: string | null
          attempted_name?: string | null
          attempted_phone?: string | null
          blacklist_id?: string | null
          company_id?: string | null
          guard_id?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blacklist_attempts_blacklist_id_fkey"
            columns: ["blacklist_id"]
            isOneToOne: false
            referencedRelation: "blacklist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blacklist_attempts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blacklist_attempts_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          checked_out_at: string | null
          company_id: string
          created_at: string | null
          host_name: string
          host_phone: string | null
          id: string
          invitation_id: string | null
          photo_url: string | null
          purpose: string
          status: string | null
          visitor_id: string
        }
        Insert: {
          checked_out_at?: string | null
          company_id: string
          created_at?: string | null
          host_name: string
          host_phone?: string | null
          id?: string
          invitation_id?: string | null
          photo_url?: string | null
          purpose: string
          status?: string | null
          visitor_id: string
        }
        Update: {
          checked_out_at?: string | null
          company_id?: string
          created_at?: string | null
          host_name?: string
          host_phone?: string | null
          id?: string
          invitation_id?: string | null
          photo_url?: string | null
          purpose?: string
          status?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          plan: string | null
          slug: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: string | null
          slug: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string | null
          slug?: string
        }
        Relationships: []
      }
      gate_passes: {
        Row: {
          checked_in_at: string | null
          checked_out_at: string | null
          company_id: string | null
          created_at: string | null
          document_photo_url: string | null
          driver_license: string | null
          driver_name: string | null
          driver_phone: string | null
          guard_id: string | null
          id: string
          invoice_number: string | null
          items: Json
          party_address: string | null
          party_name: string
          party_phone: string | null
          pass_number: string
          pass_type: string | null
          po_number: string | null
          purpose: string | null
          remarks: string | null
          status: string | null
          total_weight: number | null
          vehicle_number: string
          vehicle_photo_url: string | null
          vehicle_type: string | null
          weight_unit: string | null
        }
        Insert: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          company_id?: string | null
          created_at?: string | null
          document_photo_url?: string | null
          driver_license?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          guard_id?: string | null
          id?: string
          invoice_number?: string | null
          items?: Json
          party_address?: string | null
          party_name: string
          party_phone?: string | null
          pass_number?: string
          pass_type?: string | null
          po_number?: string | null
          purpose?: string | null
          remarks?: string | null
          status?: string | null
          total_weight?: number | null
          vehicle_number: string
          vehicle_photo_url?: string | null
          vehicle_type?: string | null
          weight_unit?: string | null
        }
        Update: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          company_id?: string | null
          created_at?: string | null
          document_photo_url?: string | null
          driver_license?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          guard_id?: string | null
          id?: string
          invoice_number?: string | null
          items?: Json
          party_address?: string | null
          party_name?: string
          party_phone?: string | null
          pass_number?: string
          pass_type?: string | null
          po_number?: string | null
          purpose?: string | null
          remarks?: string | null
          status?: string | null
          total_weight?: number | null
          vehicle_number?: string
          vehicle_photo_url?: string | null
          vehicle_type?: string | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gate_passes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gate_passes_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hosts: {
        Row: {
          active: boolean | null
          company_id: string
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          active?: boolean | null
          company_id: string
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
        }
        Update: {
          active?: boolean | null
          company_id?: string
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hosts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          cancelled_at: string | null
          cancelled_reason: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          expected_duration_minutes: number | null
          host_id: string
          id: string
          invite_code: string | null
          notes: string | null
          purpose: string
          qr_token: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          used_at: string | null
          visitor_company: string | null
          visitor_email: string | null
          visitor_name: string
          visitor_phone: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          expected_duration_minutes?: number | null
          host_id: string
          id?: string
          invite_code?: string | null
          notes?: string | null
          purpose: string
          qr_token?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          used_at?: string | null
          visitor_company?: string | null
          visitor_email?: string | null
          visitor_name: string
          visitor_phone: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          expected_duration_minutes?: number | null
          host_id?: string
          id?: string
          invite_code?: string | null
          notes?: string | null
          purpose?: string
          qr_token?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          used_at?: string | null
          visitor_company?: string | null
          visitor_email?: string | null
          visitor_name?: string
          visitor_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          actual_return_date: string | null
          category: string | null
          checkin_id: string | null
          company_id: string
          created_at: string | null
          damage_notes: string | null
          direction: string
          entry_photo_url: string | null
          exit_photo_url: string | null
          expected_return_date: string | null
          id: string
          is_returnable: boolean | null
          item_name: string
          photo_url: string | null
          quantity: number
          return_expected: boolean | null
          return_status: string | null
          returned_at: string | null
          value_inr: number | null
          vendor_name: string | null
        }
        Insert: {
          actual_return_date?: string | null
          category?: string | null
          checkin_id?: string | null
          company_id: string
          created_at?: string | null
          damage_notes?: string | null
          direction: string
          entry_photo_url?: string | null
          exit_photo_url?: string | null
          expected_return_date?: string | null
          id?: string
          is_returnable?: boolean | null
          item_name: string
          photo_url?: string | null
          quantity?: number
          return_expected?: boolean | null
          return_status?: string | null
          returned_at?: string | null
          value_inr?: number | null
          vendor_name?: string | null
        }
        Update: {
          actual_return_date?: string | null
          category?: string | null
          checkin_id?: string | null
          company_id?: string
          created_at?: string | null
          damage_notes?: string | null
          direction?: string
          entry_photo_url?: string | null
          exit_photo_url?: string | null
          expected_return_date?: string | null
          id?: string
          is_returnable?: boolean | null
          item_name?: string
          photo_url?: string | null
          quantity?: number
          return_expected?: boolean | null
          return_status?: string | null
          returned_at?: string | null
          value_inr?: number | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean | null
          company_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          active?: boolean | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role: string
        }
        Update: {
          active?: boolean | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          checkin_id: string | null
          company_id: string | null
          created_at: string | null
          id: string
          message: string | null
          recipient_name: string | null
          recipient_phone: string | null
          status: string | null
          type: string
        }
        Insert: {
          checkin_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: string | null
          type: string
        }
        Update: {
          checkin_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          last_company_id: string | null
          name: string
          phone: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          last_company_id?: string | null
          name: string
          phone: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          last_company_id?: string | null
          name?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitors_last_company_id_fkey"
            columns: ["last_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_otps: { Args: never; Returns: undefined }
      my_company: { Args: never; Returns: string }
      my_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
