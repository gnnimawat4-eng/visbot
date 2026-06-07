// Supabase-compatible type definitions

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: { id: string; name: string; slug: string; logo_url: string | null; plan: string; active: boolean; created_at: string }
        Insert: { id?: string; name: string; slug: string; logo_url?: string | null; plan?: string; active?: boolean; created_at?: string }
        Update: { id?: string; name?: string; slug?: string; logo_url?: string | null; plan?: string; active?: boolean; created_at?: string }
        Relationships: []
      }
      profiles: {
        Row: { id: string; company_id: string | null; full_name: string | null; phone: string | null; email: string | null; role: 'saas_owner' | 'admin' | 'guard'; active: boolean; created_at: string }
        Insert: { id: string; company_id?: string | null; full_name?: string | null; phone?: string | null; email?: string | null; role: 'saas_owner' | 'admin' | 'guard'; active?: boolean; created_at?: string }
        Update: { id?: string; company_id?: string | null; full_name?: string | null; phone?: string | null; email?: string | null; role?: 'saas_owner' | 'admin' | 'guard'; active?: boolean; created_at?: string }
        Relationships: [
          { foreignKeyName: 'profiles_company_id_fkey'; columns: ['company_id']; referencedRelation: 'companies'; referencedColumns: ['id'] }
        ]
      }
      visitors: {
        Row: { id: string; name: string; phone: string; email: string | null; last_company_id: string | null; created_at: string }
        Insert: { id?: string; name: string; phone: string; email?: string | null; last_company_id?: string | null; created_at?: string }
        Update: { id?: string; name?: string; phone?: string; email?: string | null; last_company_id?: string | null; created_at?: string }
        Relationships: [{ foreignKeyName: 'visitors_last_company_id_fkey'; columns: ['last_company_id']; referencedRelation: 'companies'; referencedColumns: ['id'] }]
      }
      checkins: {
        Row: { id: string; visitor_id: string; company_id: string; purpose: string; host_name: string; host_phone: string | null; photo_url: string | null; status: string; checked_out_at: string | null; created_at: string }
        Insert: { id?: string; visitor_id: string; company_id: string; purpose: string; host_name: string; host_phone?: string | null; photo_url?: string | null; status?: string; checked_out_at?: string | null; created_at?: string }
        Update: { id?: string; visitor_id?: string; company_id?: string; purpose?: string; host_name?: string; host_phone?: string | null; photo_url?: string | null; status?: string; checked_out_at?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: 'checkins_visitor_id_fkey'; columns: ['visitor_id']; referencedRelation: 'visitors'; referencedColumns: ['id'] },
          { foreignKeyName: 'checkins_company_id_fkey'; columns: ['company_id']; referencedRelation: 'companies'; referencedColumns: ['id'] }
        ]
      }
      gate_passes: {
        Row: {
          id: string; company_id: string | null; pass_number: string
          pass_type: 'inward' | 'outward'
          vehicle_number: string; vehicle_type: 'truck' | 'tempo' | 'car' | 'bike' | 'other' | null
          driver_name: string | null; driver_phone: string | null; driver_license: string | null
          party_name: string; party_phone: string | null; party_address: string | null
          items: Array<{ name: string; quantity: number; unit: string; weight?: number }>
          total_weight: number | null; weight_unit: string
          purpose: string | null; po_number: string | null; invoice_number: string | null
          guard_id: string | null
          checked_in_at: string; checked_out_at: string | null
          status: 'inside' | 'exited' | 'cancelled'
          vehicle_photo_url: string | null; document_photo_url: string | null
          remarks: string | null; created_at: string
        }
        Insert: {
          id?: string; company_id?: string | null; pass_number?: string
          pass_type: 'inward' | 'outward'
          vehicle_number: string; vehicle_type?: string | null
          driver_name?: string | null; driver_phone?: string | null; driver_license?: string | null
          party_name: string; party_phone?: string | null; party_address?: string | null
          items?: Array<{ name: string; quantity: number; unit: string; weight?: number }>
          total_weight?: number | null; weight_unit?: string
          purpose?: string | null; po_number?: string | null; invoice_number?: string | null
          guard_id?: string | null
          checked_in_at?: string; checked_out_at?: string | null
          status?: string
          vehicle_photo_url?: string | null; document_photo_url?: string | null
          remarks?: string | null; created_at?: string
        }
        Update: Partial<Database['public']['Tables']['gate_passes']['Insert']>
        Relationships: []
      }
      materials: {
        Row: { id: string; checkin_id: string | null; company_id: string; item_name: string; quantity: number; direction: string; return_expected: boolean; returned_at: string | null; photo_url: string | null; created_at: string }
        Insert: { id?: string; checkin_id?: string | null; company_id: string; item_name: string; quantity?: number; direction: string; return_expected?: boolean; returned_at?: string | null; photo_url?: string | null; created_at?: string }
        Update: { id?: string; checkin_id?: string | null; company_id?: string; item_name?: string; quantity?: number; direction?: string; return_expected?: boolean; returned_at?: string | null; photo_url?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: 'materials_checkin_id_fkey'; columns: ['checkin_id']; referencedRelation: 'checkins'; referencedColumns: ['id'] },
          { foreignKeyName: 'materials_company_id_fkey'; columns: ['company_id']; referencedRelation: 'companies'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Company  = Database['public']['Tables']['companies']['Row']
export type Profile  = Database['public']['Tables']['profiles']['Row']
export type Visitor  = Database['public']['Tables']['visitors']['Row']
export type CheckIn  = Database['public']['Tables']['checkins']['Row']
export type Material = Database['public']['Tables']['materials']['Row']
