# Gmail/Google Workspace Email Setup Guide

## Overview
This guide explains how to configure the Talanta Management System to send password reset emails via Gmail/Google Workspace.

---

## Prerequisites
- A Gmail account (personal) OR
- A Google Workspace account (business email)
- 2-Step Verification enabled on your Google account

---

## Step 1: Enable 2-Step Verification (if not already enabled)

### For Personal Gmail:
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** in the left sidebar
3. Find **2-Step Verification**
4. Click **Get Started** and follow the prompts
5. Confirm with your phone number

### For Google Workspace:
Your admin should have set this up. If not, contact your Google Workspace admin.

---

## Step 2: Generate App Password

### For Personal Gmail:
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. If prompted to sign in, do so
3. You should see a dropdown for "Select the app and device you're using"
4. Select:
   - App: **Mail**
   - Device: **Windows Computer** (or your server OS)
5. Click **Generate**
6. Google will show a 16-character password like: `xxxx xxxx xxxx xxxx`
7. **Copy this password** - you'll need it next

### For Google Workspace:
1. Ask your admin to enable App Passwords in the Admin Console
2. Then follow the personal Gmail steps above
3. Your app password will work with your business email

---

## Step 3: Configure Django

### Option A: Using .env file (Recommended)

1. Open the `.env` file in your project root:
   ```
   c:\kajana\talents\.env
   ```

2. Add or update these lines:
   ```bash
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx
   DEFAULT_FROM_EMAIL=noreply@yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

3. Replace:
   - `your-email@gmail.com` → Your Gmail address
   - `xxxx xxxx xxxx xxxx` → The 16-char password from Step 2
   - `yourdomain.com` → Your actual domain (or localhost:5173 for dev)

### Option B: Environment Variables (Docker/Production)

Set these environment variables:
```bash
export EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
export EMAIL_HOST=smtp.gmail.com
export EMAIL_PORT=587
export EMAIL_USE_TLS=True
export EMAIL_HOST_USER=your-email@gmail.com
export EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx
export DEFAULT_FROM_EMAIL=noreply@yourdomain.com
export FRONTEND_URL=https://yourdomain.com
```

---

## Step 4: Test Email Configuration

### Test in Django Shell:
```bash
cd backend
python manage.py shell

# Send a test email
from django.core.mail import send_mail

send_mail(
    'Test Email from Talanta',
    'This is a test email to verify Gmail SMTP configuration.',
    'noreply@yourdomain.com',
    ['your-personal-email@gmail.com'],
    fail_silently=False,
)
```

You should receive the email within seconds!

### Test Password Reset Feature:
1. Go to login page: `http://localhost:5173/login`
2. Click "Forgot password?"
3. Enter your username/email
4. Click "Send Reset Link"
5. Check your email inbox - you should receive the reset link
6. Click the link to reset your password

---

## Troubleshooting

### "SMTPAuthenticationError: 534, b'5.7.9: Application-specific password required'"
**Problem:** You used your regular Gmail password instead of the App Password
**Solution:** 
- Get a new App Password from [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- Update your `.env` file with the 16-character App Password

### "SMTPAuthenticationError: 535, b'5.7.8: Username and password not accepted'"
**Problem:** Wrong email address or password
**Solution:**
- Double-check `EMAIL_HOST_USER` matches your Gmail account
- Verify the 16-char password was copied correctly (with spaces)
- Ensure 2-Step Verification is enabled

### "SMTPException: SMTP AUTH extension not supported by server"
**Problem:** Firewall blocking Gmail SMTP
**Solution:**
- Check if port 587 is open on your network
- Contact your network administrator
- Try using Gmail on a different network to test

### Email not received
**Problem:** Email delivered but ending up in spam
**Solution:**
- Ask receiver to move email from spam to inbox
- Configure SPF/DKIM records for your domain (improves deliverability)
- Use a professional email domain instead of @gmail.com for `DEFAULT_FROM_EMAIL`

---

## Production Recommendations

### For Better Email Deliverability:

1. **Use a domain email address:**
   - Instead of: `noreply@gmail.com`
   - Use: `noreply@yourdomain.com`
   - Requires SPF/DKIM DNS records

2. **Set up SPF Record:**
   Add to your domain's DNS:
   ```
   v=spf1 include:smtp.google.com ~all
   ```

3. **Set up DKIM:**
   Follow Google's guide: [Enable DKIM for Gmail](https://support.google.com/a/answer/2466563)

4. **Use Google Workspace:**
   - More reliable than personal Gmail
   - Better support
   - Professional appearance
   - Starting at $6/user/month

---

## Security Best Practices

1. **Never commit `.env` file to Git:**
   ```bash
   # Add to .gitignore (should already be there)
   .env
   .env.local
   .env.*.local
   ```

2. **Rotate App Passwords periodically:**
   - Generate new App Password every 90 days
   - Revoke old passwords in Google Account settings

3. **Use separate email for apps:**
   - Don't use your personal Gmail account
   - Consider using a Google Workspace account with a dedicated email like `noreply@company.com`

4. **Monitor email delivery:**
   - Check Gmail sent folder for bounces
   - Set up delivery notifications

---

## Additional Resources

- [Django Email Documentation](https://docs.djangoproject.com/en/6.0/topics/email/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Google App Passwords Help](https://support.google.com/accounts/answer/185833)
- [SPF Records Guide](https://support.google.com/a/answer/33786)

---

## Next Steps

After configuration:
1. ✅ Test password reset feature
2. ✅ Verify emails are received
3. ✅ Test with real user accounts
4. ✅ Monitor delivery in Gmail inbox
5. ✅ Set up SPF/DKIM for production domain
