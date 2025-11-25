import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPEmailRequest {
  email: string;
  name: string;
}

const generateOTPEmailHTML = (name: string, otp: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Identity Verification - Heritage Bank</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Heritage Bank</h1>
              <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">Secure Banking Solutions</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Hello ${name},</h2>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for registering with Heritage Bank. To complete your account setup and verify your identity, please use the following verification code:
              </p>
              
              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center" style="background-color: #f1f5f9; border-radius: 8px; padding: 30px;">
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                    <p style="color: #1e40af; font-size: 42px; font-weight: bold; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                This code is valid for 30 minutes and is required to authenticate your identity and ensure the security of your account.
              </p>
              
              <!-- Security Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                      <strong>Important:</strong> Do not share this code with anyone. Heritage Bank will never ask you to provide this code over the phone or via email.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                If you did not request this verification code, please contact our support team immediately.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
                Heritage Bank - Your Trusted Banking Partner
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                For assistance, contact us at <a href="mailto:support@heritagehelpteam.online" style="color: #3b82f6; text-decoration: none;">support@heritagehelpteam.online</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email }: OTPEmailRequest = await req.json();
    
    console.log("Generating OTP for:", email);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database with 30 minute expiry
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Delete any existing OTPs for this email
    await supabase
      .from('otp_codes')
      .delete()
      .eq('email', email);

    // Insert new OTP
    const { error: otpError } = await supabase
      .from('otp_codes')
      .insert({
        email,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
      });

    if (otpError) {
      console.error("Error storing OTP:", otpError);
      throw new Error("Failed to store OTP");
    }

    console.log("OTP stored successfully, sending email...");

    // Configure SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.hostinger.com",
        port: 465,
        tls: true,
        auth: {
          username: "support@heritagehelpteam.online",
          password: Deno.env.get("SMTP_PASSWORD") || "",
        },
      },
    });

    // Send email
    await client.send({
      from: "Heritage Bank <support@heritagehelpteam.online>",
      to: email,
      subject: "Identity Verification - Heritage Bank",
      content: "Your OTP code is: " + otp,
      html: generateOTPEmailHTML(name, otp),
    });

    await client.close();

    console.log("OTP email sent successfully");

    return new Response(JSON.stringify({ success: true, message: "OTP sent successfully" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-otp-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
