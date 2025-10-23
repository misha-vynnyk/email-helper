# SendGrid Setup for Email Sending on Render

## 🚫 Why SendGrid?

**Render blocks SMTP ports** (587, 465) on free tier to prevent spam. Direct SMTP connections timeout with `ETIMEDOUT` error.

**Solution:** Use SendGrid API which works over HTTPS (port 443) - never blocked.

---

## 📝 Setup Steps

### 1. Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com)
2. Sign up for free account (100 emails/day free)
3. Verify your email

### 2. Create API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `EmailHelper Production`
4. Permissions: **Full Access** or **Mail Send** only
5. Copy the API key (you'll only see it once!)

### 3. Verify Sender Email

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your email and details
4. Check your email for verification link
5. Click to verify

### 4. Configure Render

1. Go to Render Dashboard → your backend service
2. **Environment** tab
3. Add environment variables:

```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_VERIFIED_SENDER=your-verified-email@example.com
```

4. Click **Save Changes**
5. Service will automatically redeploy

---

## ✅ Testing

After deployment, send a test email from your app. Check Render logs:

```
✅ SendGrid initialized
📧 Email send request received
📬 Using SendGrid API
✅ Email sent via SendGrid
```

---

## 🔄 Fallback to SMTP

If SendGrid is not configured, the backend automatically falls back to SMTP (works locally with your Gmail credentials).

**Local dev:** SMTP works ✅  
**Render production:** SendGrid required ⚠️

---

## 📊 SendGrid Free Tier

- **100 emails/day** free forever
- **2,000 contacts**
- All essential features
- Email validation
- Analytics

---

## 🔗 Resources

- [SendGrid Docs](https://docs.sendgrid.com/)
- [Node.js SendGrid Guide](https://docs.sendgrid.com/for-developers/sending-email/quickstart-nodejs)
- [Sender Verification](https://docs.sendgrid.com/ui/sending-email/sender-verification)

