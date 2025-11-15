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
      accounts: {
        Row: {
          account_number: string
          account_type: string
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number: string
          account_type: string
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string
          account_type?: string
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          account_number: string
          amount: number
          biller_name: string
          category: string | null
          created_at: string | null
          due_date: string
          id: string
          paid_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          account_number: string
          amount: number
          biller_name: string
          category?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          paid_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          account_number?: string
          amount?: number
          biller_name?: string
          category?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          paid_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crypto_wallets: {
        Row: {
          balance: number | null
          coin_symbol: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          balance?: number | null
          coin_symbol: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          balance?: number | null
          coin_symbol?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      holdings: {
        Row: {
          created_at: string | null
          current_price: number
          gain_loss: number | null
          gain_loss_percentage: number | null
          id: string
          name: string
          portfolio_id: string
          purchase_price: number
          quantity: number
          symbol: string
          total_value: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_price: number
          gain_loss?: number | null
          gain_loss_percentage?: number | null
          id?: string
          name: string
          portfolio_id: string
          purchase_price: number
          quantity: number
          symbol: string
          total_value?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_price?: number
          gain_loss?: number | null
          gain_loss_percentage?: number | null
          id?: string
          name?: string
          portfolio_id?: string
          purchase_price?: number
          quantity?: number
          symbol?: string
          total_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          created_at: string | null
          gain_loss_percentage: number | null
          id: string
          name: string
          total_gain_loss: number | null
          total_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          gain_loss_percentage?: number | null
          id?: string
          name?: string
          total_gain_loss?: number | null
          total_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          gain_loss_percentage?: number | null
          id?: string
          name?: string
          total_gain_loss?: number | null
          total_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          age: number | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          first_name: string | null
          full_name: string
          id: string
          last_name: string | null
          phone: string | null
          profile_picture_url: string | null
          transfer_pin: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          first_name?: string | null
          full_name: string
          id: string
          last_name?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          transfer_pin?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          first_name?: string | null
          full_name?: string
          id?: string
          last_name?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          transfer_pin?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string | null
          description: string | null
          id: string
          recipient: string | null
          status: string | null
          transaction_type: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          recipient?: string | null
          status?: string | null
          transaction_type: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          recipient?: string | null
          status?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          amount: number
          created_at: string
          id: string
          recipient_account: string
          recipient_bank: string | null
          recipient_country: string | null
          recipient_name: string
          reference_number: string
          status: string
          transfer_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          recipient_account: string
          recipient_bank?: string | null
          recipient_country?: string | null
          recipient_name: string
          reference_number: string
          status?: string
          transfer_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          recipient_account?: string
          recipient_bank?: string | null
          recipient_country?: string | null
          recipient_name?: string
          reference_number?: string
          status?: string
          transfer_type?: string
          user_id?: string
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
    Enums: {},
  },
} as const
