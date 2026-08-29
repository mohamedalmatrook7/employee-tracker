// Hand-maintained types matching supabase/migrations/0001_init.sql.
// After you link a real project you can regenerate with:
//   supabase gen types typescript --linked > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ApplicationStatus = "pending" | "done";
export type VisitStatus = "pending" | "done";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          supervisor_id: string;
          name: string;
          position: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          supervisor_id: string;
          name: string;
          position?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          supervisor_id?: string;
          name?: string;
          position?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      managements: {
        Row: {
          id: string;
          supervisor_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          supervisor_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          supervisor_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          supervisor_id: string;
          employee_id: string;
          management_id: string | null;
          management_name: string | null;
          student_name: string | null;
          student_cpr: string | null;
          school_name: string | null;
          content: string;
          application_date: string;
          feedback_text: string | null;
          feedback_date: string | null;
          created_at: string;
          updated_at: string;
          status: ApplicationStatus;
        };
        Insert: {
          id?: string;
          supervisor_id: string;
          employee_id: string;
          management_id?: string | null;
          management_name?: string | null;
          student_name?: string | null;
          student_cpr?: string | null;
          school_name?: string | null;
          content: string;
          application_date: string;
          feedback_text?: string | null;
          feedback_date?: string | null;
          created_at?: string;
          updated_at?: string;
          // `status` is a generated column — never inserted/updated directly.
        };
        Update: {
          id?: string;
          supervisor_id?: string;
          employee_id?: string;
          management_id?: string | null;
          management_name?: string | null;
          student_name?: string | null;
          student_cpr?: string | null;
          school_name?: string | null;
          content?: string;
          application_date?: string;
          feedback_text?: string | null;
          feedback_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          supervisor_id: string;
          name: string;
          month: string | null;
          period: string | null;
          target_group: string | null;
          notes: string | null;
          employee_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supervisor_id: string;
          name: string;
          month?: string | null;
          period?: string | null;
          target_group?: string | null;
          notes?: string | null;
          employee_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supervisor_id?: string;
          name?: string;
          month?: string | null;
          period?: string | null;
          target_group?: string | null;
          notes?: string | null;
          employee_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      visit_schedules: {
        Row: {
          id: string;
          supervisor_id: string;
          employee_id: string;
          school_name: string;
          visit_date: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supervisor_id: string;
          employee_id: string;
          school_name: string;
          visit_date?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supervisor_id?: string;
          employee_id?: string;
          school_name?: string;
          visit_date?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notices: {
        Row: {
          id: string;
          supervisor_id: string;
          notice_number: string;
          student_name: string;
          cpr: string | null;
          school_name: string | null;
          employee_id: string | null;
          problem_type: string | null;
          notice_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supervisor_id: string;
          notice_number: string;
          student_name: string;
          cpr?: string | null;
          school_name?: string | null;
          employee_id?: string | null;
          problem_type?: string | null;
          notice_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supervisor_id?: string;
          notice_number?: string;
          student_name?: string;
          cpr?: string | null;
          school_name?: string | null;
          employee_id?: string | null;
          problem_type?: string | null;
          notice_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_visits: {
        Row: {
          id: string;
          supervisor_id: string;
          event_id: string;
          employee_id: string;
          school_name: string;
          visit_date: string | null;
          attendance_count: number | null;
          status: VisitStatus;
          sort_order: number;
          source_schedule_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supervisor_id: string;
          event_id: string;
          employee_id: string;
          school_name: string;
          visit_date?: string | null;
          attendance_count?: number | null;
          status?: VisitStatus;
          sort_order?: number;
          source_schedule_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supervisor_id?: string;
          event_id?: string;
          employee_id?: string;
          school_name?: string;
          visit_date?: string | null;
          attendance_count?: number | null;
          status?: VisitStatus;
          sort_order?: number;
          source_schedule_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row aliases used across the app.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Employee = Database["public"]["Tables"]["employees"]["Row"];
export type Management = Database["public"]["Tables"]["managements"]["Row"];
export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type VisitSchedule = Database["public"]["Tables"]["visit_schedules"]["Row"];
export type EventVisit = Database["public"]["Tables"]["event_visits"]["Row"];
export type Notice = Database["public"]["Tables"]["notices"]["Row"];
