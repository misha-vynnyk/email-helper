# Email Sender

SMTP email sending functionality with credential management.

## Features

- **SMTP Sending** - Send emails via SMTP server
- **Credential Storage** - Securely store SMTP credentials
- **Test Mode** - Preview emails before sending
- **Template Support** - Send template-based emails
- **Attachment Support** - Include files in emails
- **Error Handling** - Detailed error messages and retry logic

## Usage

```typescript
import { EmailSenderPanel } from '@/emailSender';

function MyComponent() {
  return <EmailSenderPanel />;
}
```

## Components

### EmailSenderPanel

Main component for sending emails.

**Props:**

- `defaultTemplate?: string` - Pre-fill with template
- `onSent?: (result: SendResult) => void` - Success callback

### EmailCredentialsForm

SMTP credentials configuration form.

**Props:**

- `onSave: (credentials: Credentials) => void`
- `onCancel?: () => void`
- `initialData?: Credentials`

## API

### Send Email

```typescript
POST /api/email/send

Body:
{
  to: string[],
  subject: string,
  html: string,
  text?: string,
  from?: string,
  replyTo?: string,
  cc?: string[],
  bcc?: string[],
  attachments?: Array<{
    filename: string,
    content: string | Buffer,
    contentType?: string
  }>
}

Response:
{
  success: boolean,
  messageId?: string,
  error?: string
}
```

### Check Server Status

```typescript
GET /api/email/status

Response:
{
  online: boolean,
  configured: boolean,
  lastCheck: number
}
```

## Credential Management

### Storage

Credentials are stored encrypted on the server. The client only stores a flag indicating if credentials are configured.

### Registration Flow

1. User enters SMTP credentials
2. Credentials sent to `/api/email/register`
3. Server validates and encrypts credentials
4. Stores encrypted data in `server/data/email/`
5. Returns success/failure

### Security

- Credentials encrypted at rest
- Never stored in localStorage/cookies
- Transmitted over HTTPS only
- Server-side validation

## Types

```typescript
interface EmailCredentials {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

interface EmailMessage {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

## Email Formats

### Plain Text

```typescript
const email = {
  to: ["user@example.com"],
  subject: "Hello",
  text: "Plain text content",
};
```

### HTML

```typescript
const email = {
  to: ["user@example.com"],
  subject: "Hello",
  html: "<h1>HTML content</h1>",
  text: "Fallback plain text",
};
```

### With Attachments

```typescript
const email = {
  to: ["user@example.com"],
  subject: "Hello",
  html: "<h1>See attachment</h1>",
  attachments: [
    {
      filename: "document.pdf",
      content: Buffer.from("..."),
      contentType: "application/pdf",
    },
  ],
};
```

## SMTP Configuration

### Gmail

```typescript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: 'your-email@gmail.com',
  pass: 'app-specific-password' // Not your Gmail password!
}
```

### Outlook/Office365

```typescript
{
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  user: 'your-email@outlook.com',
  pass: 'your-password'
}
```

### Custom SMTP

```typescript
{
  host: 'smtp.yourdomain.com',
  port: 465,
  secure: true,
  user: 'username',
  pass: 'password'
}
```

## Error Handling

Common errors and solutions:

**Authentication Failed**

- Check username/password
- Enable "Less secure apps" (Gmail)
- Use app-specific password (Gmail)

**Connection Timeout**

- Check host/port
- Verify firewall settings
- Try different port (587 vs 465)

**Invalid Recipients**

- Validate email addresses
- Check for typos
- Remove invalid addresses

**Message Too Large**

- Reduce attachment size
- Compress images
- Split into multiple emails

## Best Practices

1. **Always provide text fallback** for HTML emails
2. **Validate email addresses** before sending
3. **Test with yourself** before sending to users
4. **Use meaningful subjects** for better open rates
5. **Include unsubscribe link** for marketing emails
6. **Monitor bounce rates** and remove invalid addresses
7. **Use templates** for consistent formatting
8. **Log send attempts** for debugging

## Integration

### With Template Library

```typescript
import { useTemplate } from "@/templateLibrary";
import { sendEmail } from "@/emailSender";

async function sendTemplateEmail(templateId: string, to: string[]) {
  const template = await templateService.getTemplate(templateId);

  await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}
```

### With Validation

```typescript
import { validateEmailHtml } from "@/emailValidator";
import { sendEmail } from "@/emailSender";

async function sendValidatedEmail(email: EmailMessage) {
  const validation = validateEmailHtml(email.html);

  if (!validation.valid) {
    throw new Error("Email HTML has validation errors");
  }

  return sendEmail(email);
}
```

## Future Improvements

- [ ] Send queue for bulk emails
- [ ] Email scheduling
- [ ] Delivery tracking
- [ ] Open/click tracking
- [ ] Bounce handling
- [ ] Unsubscribe management
- [ ] Email templates with variables
- [ ] A/B testing support
- [ ] Analytics dashboard
