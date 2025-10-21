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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      academic_records: {
        Row: {
          created_at: string
          id: string
          semester: number
          sgpa: number | null
          student_id: string
          subjects: Json | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          semester: number
          sgpa?: number | null
          student_id: string
          subjects?: Json | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          semester?: number
          sgpa?: number | null
          student_id?: string
          subjects?: Json | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "academic_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          category: string
          created_at: string | null
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id: string
          points: number
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id?: string
          points?: number
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria_type?: string
          criteria_value?: number
          description?: string
          icon?: string
          id?: string
          points?: number
          title?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          college_name: string | null
          created_at: string
          department: string | null
          designation: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          college_name?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          college_name?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_interview_analyses: {
        Row: {
          areas_for_improvement: string[] | null
          communication_clarity_score: number | null
          confidence_score: number | null
          created_at: string
          detailed_feedback: string | null
          eye_contact_score: number | null
          facial_expression_score: number | null
          id: string
          leadership_indicators: Json | null
          nervousness_level: string | null
          overall_soft_skills_score: number | null
          posture_score: number | null
          problem_solving_indicators: Json | null
          recommended_company_types: Json | null
          speaking_pace: string | null
          strengths: string[] | null
          student_id: string
          teamwork_indicators: Json | null
          updated_at: string
          video_duration_seconds: number | null
        }
        Insert: {
          areas_for_improvement?: string[] | null
          communication_clarity_score?: number | null
          confidence_score?: number | null
          created_at?: string
          detailed_feedback?: string | null
          eye_contact_score?: number | null
          facial_expression_score?: number | null
          id?: string
          leadership_indicators?: Json | null
          nervousness_level?: string | null
          overall_soft_skills_score?: number | null
          posture_score?: number | null
          problem_solving_indicators?: Json | null
          recommended_company_types?: Json | null
          speaking_pace?: string | null
          strengths?: string[] | null
          student_id: string
          teamwork_indicators?: Json | null
          updated_at?: string
          video_duration_seconds?: number | null
        }
        Update: {
          areas_for_improvement?: string[] | null
          communication_clarity_score?: number | null
          confidence_score?: number | null
          created_at?: string
          detailed_feedback?: string | null
          eye_contact_score?: number | null
          facial_expression_score?: number | null
          id?: string
          leadership_indicators?: Json | null
          nervousness_level?: string | null
          overall_soft_skills_score?: number | null
          posture_score?: number | null
          problem_solving_indicators?: Json | null
          recommended_company_types?: Json | null
          speaking_pace?: string | null
          strengths?: string[] | null
          student_id?: string
          teamwork_indicators?: Json | null
          updated_at?: string
          video_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_analyses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_at: string
          changed_by: string | null
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
        }
        Insert: {
          application_id: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          application_id?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string
          cover_letter: string | null
          id: string
          job_posting_id: string
          match_reasoning: string | null
          match_score: number | null
          resume_url: string | null
          status: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          cover_letter?: string | null
          id?: string
          job_posting_id: string
          match_reasoning?: string | null
          match_score?: number | null
          resume_url?: string | null
          status?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          cover_letter?: string | null
          id?: string
          job_posting_id?: string
          match_reasoning?: string | null
          match_score?: number | null
          resume_url?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_data_imports: {
        Row: {
          admin_id: string
          completed_at: string | null
          created_at: string
          error_log: Json | null
          failed_records: number | null
          file_url: string
          id: string
          import_type: string
          processed_records: number | null
          status: string | null
          total_records: number | null
        }
        Insert: {
          admin_id: string
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          failed_records?: number | null
          file_url: string
          id?: string
          import_type: string
          processed_records?: number | null
          status?: string | null
          total_records?: number | null
        }
        Update: {
          admin_id?: string
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          failed_records?: number | null
          file_url?: string
          id?: string
          import_type?: string
          processed_records?: number | null
          status?: string | null
          total_records?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_data_imports_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      career_domains: {
        Row: {
          average_salary_range: string | null
          category: string | null
          created_at: string
          description: string | null
          growth_rate: string | null
          id: string
          name: string
        }
        Insert: {
          average_salary_range?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          growth_rate?: string | null
          id?: string
          name: string
        }
        Update: {
          average_salary_range?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          growth_rate?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      career_readiness_scores: {
        Row: {
          academic_score: number | null
          analysis: Json | null
          calculated_at: string
          created_at: string
          experience_score: number | null
          id: string
          overall_score: number
          recommendations: string[] | null
          skills_score: number | null
          soft_skills_score: number | null
          student_id: string
        }
        Insert: {
          academic_score?: number | null
          analysis?: Json | null
          calculated_at?: string
          created_at?: string
          experience_score?: number | null
          id?: string
          overall_score: number
          recommendations?: string[] | null
          skills_score?: number | null
          soft_skills_score?: number | null
          student_id: string
        }
        Update: {
          academic_score?: number | null
          analysis?: Json | null
          calculated_at?: string
          created_at?: string
          experience_score?: number | null
          id?: string
          overall_score?: number
          recommendations?: string[] | null
          skills_score?: number | null
          soft_skills_score?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_readiness_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      career_recommendations: {
        Row: {
          career_domain_id: string
          confidence_score: number
          created_at: string
          generated_at: string
          id: string
          reasoning: string | null
          recommended_skills: string[] | null
          skill_match_percentage: number | null
          student_id: string
        }
        Insert: {
          career_domain_id: string
          confidence_score: number
          created_at?: string
          generated_at?: string
          id?: string
          reasoning?: string | null
          recommended_skills?: string[] | null
          skill_match_percentage?: number | null
          student_id: string
        }
        Update: {
          career_domain_id?: string
          confidence_score?: number
          created_at?: string
          generated_at?: string
          id?: string
          reasoning?: string | null
          recommended_skills?: string[] | null
          skill_match_percentage?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_recommendations_career_domain_id_fkey"
            columns: ["career_domain_id"]
            isOneToOne: false
            referencedRelation: "career_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_recommendations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      career_skills_mapping: {
        Row: {
          career_domain_id: string
          created_at: string
          id: string
          importance_level: string
          skill_id: string
        }
        Insert: {
          career_domain_id: string
          created_at?: string
          id?: string
          importance_level: string
          skill_id: string
        }
        Update: {
          career_domain_id?: string
          created_at?: string
          id?: string
          importance_level?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_skills_mapping_career_domain_id_fkey"
            columns: ["career_domain_id"]
            isOneToOne: false
            referencedRelation: "career_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_skills_mapping_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          created_at: string
          credential_id: string | null
          credential_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuer: string
          student_id: string
          title: string
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer: string
          student_id: string
          title: string
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string
          student_id?: string
          title?: string
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "certifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          context_type: string
          created_at: string
          id: string
          metadata: Json | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          duration: string | null
          id: string
          level: string | null
          price: string | null
          provider: string
          rating: number | null
          skills_covered: string[] | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          level?: string | null
          price?: string | null
          provider: string
          rating?: number | null
          skills_covered?: string[] | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          level?: string | null
          price?: string | null
          provider?: string
          rating?: number | null
          skills_covered?: string[] | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      employers: {
        Row: {
          company_name: string
          company_size: string | null
          created_at: string
          description: string | null
          id: string
          industry: string | null
          location: string | null
          logo_url: string | null
          updated_at: string
          user_id: string
          verification_status: string | null
          verified_at: string | null
          website: string | null
        }
        Insert: {
          company_name: string
          company_size?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          company_name?: string
          company_size?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
          verified_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      extracurricular_activities: {
        Row: {
          achievement: string | null
          category: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          role: string | null
          start_date: string | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          achievement?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          role?: string | null
          start_date?: string | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          achievement?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          role?: string | null
          start_date?: string | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracurricular_activities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage: {
        Row: {
          count: number | null
          created_at: string
          feature_type: string
          id: string
          usage_date: string
          user_id: string
        }
        Insert: {
          count?: number | null
          created_at?: string
          feature_type: string
          id?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          count?: number | null
          created_at?: string
          feature_type?: string
          id?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_feedback: {
        Row: {
          areas_for_improvement: string | null
          communication_score: number | null
          created_at: string
          cultural_fit_score: number | null
          employer_id: string
          feedback_text: string | null
          id: string
          interview_id: string
          overall_rating: number | null
          problem_solving_score: number | null
          strengths: string | null
          technical_score: number | null
          updated_at: string
          would_hire: boolean | null
        }
        Insert: {
          areas_for_improvement?: string | null
          communication_score?: number | null
          created_at?: string
          cultural_fit_score?: number | null
          employer_id: string
          feedback_text?: string | null
          id?: string
          interview_id: string
          overall_rating?: number | null
          problem_solving_score?: number | null
          strengths?: string | null
          technical_score?: number | null
          updated_at?: string
          would_hire?: boolean | null
        }
        Update: {
          areas_for_improvement?: string | null
          communication_score?: number | null
          created_at?: string
          cultural_fit_score?: number | null
          employer_id?: string
          feedback_text?: string | null
          id?: string
          interview_id?: string
          overall_rating?: number | null
          problem_solving_score?: number | null
          strengths?: string | null
          technical_score?: number | null
          updated_at?: string
          would_hire?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_feedback_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_feedback_interview_id_fkey"
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
          duration_minutes: number | null
          feedback: string | null
          id: string
          interview_type: string | null
          interviewer_name: string | null
          location: string | null
          meeting_link: string | null
          rating: number | null
          round_number: number
          scheduled_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_type?: string | null
          interviewer_name?: string | null
          location?: string | null
          meeting_link?: string | null
          rating?: number | null
          round_number: number
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_type?: string | null
          interviewer_name?: string | null
          location?: string | null
          meeting_link?: string | null
          rating?: number | null
          round_number?: number
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          application_deadline: string | null
          benefits: string[] | null
          created_at: string
          department: string | null
          description: string
          employer_id: string
          experience_required: string | null
          id: string
          job_type: string
          location: string | null
          location_type: string | null
          positions_available: number | null
          qualifications: string[] | null
          responsibilities: string[] | null
          salary_range: string | null
          skills_required: string[] | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          benefits?: string[] | null
          created_at?: string
          department?: string | null
          description: string
          employer_id: string
          experience_required?: string | null
          id?: string
          job_type: string
          location?: string | null
          location_type?: string | null
          positions_available?: number | null
          qualifications?: string[] | null
          responsibilities?: string[] | null
          salary_range?: string | null
          skills_required?: string[] | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          benefits?: string[] | null
          created_at?: string
          department?: string | null
          description?: string
          employer_id?: string
          experience_required?: string | null
          id?: string
          job_type?: string
          location?: string | null
          location_type?: string | null
          positions_available?: number | null
          qualifications?: string[] | null
          responsibilities?: string[] | null
          salary_range?: string | null
          skills_required?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
        ]
      }
      job_requirements: {
        Row: {
          created_at: string
          id: string
          is_mandatory: boolean | null
          job_posting_id: string
          requirement_type: string
          requirement_value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_mandatory?: boolean | null
          job_posting_id: string
          requirement_type: string
          requirement_value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_mandatory?: boolean | null
          job_posting_id?: string
          requirement_type?: string
          requirement_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_requirements_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard: {
        Row: {
          branch: string | null
          created_at: string | null
          id: string
          period: string
          period_end: string | null
          period_start: string | null
          points: number | null
          rank: number | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          branch?: string | null
          created_at?: string | null
          id?: string
          period: string
          period_end?: string | null
          period_start?: string | null
          points?: number | null
          rank?: number | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          branch?: string | null
          created_at?: string | null
          id?: string
          period?: string
          period_end?: string | null
          period_start?: string | null
          points?: number | null
          rank?: number | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          career_domain_id: string
          created_at: string
          current_level: string | null
          description: string | null
          estimated_duration: string | null
          id: string
          milestones: Json | null
          recommended_courses: string[] | null
          student_id: string
          target_level: string | null
          title: string
          updated_at: string
        }
        Insert: {
          career_domain_id: string
          created_at?: string
          current_level?: string | null
          description?: string | null
          estimated_duration?: string | null
          id?: string
          milestones?: Json | null
          recommended_courses?: string[] | null
          student_id: string
          target_level?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          career_domain_id?: string
          created_at?: string
          current_level?: string | null
          description?: string | null
          estimated_duration?: string | null
          id?: string
          milestones?: Json | null
          recommended_courses?: string[] | null
          student_id?: string
          target_level?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_career_domain_id_fkey"
            columns: ["career_domain_id"]
            isOneToOne: false
            referencedRelation: "career_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interviews: {
        Row: {
          created_at: string
          difficulty: string
          id: string
          interview_type: string
          overall_score: number | null
          questions: Json
          responses: Json
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty: string
          id?: string
          interview_type: string
          overall_score?: number | null
          questions?: Json
          responses?: Json
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          id?: string
          interview_type?: string
          overall_score?: number | null
          questions?: Json
          responses?: Json
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_interviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_statistics: {
        Row: {
          academic_year: string
          average_package: number | null
          branch: string | null
          companies_visited: number | null
          created_at: string
          department: string
          highest_package: number | null
          id: string
          median_package: number | null
          placed_students: number
          placement_percentage: number | null
          total_offers: number | null
          total_students: number
          updated_at: string
        }
        Insert: {
          academic_year: string
          average_package?: number | null
          branch?: string | null
          companies_visited?: number | null
          created_at?: string
          department: string
          highest_package?: number | null
          id?: string
          median_package?: number | null
          placed_students?: number
          placement_percentage?: number | null
          total_offers?: number | null
          total_students?: number
          updated_at?: string
        }
        Update: {
          academic_year?: string
          average_package?: number | null
          branch?: string | null
          companies_visited?: number | null
          created_at?: string
          department?: string
          highest_package?: number | null
          id?: string
          median_package?: number | null
          placed_students?: number
          placement_percentage?: number | null
          total_offers?: number | null
          total_students?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          language: string | null
          phone: string | null
          profile_completed: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          language?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          language?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          github_url: string | null
          id: string
          is_ongoing: boolean | null
          project_url: string | null
          start_date: string | null
          student_id: string
          technologies: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          github_url?: string | null
          id?: string
          is_ongoing?: boolean | null
          project_url?: string | null
          start_date?: string | null
          student_id: string
          technologies?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          github_url?: string | null
          id?: string
          is_ongoing?: boolean | null
          project_url?: string | null
          start_date?: string | null
          student_id?: string
          technologies?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          admin_id: string
          created_at: string
          filters: Json | null
          frequency: string
          id: string
          is_active: boolean | null
          last_generated: string | null
          next_generation: string
          recipients: string[]
          report_type: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          filters?: Json | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_generated?: string | null
          next_generation: string
          recipients: string[]
          report_type: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          filters?: Json | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_generated?: string | null
          next_generation?: string
          recipients?: string[]
          report_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlists: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          job_posting_id: string
          match_reasoning: string | null
          match_score: number
          rank: number | null
          student_id: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          job_posting_id: string
          match_reasoning?: string | null
          match_score: number
          rank?: number | null
          student_id: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          job_posting_id?: string
          match_reasoning?: string | null
          match_score?: number
          rank?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlists_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlists_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_demand_trends: {
        Row: {
          category: string
          created_at: string
          demand_score: number | null
          id: string
          industry: string | null
          job_postings_count: number | null
          period_end: string
          period_start: string
          salary_premium: number | null
          skill_name: string
          trend: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          demand_score?: number | null
          id?: string
          industry?: string | null
          job_postings_count?: number | null
          period_end: string
          period_start: string
          salary_premium?: number | null
          skill_name: string
          trend?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          demand_score?: number | null
          id?: string
          industry?: string | null
          job_postings_count?: number | null
          period_end?: string
          period_start?: string
          salary_premium?: number | null
          skill_name?: string
          trend?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      student_achievements: {
        Row: {
          achievement_id: string
          created_at: string | null
          id: string
          student_id: string
          unlocked_at: string | null
        }
        Insert: {
          achievement_id: string
          created_at?: string | null
          id?: string
          student_id: string
          unlocked_at?: string | null
        }
        Update: {
          achievement_id?: string
          created_at?: string | null
          id?: string
          student_id?: string
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_gamification: {
        Row: {
          created_at: string | null
          experience: number | null
          id: string
          last_activity_date: string | null
          level: number | null
          streak_days: number | null
          student_id: string
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          experience?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          streak_days?: number | null
          student_id: string
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          experience?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          streak_days?: number | null
          student_id?: string
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_gamification_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          completed_at: string | null
          course_id: string | null
          created_at: string
          id: string
          progress_percentage: number | null
          skill_id: string | null
          started_at: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          progress_percentage?: number | null
          skill_id?: string | null
          started_at?: string | null
          status: string
          student_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          progress_percentage?: number | null
          skill_id?: string | null
          started_at?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_skills: {
        Row: {
          created_at: string
          id: string
          proficiency_level: string
          skill_id: string
          student_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          proficiency_level: string
          skill_id: string
          student_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          proficiency_level?: string
          skill_id?: string
          student_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "student_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          bio: string | null
          branch: string | null
          cgpa: number | null
          created_at: string
          department: string | null
          github_url: string | null
          id: string
          interests: string[] | null
          linkedin_url: string | null
          portfolio_url: string | null
          registration_no: string | null
          resume_url: string | null
          skills: string[] | null
          updated_at: string
          user_id: string
          year_of_study: number | null
        }
        Insert: {
          bio?: string | null
          branch?: string | null
          cgpa?: number | null
          created_at?: string
          department?: string | null
          github_url?: string | null
          id?: string
          interests?: string[] | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          registration_no?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
          year_of_study?: number | null
        }
        Update: {
          bio?: string | null
          branch?: string | null
          cgpa?: number | null
          created_at?: string
          department?: string | null
          github_url?: string | null
          id?: string
          interests?: string[] | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          registration_no?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          year_of_study?: number | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          display_order: number | null
          features: Json
          id: string
          is_active: boolean | null
          limits: Json
          name: string
          price_annual: number | null
          price_monthly: number | null
          updated_at: string
          user_type: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          features?: Json
          id?: string
          is_active?: boolean | null
          limits?: Json
          name: string
          price_annual?: number | null
          price_monthly?: number | null
          updated_at?: string
          user_type: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          features?: Json
          id?: string
          is_active?: boolean | null
          limits?: Json
          name?: string
          price_annual?: number | null
          price_monthly?: number | null
          updated_at?: string
          user_type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          last_payment_date: string | null
          payment_method: string | null
          plan_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_payment_date?: string | null
          payment_method?: string | null
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_payment_date?: string | null
          payment_method?: string | null
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_employer_id: {
        Args: { _user_id: string }
        Returns: string
      }
      get_student_id: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
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
    }
    Enums: {
      app_role: "student" | "employer" | "admin"
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
      app_role: ["student", "employer", "admin"],
    },
  },
} as const
