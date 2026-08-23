import {createClient} from "@supabase/supabase-js";

let supabaseClient;

export function initSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL || "https://your-supabase-url.supabase.co";
    const supabaseKey = process.env.SUPABASE_KEY || "your-supabase-key";
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase URL and Key must be provided in environment variables.");
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized.");

}

export function getSupabaseClient() { 
    if (!supabaseClient) {
        throw new Error("Supabase client not initialized. Call initSupabase() first.");
    }
    return supabaseClient;
}