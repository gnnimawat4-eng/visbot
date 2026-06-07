'use client'
import { createContext, useContext } from 'react'

export interface CompanyConfig {
  id: string
  company_id: string
  industry_template: string

  // OTP
  otp_required_on_entry: boolean
  otp_required_on_exit: boolean
  otp_required_for_materials: boolean
  otp_required_for_groups: boolean
  otp_skip_for_returning: boolean
  otp_skip_for_recurring_pass: boolean
  otp_skip_for_invitations: boolean
  otp_method: string
  otp_length: number
  otp_validity_seconds: number

  // Modules
  module_visitors: boolean
  module_materials: boolean
  module_gate_passes: boolean
  module_invitations: boolean
  module_groups: boolean
  module_blacklist: boolean
  module_recurring_passes: boolean
  module_vendors: boolean
  module_approvals: boolean
  module_analytics: boolean
  module_reports: boolean
  module_kiosk: boolean
  module_multi_gate: boolean
  module_voice_input: boolean
  module_id_ocr: boolean
  module_face_recognition: boolean
  module_offline_mode: boolean

  // Visitor form fields
  field_visitor_name: string
  field_visitor_phone: string
  field_visitor_email: string
  field_visitor_company: string
  field_visitor_photo: string
  field_visitor_id_proof: string
  field_visitor_address: string
  field_visitor_vehicle: string
  field_visitor_purpose: string
  field_visitor_host: string
  field_visitor_meeting_room: string
  field_visitor_items_carried: string
  field_visitor_temperature: string
  field_visitor_mask: boolean
  field_visitor_signature: string
  field_visitor_emergency_contact: string

  // Material form fields
  field_material_description: string
  field_material_quantity: string
  field_material_category: string
  field_material_value: string
  field_material_vendor: string
  field_material_photo: string
  field_material_returnable: string
  field_material_invoice: string
  field_material_po_number: string
  field_material_gst: string

  // Labels
  label_visitor: string
  label_host: string
  label_purpose: string
  label_material: string
  label_gate_pass: string
  label_company: string
  label_check_in: string
  label_check_out: string

  // Dropdowns
  purposes: string[]
  id_proof_types: string[]

  // Notifications
  notify_host_on_arrival: boolean
  notify_host_on_exit: boolean
  notify_admin_on_blacklist: boolean
  notify_admin_on_vip: boolean
  notify_method: string

  // Branding
  brand_color: string
  logo_url: string | null
  favicon_url: string | null
  primary_font: string

  // Access
  allow_walk_in_visitors: boolean
  require_pre_approval: boolean
  require_host_approval: boolean
  auto_blacklist_after_attempts: number
  max_visitors_per_day: number | null
  operating_hours_start: string
  operating_hours_end: string
  visitor_max_duration_hours: number

  // Security
  require_id_proof_photo: boolean
  require_visitor_signature: boolean
  capture_face_on_exit: boolean
  require_temperature_check: boolean
  require_health_declaration: boolean

  // Retention
  retention_days: number
  auto_delete_photos_after_days: number

  // Limits
  max_guards: number
  max_hosts: number
  max_gates: number
  max_visitors_per_month: number
  max_storage_mb: number
}

export const DEFAULT_CONFIG: CompanyConfig = {
  id: '', company_id: '', industry_template: 'office',
  otp_required_on_entry: true, otp_required_on_exit: false,
  otp_required_for_materials: false, otp_required_for_groups: true,
  otp_skip_for_returning: false, otp_skip_for_recurring_pass: true,
  otp_skip_for_invitations: true, otp_method: 'sms',
  otp_length: 6, otp_validity_seconds: 300,
  module_visitors: true, module_materials: true, module_gate_passes: true,
  module_invitations: true, module_groups: true, module_blacklist: true,
  module_recurring_passes: true, module_vendors: true, module_approvals: true,
  module_analytics: true, module_reports: true,
  module_kiosk: false, module_multi_gate: false, module_voice_input: false,
  module_id_ocr: false, module_face_recognition: false, module_offline_mode: false,
  field_visitor_name: 'required', field_visitor_phone: 'required',
  field_visitor_email: 'hidden', field_visitor_company: 'optional',
  field_visitor_photo: 'required', field_visitor_id_proof: 'optional',
  field_visitor_address: 'hidden', field_visitor_vehicle: 'optional',
  field_visitor_purpose: 'required', field_visitor_host: 'required',
  field_visitor_meeting_room: 'hidden', field_visitor_items_carried: 'hidden',
  field_visitor_temperature: 'hidden', field_visitor_mask: false,
  field_visitor_signature: 'hidden', field_visitor_emergency_contact: 'hidden',
  field_material_description: 'required', field_material_quantity: 'required',
  field_material_category: 'optional', field_material_value: 'optional',
  field_material_vendor: 'required', field_material_photo: 'required',
  field_material_returnable: 'optional', field_material_invoice: 'hidden',
  field_material_po_number: 'hidden', field_material_gst: 'hidden',
  label_visitor: 'Visitor', label_host: 'Host', label_purpose: 'Purpose',
  label_material: 'Material', label_gate_pass: 'Gate Pass',
  label_company: 'Company', label_check_in: 'Check-in', label_check_out: 'Check-out',
  purposes: ['Meeting', 'Interview', 'Delivery', 'Official', 'Other'],
  id_proof_types: ['Aadhaar', 'PAN', 'Driving License', 'Voter ID', 'Passport'],
  notify_host_on_arrival: true, notify_host_on_exit: false,
  notify_admin_on_blacklist: true, notify_admin_on_vip: true,
  notify_method: 'whatsapp',
  brand_color: '#1D9E75', logo_url: null, favicon_url: null, primary_font: 'Geist',
  allow_walk_in_visitors: true, require_pre_approval: false,
  require_host_approval: false, auto_blacklist_after_attempts: 0,
  max_visitors_per_day: null, operating_hours_start: '00:00',
  operating_hours_end: '23:59', visitor_max_duration_hours: 24,
  require_id_proof_photo: false, require_visitor_signature: false,
  capture_face_on_exit: false, require_temperature_check: false,
  require_health_declaration: false,
  retention_days: 365, auto_delete_photos_after_days: 180,
  max_guards: 5, max_hosts: 50, max_gates: 1,
  max_visitors_per_month: 1000, max_storage_mb: 500,
}

export const ConfigContext = createContext<CompanyConfig>(DEFAULT_CONFIG)

export function useConfig(): CompanyConfig {
  return useContext(ConfigContext)
}

export function useLabel(key: string): string {
  const cfg = useContext(ConfigContext)
  return (cfg as unknown as Record<string, unknown>)[`label_${key}`] as string || key
}

export function useField(name: string): 'required' | 'optional' | 'hidden' {
  const cfg = useContext(ConfigContext)
  return ((cfg as unknown as Record<string, unknown>)[`field_${name}`] as string || 'optional') as 'required' | 'optional' | 'hidden'
}

export function useModule(name: string): boolean {
  const cfg = useContext(ConfigContext)
  const val = (cfg as unknown as Record<string, unknown>)[`module_${name}`]
  return val === undefined ? true : Boolean(val)
}
