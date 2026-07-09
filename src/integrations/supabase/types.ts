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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      analyses: {
        Row: {
          cover_letter: string
          created_at: string
          id: string
          job_description: string
          match_score: number
          missing_keywords: Json
          optimized_resume: string
          resume_filename: string | null
          resume_storage_path: string | null
          resume_text: string
          strengths: Json
          summary: string
          updated_at: string
          user_id: string
          weaknesses: Json
        }
        Insert: {
          cover_letter: string
          created_at?: string
          id?: string
          job_description: string
          match_score: number
          missing_keywords?: Json
          optimized_resume: string
          resume_filename?: string | null
          resume_storage_path?: string | null
          resume_text: string
          strengths?: Json
          summary: string
          updated_at?: string
          user_id: string
          weaknesses?: Json
        }
        Update: {
          cover_letter?: string
          created_at?: string
          id?: string
          job_description?: string
          match_score?: number
          missing_keywords?: Json
          optimized_resume?: string
          resume_filename?: string | null
          resume_storage_path?: string | null
          resume_text?: string
          strengths?: Json
          summary?: string
          updated_at?: string
          user_id?: string
          weaknesses?: Json
        }
        Relationships: []
      }
      analysis_jobs: {
        Row: {
          analysis_id: string | null
          attempts: number
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          job_description: string
          resume_filename: string | null
          resume_storage_path: string | null
          resume_text: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          job_description: string
          resume_filename?: string | null
          resume_storage_path?: string | null
          resume_text: string
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          job_description?: string
          resume_filename?: string | null
          resume_storage_path?: string | null
          resume_text?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_jobs_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_events: {
        Row: {
          created_at: string
          email_hash: string | null
          event: string
          id: string
          metadata: Json
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email_hash?: string | null
          event: string
          id?: string
          metadata?: Json
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email_hash?: string | null
          event?: string
          id?: string
          metadata?: Json
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      candidate_scores: {
        Row: {
          application_id: string
          ats_score: number
          created_at: string
          education_match_pct: number
          experience_match_pct: number
          gaps: Json
          id: string
          keyword_match_pct: number
          missing_keywords: string[]
          model: string | null
          scored_at: string
          skills_match_pct: number
          strengths: Json
          summary: string | null
        }
        Insert: {
          application_id: string
          ats_score?: number
          created_at?: string
          education_match_pct?: number
          experience_match_pct?: number
          gaps?: Json
          id?: string
          keyword_match_pct?: number
          missing_keywords?: string[]
          model?: string | null
          scored_at?: string
          skills_match_pct?: number
          strengths?: Json
          summary?: string | null
        }
        Update: {
          application_id?: string
          ats_score?: number
          created_at?: string
          education_match_pct?: number
          experience_match_pct?: number
          gaps?: Json
          id?: string
          keyword_match_pct?: number
          missing_keywords?: string[]
          model?: string | null
          scored_at?: string
          skills_match_pct?: number
          strengths?: Json
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_scores_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "employer_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          contact_email: string | null
          created_at: string
          created_by: string | null
          description: string | null
          hq_location: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          plan: Database["public"]["Enums"]["employer_plan"]
          size: string | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hq_location?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          plan?: Database["public"]["Enums"]["employer_plan"]
          size?: string | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hq_location?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          plan?: Database["public"]["Enums"]["employer_plan"]
          size?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_invites: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["company_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["company_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["company_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["company_role"]
          status: Database["public"]["Enums"]["company_member_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["company_role"]
          status?: Database["public"]["Enums"]["company_member_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["company_role"]
          status?: Database["public"]["Enums"]["company_member_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      employer_applications: {
        Row: {
          applied_at: string
          candidate_email: string | null
          candidate_name: string | null
          candidate_user_id: string
          cover_letter: string | null
          created_at: string
          hired_at: string | null
          id: string
          job_id: string
          last_stage_change_at: string
          rejected_reason: string | null
          resume_file_path: string | null
          resume_text: string | null
          source: string | null
          stage: Database["public"]["Enums"]["application_stage"]
          updated_at: string
        }
        Insert: {
          applied_at?: string
          candidate_email?: string | null
          candidate_name?: string | null
          candidate_user_id: string
          cover_letter?: string | null
          created_at?: string
          hired_at?: string | null
          id?: string
          job_id: string
          last_stage_change_at?: string
          rejected_reason?: string | null
          resume_file_path?: string | null
          resume_text?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["application_stage"]
          updated_at?: string
        }
        Update: {
          applied_at?: string
          candidate_email?: string | null
          candidate_name?: string | null
          candidate_user_id?: string
          cover_letter?: string | null
          created_at?: string
          hired_at?: string | null
          id?: string
          job_id?: string
          last_stage_change_at?: string
          rejected_reason?: string | null
          resume_file_path?: string | null
          resume_text?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["application_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "employer_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_jobs: {
        Row: {
          application_count: number
          apply_mode: Database["public"]["Enums"]["apply_mode"]
          company_id: string
          created_at: string
          currency: string
          deadline: string | null
          department: string | null
          description: string
          education: string | null
          employment_type: Database["public"]["Enums"]["employer_job_type"]
          experience_level: string | null
          external_url: string | null
          id: string
          location: string | null
          posted_by: string | null
          preferred_skills: string[]
          published_at: string | null
          required_skills: string[]
          responsibilities: string | null
          salary_max: number | null
          salary_min: number | null
          status: Database["public"]["Enums"]["employer_job_status"]
          title: string
          updated_at: string
          vacancies: number
          view_count: number
          work_mode: Database["public"]["Enums"]["work_mode"]
        }
        Insert: {
          application_count?: number
          apply_mode?: Database["public"]["Enums"]["apply_mode"]
          company_id: string
          created_at?: string
          currency?: string
          deadline?: string | null
          department?: string | null
          description: string
          education?: string | null
          employment_type?: Database["public"]["Enums"]["employer_job_type"]
          experience_level?: string | null
          external_url?: string | null
          id?: string
          location?: string | null
          posted_by?: string | null
          preferred_skills?: string[]
          published_at?: string | null
          required_skills?: string[]
          responsibilities?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["employer_job_status"]
          title: string
          updated_at?: string
          vacancies?: number
          view_count?: number
          work_mode?: Database["public"]["Enums"]["work_mode"]
        }
        Update: {
          application_count?: number
          apply_mode?: Database["public"]["Enums"]["apply_mode"]
          company_id?: string
          created_at?: string
          currency?: string
          deadline?: string | null
          department?: string | null
          description?: string
          education?: string | null
          employment_type?: Database["public"]["Enums"]["employer_job_type"]
          experience_level?: string | null
          external_url?: string | null
          id?: string
          location?: string | null
          posted_by?: string | null
          preferred_skills?: string[]
          published_at?: string | null
          required_skills?: string[]
          responsibilities?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["employer_job_status"]
          title?: string
          updated_at?: string
          vacancies?: number
          view_count?: number
          work_mode?: Database["public"]["Enums"]["work_mode"]
        }
        Relationships: [
          {
            foreignKeyName: "employer_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          interview_id: string
          rating: number | null
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          interview_id: string
          rating?: number | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          interview_id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_notes_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          created_by: string
          duration_minutes: number
          id: string
          location_or_link: string | null
          mode: Database["public"]["Enums"]["interview_mode"]
          scheduled_for: string
          status: Database["public"]["Enums"]["interview_status"]
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by: string
          duration_minutes?: number
          id?: string
          location_or_link?: string | null
          mode?: Database["public"]["Enums"]["interview_mode"]
          scheduled_for: string
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string
          duration_minutes?: number
          id?: string
          location_or_link?: string | null
          mode?: Database["public"]["Enums"]["interview_mode"]
          scheduled_for?: string
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "employer_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applied_at: string | null
          company: string | null
          created_at: string
          external_id: string | null
          id: string
          last_status_at: string
          notes: string | null
          provider: string
          saved_job_id: string | null
          sort_order: number
          status: Database["public"]["Enums"]["application_status"]
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          last_status_at?: string
          notes?: string | null
          provider?: string
          saved_job_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["application_status"]
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          company?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          last_status_at?: string
          notes?: string | null
          provider?: string
          saved_job_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["application_status"]
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_saved_job_id_fkey"
            columns: ["saved_job_id"]
            isOneToOne: false
            referencedRelation: "saved_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_matches: {
        Row: {
          analysis_id: string | null
          company: string | null
          created_at: string
          external_id: string
          id: string
          match_score: number
          provider: string
          title: string
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          company?: string | null
          created_at?: string
          external_id: string
          id?: string
          match_score: number
          provider?: string
          title: string
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          company?: string | null
          created_at?: string
          external_id?: string
          id?: string
          match_score?: number
          provider?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_activation_events: {
        Row: {
          created_at: string
          elapsed_ms: number | null
          error_message: string | null
          event: string
          id: string
          last_known_plan: string | null
          last_known_plan_tier: string | null
          metadata: Json
          payment_id: string | null
          plan_tier: string | null
          success: boolean
          tx_ref: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          elapsed_ms?: number | null
          error_message?: string | null
          event: string
          id?: string
          last_known_plan?: string | null
          last_known_plan_tier?: string | null
          metadata?: Json
          payment_id?: string | null
          plan_tier?: string | null
          success?: boolean
          tx_ref?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          elapsed_ms?: number | null
          error_message?: string | null
          event?: string
          id?: string
          last_known_plan?: string | null
          last_known_plan_tier?: string | null
          metadata?: Json
          payment_id?: string | null
          plan_tier?: string | null
          success?: boolean
          tx_ref?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          flw_response: Json | null
          flw_transaction_id: string | null
          id: string
          plan_tier: string
          status: string
          tx_ref: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          flw_response?: Json | null
          flw_transaction_id?: string | null
          id?: string
          plan_tier: string
          status?: string
          tx_ref: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          flw_response?: Json | null
          flw_transaction_id?: string | null
          id?: string
          plan_tier?: string
          status?: string
          tx_ref?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country_code: string | null
          created_at: string
          id: string
          plan: string
          plan_tier: string
          pro_expires_at: string | null
          pro_started_at: string | null
          suspended: boolean
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          id: string
          plan?: string
          plan_tier?: string
          pro_expires_at?: string | null
          pro_started_at?: string | null
          suspended?: boolean
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          id?: string
          plan?: string
          plan_tier?: string
          pro_expires_at?: string | null
          pro_started_at?: string | null
          suspended?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      pwa_events: {
        Row: {
          created_at: string
          event: string
          id: string
          platform: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          platform?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          platform?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      recruiter_activity: {
        Row: {
          actor_id: string | null
          company_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          kind: string
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          company_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind: string
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          company_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_activity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          company: string | null
          created_at: string
          description: string | null
          employment_type: string | null
          external_id: string
          favorited: boolean
          id: string
          location: string | null
          posted_at: string | null
          provider: string
          remote: boolean
          tags: string[]
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          description?: string | null
          employment_type?: string | null
          external_id: string
          favorited?: boolean
          id?: string
          location?: string | null
          posted_at?: string | null
          provider?: string
          remote?: boolean
          tags?: string[]
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          description?: string | null
          employment_type?: string | null
          external_id?: string
          favorited?: boolean
          id?: string
          location?: string | null
          posted_at?: string | null
          provider?: string
          remote?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          metadata: Json
          read: boolean
          severity: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json
          read?: boolean
          severity?: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json
          read?: boolean
          severity?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          suspended: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          suspended?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          suspended?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_pro_plan: {
        Args: { _days: number; _plan_tier: string; _user_id: string }
        Returns: undefined
      }
      activate_pro_plan_until: {
        Args: { _expires_at: string; _plan_tier: string; _user_id: string }
        Returns: undefined
      }
      can_manage_jobs: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_capacity_snapshot: { Args: never; Returns: Json }
      has_company_role: {
        Args: {
          _company: string
          _roles: Database["public"]["Enums"]["company_role"][]
          _user: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_company_admin: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      is_pro_active: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "support_admin" | "analytics_admin"
      application_stage:
        | "applied"
        | "under_review"
        | "shortlisted"
        | "interview_scheduled"
        | "assessment"
        | "final_review"
        | "offer_sent"
        | "hired"
        | "rejected"
      application_status:
        | "saved"
        | "applied"
        | "interview"
        | "assessment"
        | "offer"
        | "rejected"
      apply_mode: "in_app" | "external"
      company_member_status: "active" | "invited" | "suspended"
      company_role: "admin" | "recruiter" | "hiring_manager"
      employer_job_status: "draft" | "active" | "closed" | "archived"
      employer_job_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "internship"
        | "temporary"
      employer_plan: "starter" | "growth" | "enterprise"
      interview_mode: "video" | "phone" | "onsite"
      interview_status:
        | "scheduled"
        | "completed"
        | "passed"
        | "failed"
        | "cancelled"
      work_mode: "remote" | "hybrid" | "onsite"
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
      app_role: ["super_admin", "admin", "support_admin", "analytics_admin"],
      application_stage: [
        "applied",
        "under_review",
        "shortlisted",
        "interview_scheduled",
        "assessment",
        "final_review",
        "offer_sent",
        "hired",
        "rejected",
      ],
      application_status: [
        "saved",
        "applied",
        "interview",
        "assessment",
        "offer",
        "rejected",
      ],
      apply_mode: ["in_app", "external"],
      company_member_status: ["active", "invited", "suspended"],
      company_role: ["admin", "recruiter", "hiring_manager"],
      employer_job_status: ["draft", "active", "closed", "archived"],
      employer_job_type: [
        "full_time",
        "part_time",
        "contract",
        "internship",
        "temporary",
      ],
      employer_plan: ["starter", "growth", "enterprise"],
      interview_mode: ["video", "phone", "onsite"],
      interview_status: [
        "scheduled",
        "completed",
        "passed",
        "failed",
        "cancelled",
      ],
      work_mode: ["remote", "hybrid", "onsite"],
    },
  },
} as const
