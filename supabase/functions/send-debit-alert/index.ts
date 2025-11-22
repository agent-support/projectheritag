import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DebitAlertRequest {
  email: string;
  name: string;
  recipientName: string;
  amount: number;
  currency: string;
  currentBalance: number;
  transactionId: string;
  timestamp: string;
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const formatDateTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const generateDebitAlertHTML = (data: DebitAlertRequest) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Debit Alert - Heritage Bank</title>
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
              <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">Transaction Notification</p>
            </td>
          </tr>
          
          <!-- Alert Badge -->
          <tr>
            <td style="padding: 30px 30px 0 30px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 12px 30px; border-radius: 25px; font-weight: 600; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
                Debit Alert
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 22px;">Hello ${data.name},</h2>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                A payment was successfully processed from your account. Here are the details:
              </p>
              
              <!-- Transaction Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; overflow: hidden; margin: 25px 0;">
                <tr>
                  <td style="padding: 25px;">
                    <!-- Amount Debited -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 15px; background-color: #fee2e2; border-left: 4px solid #ef4444; border-radius: 4px;">
                          <p style="color: #7f1d1d; font-size: 14px; margin: 0 0 5px 0; font-weight: 600;">Amount Debited</p>
                          <p style="color: #991b1b; font-size: 32px; margin: 0; font-weight: bold;">${formatCurrency(data.amount, data.currency)}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Transaction Info -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="color: #64748b; font-size: 13px; margin: 0;">Recipient Name</p>
                          <p style="color: #1e293b; font-size: 15px; margin: 5px 0 0 0; font-weight: 600;">${data.recipientName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e2e8f0;">
                          <p style="color: #64748b; font-size: 13px; margin: 0;">Transaction Date & Time</p>
                          <p style="color: #1e293b; font-size: 15px; margin: 5px 0 0 0; font-weight: 600;">${formatDateTime(data.timestamp)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e2e8f0;">
                          <p style="color: #64748b; font-size: 13px; margin: 0;">Transaction ID</p>
                          <p style="color: #1e293b; font-size: 15px; margin: 5px 0 0 0; font-family: 'Courier New', monospace;">${data.transactionId}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e2e8f0;">
                          <p style="color: #64748b; font-size: 13px; margin: 0;">Current Account Balance</p>
                          <p style="color: #1e293b; font-size: 18px; margin: 5px 0 0 0; font-weight: bold;">${formatCurrency(data.currentBalance, data.currency)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <tr>
                  <td style="padding: 18px;">
                    <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.5;">
                      <strong>Note:</strong> If you did not authorize this transaction or notice any suspicious activity, please contact our support team immediately for assistance.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Thank you for banking with Heritage Bank. We're committed to keeping your finances secure.
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
    const data: DebitAlertRequest = await req.json();
    
    console.log("Sending debit alert email to:", data.email);

    const emailResponse = await resend.emails.send({
      from: "Heritage Bank <onboarding@resend.dev>",
      to: [data.email],
      subject: `Debit Alert: ${formatCurrency(data.amount, data.currency)} Sent - Heritage Bank`,
      html: generateDebitAlertHTML(data),
    });

    console.log("Debit alert email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-debit-alert function:", error);
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
