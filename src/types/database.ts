// src/types/database.ts
// Manual stub matching ReServe schema (PRD Section 5)
// Replace with generated types after running:
//   npx supabase gen types typescript --project-id <your-id> > src/types/database.ts

export type UserRole    = "donor" | "ngo" | "volunteer" | "admin";
export type UserStatus  = "pending" | "active" | "suspended";
export type ListingStatus = "active" | "claimed" | "completed" | "expired";
export type PickupStatus  = "claimed" | "in_progress" | "completed" | "cancelled";
export type KYCStatus     = "pending" | "approved" | "rejected";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id:         string;
          email:      string;
          role:       UserRole;
          status:     UserStatus;
          created_at: string;
        };
        Insert: {
          id:         string;   // must match auth.users UUID
          email:      string;
          role:       UserRole;
          status?:    UserStatus;
        };
        Update: Partial<{
          role:   UserRole;
          status: UserStatus;
        }>;
      };
      listings: {
        Row: {
          id:           string;
          donor_id:     string;
          food_type:    string;
          quantity_kg:  number;
          photo_url:    string | null;
          lat:          number;
          lng:          number;
          address:      string;
          pickup_start: string;
          pickup_end:   string;
          status:       ListingStatus;
          created_at:   string;
        };
        Insert: Omit<Database["public"]["Tables"]["listings"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>;
      };
      pickups: {
        Row: {
          id:              string;
          listing_id:      string;
          ngo_id:          string;
          volunteer_id:    string | null;
          claimed_at:      string;
          completed_at:    string | null;
          proof_photo_url: string | null;
          status:          PickupStatus;
        };
        Insert: Omit<Database["public"]["Tables"]["pickups"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["pickups"]["Insert"]>;
      };
      ngos: {
        Row: {
          id:            string;
          org_name:      string;
          kyc_status:    KYCStatus;
          contact_phone: string;
        };
        Insert: Database["public"]["Tables"]["ngos"]["Row"];
        Update: Partial<Omit<Database["public"]["Tables"]["ngos"]["Row"], "id">>;
      };
      volunteers: {
        Row: {
          id:              string;
          hours_logged:    number;
          rating:          number;
          tasks_completed: number;
        };
        Insert: Database["public"]["Tables"]["volunteers"]["Row"];
        Update: Partial<Omit<Database["public"]["Tables"]["volunteers"]["Row"], "id">>;
      };
      notifications: {
        Row: {
          id:           string;
          user_id:      string;
          type:         string;
          title:        string;
          body:         string;
          reference_id: string | null;
          is_read:      boolean;
          created_at:   string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at">;
        Update: Partial<Pick<Database["public"]["Tables"]["notifications"]["Row"], "is_read">>;
      };
    };
  };
}