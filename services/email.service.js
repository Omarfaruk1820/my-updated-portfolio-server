import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const hrEmail = process.env.HR_EMAIL;
const mailFrom = process.env.MAIL_FROM;

if (!resendApiKey) {
  console.warn("⚠️ RESEND_API_KEY is not configured.");
}

if (!hrEmail) {
  console.warn("⚠️ HR_EMAIL is not configured.");
}

if (!mailFrom) {
  console.warn("⚠️ MAIL_FROM is not configured.");
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Escape user-provided values before inserting them into HTML.
 */
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/**
 * Convert plain text into safe HTML while preserving line breaks.
 */
const formatMessage = (value = "") =>
  escapeHtml(value).replace(/\r?\n/g, "<br />");

/**
 * Send a new contact/project inquiry notification to the portfolio owner.
 */
export const sendContactNotificationEmail = async ({
  name,
  email,
  phone,
  service,
  subject,
  message,
}) => {
  if (!resend) {
    throw new Error("Resend is not configured.");
  }

  if (!hrEmail) {
    throw new Error("HR_EMAIL is not configured.");
  }

  if (!mailFrom) {
    throw new Error("MAIL_FROM is not configured.");
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone || "Not provided");
  const safeService = escapeHtml(service || "Not specified");
  const safeSubject = escapeHtml(subject || "No subject");
  const safeMessage = formatMessage(message);

  const emailSubject = `New Portfolio Contact — ${String(
    subject || "Project Inquiry",
  ).trim()}`;

  const { data, error } = await resend.emails.send({
    from: mailFrom,
    to: [hrEmail],
    replyTo: email,
    subject: emailSubject,

    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>New Portfolio Contact</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background-color: #f5f7fb;
            font-family: Arial, Helvetica, sans-serif;
            color: #172033;
          "
        >
          <div style="padding: 40px 16px;">
            <div
              style="
                max-width: 680px;
                margin: 0 auto;
                background-color: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                overflow: hidden;
              "
            >

              <!-- Header -->
              <div
                style="
                  padding: 28px 32px;
                  background-color: #111827;
                  color: #ffffff;
                "
              >
                <div
                  style="
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: #a5b4fc;
                  "
                >
                  Portfolio Contact
                </div>

                <h1
                  style="
                    margin: 10px 0 0;
                    font-size: 26px;
                    line-height: 1.3;
                    color: #ffffff;
                  "
                >
                  New project inquiry
                </h1>

                <p
                  style="
                    margin: 10px 0 0;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #d1d5db;
                  "
                >
                  Someone has submitted a new project inquiry through your
                  portfolio website.
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 32px;">

                <!-- Contact Details -->
                <div
                  style="
                    padding: 20px;
                    background-color: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                  "
                >
                  <div
                    style="
                      margin-bottom: 14px;
                      font-size: 12px;
                      font-weight: 700;
                      letter-spacing: 1px;
                      text-transform: uppercase;
                      color: #6b7280;
                    "
                  >
                    Contact Details
                  </div>

                  <table
                    role="presentation"
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    style="border-collapse: collapse;"
                  >

                    <!-- Name -->
                    <tr>
                      <td
                        style="
                          padding: 8px 0;
                          width: 110px;
                          font-size: 14px;
                          font-weight: 700;
                          color: #374151;
                          vertical-align: top;
                        "
                      >
                        Name
                      </td>

                      <td
                        style="
                          padding: 8px 0;
                          font-size: 14px;
                          color: #111827;
                          vertical-align: top;
                        "
                      >
                        ${safeName}
                      </td>
                    </tr>

                    <!-- Email -->
                    <tr>
                      <td
                        style="
                          padding: 8px 0;
                          width: 110px;
                          font-size: 14px;
                          font-weight: 700;
                          color: #374151;
                          vertical-align: top;
                        "
                      >
                        Email
                      </td>

                      <td
                        style="
                          padding: 8px 0;
                          font-size: 14px;
                          color: #111827;
                          vertical-align: top;
                        "
                      >
                        ${safeEmail}
                      </td>
                    </tr>

                    <!-- Phone -->
                    <tr>
                      <td
                        style="
                          padding: 8px 0;
                          width: 110px;
                          font-size: 14px;
                          font-weight: 700;
                          color: #374151;
                          vertical-align: top;
                        "
                      >
                        Phone
                      </td>

                      <td
                        style="
                          padding: 8px 0;
                          font-size: 14px;
                          color: #111827;
                          vertical-align: top;
                        "
                      >
                        ${safePhone}
                      </td>
                    </tr>

                    <!-- Service -->
                    <tr>
                      <td
                        style="
                          padding: 8px 0;
                          width: 110px;
                          font-size: 14px;
                          font-weight: 700;
                          color: #374151;
                          vertical-align: top;
                        "
                      >
                        Service
                      </td>

                      <td
                        style="
                          padding: 8px 0;
                          font-size: 14px;
                          color: #111827;
                          vertical-align: top;
                        "
                      >
                        ${safeService}
                      </td>
                    </tr>

                    <!-- Subject -->
                    <tr>
                      <td
                        style="
                          padding: 8px 0;
                          width: 110px;
                          font-size: 14px;
                          font-weight: 700;
                          color: #374151;
                          vertical-align: top;
                        "
                      >
                        Subject
                      </td>

                      <td
                        style="
                          padding: 8px 0;
                          font-size: 14px;
                          color: #111827;
                          vertical-align: top;
                        "
                      >
                        ${safeSubject}
                      </td>
                    </tr>

                  </table>
                </div>

                <!-- Message -->
                <div style="margin-top: 24px;">
                  <div
                    style="
                      margin-bottom: 10px;
                      font-size: 12px;
                      font-weight: 700;
                      letter-spacing: 1px;
                      text-transform: uppercase;
                      color: #6b7280;
                    "
                  >
                    Project Details
                  </div>

                  <div
                    style="
                      padding: 20px;
                      background-color: #ffffff;
                      border: 1px solid #e5e7eb;
                      border-radius: 12px;
                      font-size: 15px;
                      line-height: 1.8;
                      color: #374151;
                    "
                  >
                    ${safeMessage}
                  </div>
                </div>

                <!-- Reply Note -->
                <div
                  style="
                    margin-top: 24px;
                    padding: 16px 18px;
                    background-color: #f3f4f6;
                    border-radius: 10px;
                    font-size: 13px;
                    line-height: 1.6;
                    color: #4b5563;
                  "
                >
                  <strong>Reply tip:</strong>
                  Click
                  <strong>Reply</strong>
                  in your email client to respond directly to
                  ${safeName}.
                </div>

              </div>

              <!-- Footer -->
              <div
                style="
                  padding: 20px 32px;
                  border-top: 1px solid #e5e7eb;
                  background-color: #f9fafb;
                  font-size: 12px;
                  line-height: 1.6;
                  color: #9ca3af;
                "
              >
                This notification was sent automatically from your portfolio
                contact form.
              </div>

            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    throw new Error(
      error.message || "Failed to send contact notification email.",
    );
  }

  return data;
};
