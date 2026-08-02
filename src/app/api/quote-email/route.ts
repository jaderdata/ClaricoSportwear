import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      protocol,
      full_name,
      academy_name,
      email,
      whatsapp,
      quantity,
      event_name,
      discount_code,
      segment = 'SPORTS',
    } = body;

    if (!protocol || !email || !full_name || !academy_name) {
      return NextResponse.json(
        { error: 'Missing required fields for email dispatch' },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    // Customer HTML Email Template
    const customerHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090a0f; color: #f8fafc; margin: 0; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #12151e; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; }
          .header { background: linear-gradient(135deg, #181c28 0%, #090a0f 100%); padding: 32px; text-align: center; border-b: 1px solid rgba(255,255,255,0.08); }
          .logo { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase; margin: 0; }
          .tagline { font-size: 10px; font-weight: 700; letter-spacing: 3px; color: #ff2a4b; text-transform: uppercase; margin-top: 4px; }
          .content { padding: 32px; }
          .protocol-box { background-color: #090a0f; border: 1px solid #ff2a4b; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .protocol-code { font-family: monospace; font-size: 24px; font-weight: 900; color: #ff2a4b; letter-spacing: 2px; }
          .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .details-table td { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
          .details-label { color: #94a3b8; font-weight: 600; }
          .details-val { color: #ffffff; font-weight: 700; text-align: right; }
          .footer { padding: 24px 32px; background-color: #090a0f; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.08); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">CLARICO STUDIO</h1>
            <div class="tagline">Premium Custom Jiu-Jitsu Apparel</div>
          </div>
          
          <div class="content">
            <h2 style="color: #ffffff; margin-top: 0; font-size: 22px;">Quote Request Confirmation</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
              Hello <strong style="color: #ffffff;">${full_name}</strong>, thank you for choosing Clarico Studio for <strong>${academy_name}</strong>. Our technical design team is analyzing your request and logo files.
            </p>

            <div class="protocol-box">
              <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">Tracking Protocol</div>
              <div class="protocol-code">${protocol}</div>
            </div>

            <table class="details-table">
              <tr>
                <td class="details-label">Academy / Gym</td>
                <td class="details-val">${academy_name}</td>
              </tr>
              <tr>
                <td class="details-label">Requested Quantity</td>
                <td class="details-val" style="color: #e5b95f;">${quantity} pieces</td>
              </tr>
              ${event_name ? `
              <tr>
                <td class="details-label">Event / Deadline</td>
                <td class="details-val">${event_name}</td>
              </tr>
              ` : ''}
              ${discount_code ? `
              <tr>
                <td class="details-label">Discount Applied</td>
                <td class="details-val" style="color: #10b981;">${discount_code}</td>
              </tr>
              ` : ''}
              <tr>
                <td class="details-label">Status</td>
                <td class="details-val" style="color: #ff2a4b;">Pending Review</td>
              </tr>
            </table>

            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin-top: 24px;">
              You will receive your 3D digital mockup proof and custom pricing via WhatsApp (<strong>${whatsapp}</strong>) or Email within 24 business hours.
            </p>
          </div>

          <div class="footer">
            © ${new Date().getFullYear()} Clarico Studio. Next Level Blanks • High-Res DTF Printing.<br/>
            You can track your order live anytime on our platform using protocol <strong>${protocol}</strong>.
          </div>
        </div>
      </body>
      </html>
    `;

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      // Send to Customer
      await resend.emails.send({
        from: 'Clarico Studio <orders@claricostudio.com>',
        to: [email],
        subject: `[${protocol}] Quote Request Received - Clarico Studio`,
        html: customerHtml,
      });

      // Send Admin Notification
      await resend.emails.send({
        from: 'Clarico System <system@claricostudio.com>',
        to: ['support@claricostudio.com'],
        subject: `🚨 NEW [${segment}] LEAD: ${academy_name} (${quantity} pcs) - ${protocol}`,
        html: `<p>New quote submitted by <strong>${full_name}</strong> for <strong>${academy_name}</strong>.</p><p><strong>Segment:</strong> ${segment} | <strong>Quantity:</strong> ${quantity} | <strong>Protocol:</strong> ${protocol}</p>`
      });
    } else {
      console.log('=== [TRANSACTIONAL EMAIL DISPATCH SIMULATION] ===');
      console.log(`To: ${email}`);
      console.log(`Subject: [${protocol}] Quote Request Received - Clarico Studio`);
      console.log(`Protocol: ${protocol} | Academy: ${academy_name} | Qty: ${quantity}`);
      console.log('================================================');
    }

    return NextResponse.json({
      success: true,
      protocol,
      message: 'Transactional email processed successfully.'
    });

  } catch (error) {
    console.error('Error dispatching transactional email:', error);
    const message = error instanceof Error ? error.message : 'Failed to dispatch email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
