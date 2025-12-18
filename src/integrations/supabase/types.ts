export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      dataset_files: {
        Row: {
          created_at: string
          dataset_id: string
          error_message: string | null
          file_path: string
          file_size: number | null
          filename: string
          id: string
          mime_type: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["processing_status"]
        }
        Insert: {
          created_at?: string
          dataset_id: string
          error_message?: string | null
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          mime_type?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["processing_status"]
        }
        Update: {
          created_at?: string
          dataset_id?: string
          error_message?: string | null
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          mime_type?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["processing_status"]
        }
        Relationships: [
          {
            foreignKeyName: "dataset_files_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          created_at: string
          current_step: Database["public"]["Enums"]["processing_step"] | null
          description: string | null
          id: string
          name: string
          source_type: Database["public"]["Enums"]["dataset_source"]
          status: Database["public"]["Enums"]["processing_status"]
          total_rows: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_step?: Database["public"]["Enums"]["processing_step"] | null
          description?: string | null
          id?: string
          name: string
          source_type: Database["public"]["Enums"]["dataset_source"]
          status?: Database["public"]["Enums"]["processing_status"]
          total_rows?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_step?: Database["public"]["Enums"]["processing_step"] | null
          description?: string | null
          id?: string
          name?: string
          source_type?: Database["public"]["Enums"]["dataset_source"]
          status?: Database["public"]["Enums"]["processing_status"]
          total_rows?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "datasets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_data: {
        Row: {
          column_count: number | null
          columns: Json | null
          created_at: string
          dataset_id: string
          file_path: string | null
          id: string
          job_id: string | null
          row_count: number
          sample_data: Json | null
          statistics: Json | null
          step: Database["public"]["Enums"]["processing_step"]
        }
        Insert: {
          column_count?: number | null
          columns?: Json | null
          created_at?: string
          dataset_id: string
          file_path?: string | null
          id?: string
          job_id?: string | null
          row_count?: number
          sample_data?: Json | null
          statistics?: Json | null
          step: Database["public"]["Enums"]["processing_step"]
        }
        Update: {
          column_count?: number | null
          columns?: Json | null
          created_at?: string
          dataset_id?: string
          file_path?: string | null
          id?: string
          job_id?: string | null
          row_count?: number
          sample_data?: Json | null
          statistics?: Json | null
          step?: Database["public"]["Enums"]["processing_step"]
        }
        Relationships: [
          {
            foreignKeyName: "processed_data_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processed_data_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "processing_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_jobs: {
        Row: {
          completed_at: string | null
          config: Json | null
          created_at: string
          dataset_id: string
          error_message: string | null
          id: string
          input_row_count: number | null
          output_row_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["processing_status"]
          step: Database["public"]["Enums"]["processing_step"]
        }
        Insert: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          dataset_id: string
          error_message?: string | null
          id?: string
          input_row_count?: number | null
          output_row_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["processing_status"]
          step: Database["public"]["Enums"]["processing_step"]
        }
        Update: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          dataset_id?: string
          error_message?: string | null
          id?: string
          input_row_count?: number | null
          output_row_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["processing_status"]
          step?: Database["public"]["Enums"]["processing_step"]
        }
        Relationships: [
          {
            foreignKeyName: "processing_jobs_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          email_marketing: boolean | null
          email_notifications: boolean | null
          email_updates: boolean | null
          full_name: string | null
          id: string
          sound_effects_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_marketing?: boolean | null
          email_notifications?: boolean | null
          email_updates?: boolean | null
          full_name?: string | null
          id: string
          sound_effects_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          email_marketing?: boolean | null
          email_notifications?: boolean | null
          email_updates?: boolean | null
          full_name?: string | null
          id?: string
          sound_effects_enabled?: boolean | null
          updated_at?: string
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
      dataset_source: "url" | "upload"
      processing_status: "pending" | "processing" | "completed" | "failed"
      processing_step:
        | "data_collection"
        | "standard_cleaning"
        | "filtering"
        | "selective_cleaning"
        | "grouping_sorting"
        | "export"
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      dataset_source: ["url", "upload"],
      processing_status: ["pending", "processing", "completed", "failed"],
      processing_step: [
        "data_collection",
        "standard_cleaning",
        "filtering",
        "selective_cleaning",
        "grouping_sorting",
        "export",
      ],
    },
  },
} as const
