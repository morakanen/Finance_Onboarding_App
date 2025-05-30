import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from urllib.parse import quote

# Email configuration for local development with MailHog
SMTP_HOST = "mailhog"  # Docker service name
SMTP_PORT = 1025
SENDER_EMAIL = "admin@example.com"
ADMIN_EMAIL = "admin@example.com"

# URL configuration
FRONTEND_URL = "http://localhost:3000"  # Frontend URL
BACKEND_URL = "http://localhost:8000"  # Backend URL

async def send_application_completed_email(application_id: str, user_email: str) -> bool:
    """
    Send an email notification when an application is completed.
    Uses MailHog for local development.
    """
    # Create message
    message = MIMEMultipart()
    message["From"] = SENDER_EMAIL
    message["To"] = ADMIN_EMAIL
    message["Subject"] = "New Application Ready for Review"

    # Create application link that forces logout through backend and redirects to admin dashboard after login
    admin_path = f"{FRONTEND_URL}/admin/dashboard?application={application_id}&view=details"
    login_path = f"{FRONTEND_URL}/auth?redirect={quote(admin_path)}"
    # Use the backend API endpoint which will clear cookies and redirect
    application_link = f"{BACKEND_URL}/api/logout?redirect={quote(login_path)}"

    # Email body with HTML
    html_body = f"""
    <html>
        <body>
            <h2>New Application Ready for Review</h2>
            <p>A new application has been submitted and is ready for review.</p>
            
            <p><strong>Application ID:</strong> {application_id}<br>
            <strong>User Email:</strong> {user_email}</p>
            
            <p>Click the link below to review this application:</p>
            
            <p><a href="{application_link}">Review Application</a></p>
            
            <p>If the link doesn't work, copy and paste this URL into your browser:</p>
            <p>{application_link}</p>
            
            <hr>
            <p><small>This is an automated message from the Finance Onboarding System.</small></p>
        </body>
    </html>
    """

    # Plain text alternative
    text_body = f"""
    New Application Ready for Review
    
    A new application has been submitted and is ready for review.
    
    Application ID: {application_id}
    User Email: {user_email}
    
    To review this application, visit:
    {application_link}
    
    ---
    This is an automated message from the Finance Onboarding System.
    """

    # Attach both HTML and plain text versions
    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))

    try:
        # Connect to MailHog SMTP server
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            use_tls=False  # MailHog doesn't use TLS
        )
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False
