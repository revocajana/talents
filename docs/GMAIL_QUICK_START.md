# Gmail Setup - Quick Start (5 minutes)

## What You Need
- Gmail account (personal or Google Workspace)
- 2-Step Verification enabled

---

## 🚀 Quick Steps

### Step 1: Get 16-Character App Password (2 min)
1. Go to: https://myaccount.google.com/apppasswords
2. Select: App = **Mail**, Device = **Windows Computer**
3. Click **Generate**
4. Copy the 16-character password: `xxxx xxxx xxxx xxxx`

### Step 2: Update .env File (1 min)
Edit `.env` in project root:
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=http://localhost:5173
```

Replace:
- `your-email@gmail.com` = Your Gmail address
- `xxxx xxxx xxxx xxxx` = The 16-char password from Step 1
- `yourdomain.com` = Your domain (or keep localhost:5173)

### Step 3: Restart Django (1 min)
```bash
# In PowerShell
cd c:\kajana\talents
.venv\Scripts\Activate.ps1
cd backend
python manage.py runserver
```

### Step 4: Test It (1 min)
1. Open: http://localhost:5173/login
2. Click "Forgot password?"
3. Enter your email/username
4. Click "Send Reset Link"
5. **Check your Gmail inbox** - you should see the reset email!

---

## ✅ What Happens When Working

**User clicks "Forgot password?"**
1. Enters email/username
2. System generates secure token
3. **Gmail sends reset email** with link
4. User clicks link → goes to reset password page
5. User sets new password
6. User logs in with new password

---

## 🔧 Common Issues

| Issue | Solution |
|-------|----------|
| "Application-specific password required" | Use 16-char App Password, not Gmail password |
| Email not received | Check spam folder, verify email address spelling |
| "SMTP AUTH extension not supported" | Check firewall allows port 587 |
| Emails end up in spam | Configure SPF/DKIM records (see GMAIL_SETUP.md) |

---

## 📖 Full Guide

For detailed setup, troubleshooting, and production recommendations:
→ Read: `docs/GMAIL_SETUP.md`

---

## Production Checklist

- [ ] Get App Password from Google
- [ ] Update .env with Gmail credentials
- [ ] Test password reset feature
- [ ] Configure SPF/DKIM records for domain
- [ ] Use Google Workspace account (recommended)
- [ ] Monitor email delivery in Gmail
- [ ] Set up monitoring/alerts for bounces
