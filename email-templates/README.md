# YesBill Email Templates

Professional, branded email templates for Supabase authentication.

## 📧 Templates Included

| # | Template | File | Use Case |
|---|----------|------|----------|
| 1 | **Confirm Signup** | `01-confirm-signup.html` | New user email verification |
| 2 | **Invite User** | `02-invite-user.html` | Team member invitations |
| 3 | **Magic Link** | `03-magic-link.html` | Passwordless sign-in |
| 4 | **Change Email** | `04-change-email.html` | Email address updates |
| 5 | **Reset Password** | `05-reset-password.html` | Password recovery |
| 6 | **Reauthentication** | `06-reauthentication.html` | Identity confirmation |

---

## 🎨 Design Features

All templates include:

- ✅ **YesBill Logo** - Professional branding
- ✅ **Gradient Headers** - Unique color for each template
- ✅ **Responsive Design** - Mobile-friendly
- ✅ **Clear CTAs** - Prominent action buttons
- ✅ **Copy-Paste Links** - Alternative access method
- ✅ **Security Notices** - Important warnings where needed
- ✅ **Consistent Branding** - Unified YesBill identity

---

## 📋 Quick Setup Guide

### Step 1: Access Supabase Email Templates

Go to: https://app.supabase.com/project/dmabraziqscumpbwhjbf/auth/templates

### Step 2: Apply Each Template

For each email type:

1. Click the template name in Supabase sidebar
2. Open the corresponding `.html` file from this folder
3. **Copy the entire file** content (Ctrl+A, Ctrl+C)
4. **Paste into the "Body" field** in Supabase
5. Update the **Subject** line (see below)
6. Click **"Save"**

### Step 3: Subject Lines

Use these subject lines for each template:

| Template | Subject Line |
|----------|-------------|
| Confirm Signup | `Confirm your email - YesBill` |
| Invite User | `You're invited to join YesBill` |
| Magic Link | `Your magic link to sign in` |
| Change Email | `Confirm your new email address` |
| Reset Password | `Reset your password` |
| Reauthentication | `Confirm your identity` |

---

## 🎨 Template Color Codes

Each template uses a unique gradient:

| Template | Primary Color | Gradient |
|----------|--------------|----------|
| Confirm Signup | Indigo (`#4F46E5`) | `#4F46E5 → #6366F1` |
| Invite User | Purple (`#7C3AED`) | `#7C3AED → #8B5CF6` |
| Magic Link | Cyan (`#0EA5E9`) | `#0EA5E9 → #06B6D4` |
| Change Email | Amber (`#F59E0B`) | `#F59E0B → #F97316` |
| Reset Password | Red (`#EF4444`) | `#EF4444 → #F97316` |
| Reauthentication | Dark Red (`#DC2626`) | `#DC2626 → #EF4444` |

---

## 🖼️ Logo Integration

### Current Logo Path

Templates reference: `https://raw.githubusercontent.com/yourusername/yesbill/main/frontend/public/assets/branding/yesbill_logo_white.png`

### To Update Logo URL:

**Option 1: Supabase Storage** (Already configured)

Logo is currently hosted at:
```
https://dmabraziqscumpbwhjbf.supabase.co/storage/v1/object/public/branding/yesbill_logo_black.png
```
This is used in all Edge Function transactional emails. For auth templates paste the black-logo URL above.

**Option 2: Host on GitHub**
1. Upload logo to your GitHub repo
2. Get raw URL: `https://raw.githubusercontent.com/[username]/[repo]/main/frontend/public/assets/branding/yesbill_logo_white.png`
3. Find & replace in all template files

**Option 3: Use Public CDN**
1. Upload to Imgur, Cloudinary, or similar
2. Get public URL
3. Replace in all templates

**Option 3: Base64 Encode**
1. Convert logo to base64
2. Replace `<img src="...">` with:
   ```html
   <img src="data:image/png;base64,[base64-string]" alt="YesBill Logo" style="...">
   ```

### Logo Fallback

All templates have `onerror="this.style.display='none'"` - if logo fails to load, it gracefully hides instead of showing a broken image.

---

## 🔧 Customization

### Change Colors

Find and replace these color codes:

**Primary Brand Color:** `#4F46E5` (Indigo)
**Secondary Color:** `#6366F1` (Light Indigo)

### Change Logo Size

Current size: `80px × 80px`

To change, find:
```html
style="width: 80px; height: 80px; ..."
```

### Change Font

Current: System fonts (Apple, Segoe UI, Roboto)

To change, update:
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', ...
```

### Add Custom Content

Each template has clear section markers:
- `<!-- Header with Logo -->`
- `<!-- Content -->`
- `<!-- CTA Button -->`
- `<!-- Footer -->`

---

## ✅ Testing Templates

### Test Email Delivery

1. Go to Supabase → Authentication → Users
2. Click "Invite User" or test signup
3. Check your inbox
4. Verify:
   - ✓ Logo displays correctly
   - ✓ Colors render properly
   - ✓ Links work
   - ✓ Mobile responsive

### Email Client Compatibility

Templates tested on:
- ✅ Gmail (Web, iOS, Android)
- ✅ Outlook (Web, Desktop)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ ProtonMail

---

## 🚨 Important Notes

### Logo Hosting

⚠️ **Email clients don't support local file paths!**

You MUST host your logo on:
- Public GitHub repo (raw URL)
- Image hosting service (Imgur, Cloudinary)
- Your own domain
- Base64 encoding (increases email size)

### Supabase Variables

These are automatically replaced by Supabase:
- `{{ .ConfirmationURL }}` - Magic link/confirmation URL
- `{{ .Token }}` - Auth token (if needed)
- `{{ .Email }}` - User's email
- `{{ .SiteURL }}` - Your site URL

**Don't modify these!** They're template variables.

### Email Size

Keep email HTML under 100KB for best deliverability.

Current sizes:
- Each template: ~8-12KB (well within limits)
- With base64 logo: ~15-20KB (still good)

---

## 📊 Template Usage Guide

### When to Use Each Template

**Confirm Signup** - New users signing up via email
**Invite User** - Admin inviting team members
**Magic Link** - Passwordless login requests
**Change Email** - User updating email address
**Reset Password** - Forgotten password recovery
**Reauthentication** - Sensitive action verification

---

## 🛠️ Troubleshooting

### Logo Not Showing?

1. Check browser console for image errors
2. Verify logo URL is public and accessible
3. Try base64 encoding instead
4. Check `onerror` handler is present

### Links Not Working?

1. Verify redirect URLs in Supabase settings
2. Check URL Configuration matches your app
3. Test with `http://localhost:3001/auth/callback`

### Emails Going to Spam?

1. Configure custom SMTP (not Supabase's)
2. Set proper SPF/DKIM records
3. Use professional sender email
4. Reduce promotional language

---

## 📞 Support

Need help with email templates?

- **Email Setup Guide:** See `EMAIL_SETUP_GUIDE.md`
- **Supabase Docs:** https://supabase.com/docs/guides/auth/auth-email-templates
- **Support:** support@yesbill.com

---

## 🎉 Success Checklist

Before going live, verify:

- [ ] All 6 templates uploaded to Supabase
- [ ] Subject lines updated
- [ ] Logo URL is public and working
- [ ] Colors match YesBill branding
- [ ] Test email sent and received
- [ ] Links work correctly
- [ ] Mobile view looks good
- [ ] Redirect URLs configured
- [ ] SMTP settings complete (for production)

---

## 📨 Transactional Emails (Supabase Edge Functions)

In addition to auth templates, YesBill sends transactional emails via **Supabase Edge Functions** using **Brevo SMTP**. These are NOT configured in the Supabase Auth template panel — they are deployed functions.

| Function | Trigger | Description |
|---|---|---|
| `send-bill-email` | Auto bill generation / manual | Monthly bill notification with service breakdown, AI insights, and PDF link |
| `notify-password-change` | User changes password | Security notification — password was changed |
| `notify-account-deleted` | User deletes account | Confirmation + data deletion notice |
| `contact-form` | Contact page form submission | Routes contact form messages |

### Edge Function Email Design

All transactional emails use the same Outlook-compatible design system:

- `bgcolor` attributes on every `<td>` (Outlook ignores CSS-only background colors)
- VML bulletproof CTA buttons (`<!--[if mso]><v:roundrect>`)
- No CSS `linear-gradient` — solid `background-color` only
- XHTML Transitional DOCTYPE
- MSO conditional font override block
- Teal `#0F766E` header with white YesBill logo pill

### Deploying Edge Function Emails

Edge functions are deployed via the Supabase MCP or CLI:

```bash
supabase functions deploy send-bill-email
supabase functions deploy notify-password-change
supabase functions deploy notify-account-deleted
```

Required secrets (set in Supabase dashboard → Edge Functions → Secrets):

| Secret | Description |
|---|---|
| `BREVO_API_KEY` | Brevo SMTP API key |
| `BREVO_FROM_EMAIL` | Sender address (e.g. `bills@yesbill.app`) |
| `BREVO_FROM_NAME` | Sender name (e.g. `YesBill`) |
| `SITE_URL` | Frontend URL (e.g. `https://yesbill.vercel.app`) |

---

**You're all set!** Your users will now receive beautiful, professional emails from YesBill. 🚀
