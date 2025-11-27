import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletId, newAddress, adminId, targetUserId } = await req.json();

    if (!walletId || !newAddress || !adminId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service_role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify admin role
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', adminId)
      .eq('role', 'admin')
      .single();

    if (roleError || !adminRole) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update wallet address using service_role to bypass RLS
    const { data: updatedWallet, error: updateError } = await supabaseAdmin
      .from('crypto_wallets')
      .update({ 
        wallet_address: newAddress,
        updated_at: new Date().toISOString()
      })
      .eq('id', walletId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating wallet:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update wallet address" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the admin action
    await supabaseAdmin.from('admin_logs').insert({
      admin_id: adminId,
      action_type: 'wallet_address_update',
      target_user_id: targetUserId,
      details: { 
        wallet_id: walletId, 
        new_address: newAddress,
        coin_symbol: updatedWallet.coin_symbol
      }
    });

    console.log(`Wallet address updated successfully for wallet ${walletId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Wallet address updated successfully",
        wallet: updatedWallet
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in update-wallet-address function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
