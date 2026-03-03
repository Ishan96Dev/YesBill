---
id: creating-account
title: Creating Your Account
sidebar_position: 1
---

# Creating Your Account

YesBill uses Supabase Auth for secure sign-up and login. You can register with your email and password or sign in with Google.

## The Login Screen

![YesBill login screen](/img/screenshots/Login-01.png)

When you first visit the YesBill app, you'll land on the login screen. From here you can sign in with an existing account or navigate to sign up.

## Sign Up with Email

![YesBill sign up screen](/img/screenshots/Sign-up-01.png)

1. Visit the YesBill app at [ishan96dev.github.io/YesBill](https://ishan96dev.github.io/YesBill/)
2. Click **Sign Up** on the login page
3. Enter your **email address** and choose a **strong password**
   - Password must contain at least one uppercase letter, lowercase letter, number, and symbol
4. Click **Create Account**
5. Check your inbox for a **confirmation email** from YesBill
6. Click the confirmation link to verify your email address

### Confirmation Email

![Confirmation email from YesBill](/img/screenshots/Confirm-Signup-Mail-01.png)

After registering, you'll receive an email like the one above. Click the **Confirm your email** button to activate your account. Check your spam folder if it doesn't arrive within a few minutes.

## Sign In with Google (SSO)

YesBill supports Single Sign-On (SSO) via Google. No password is needed — Google authenticates you directly.

### Step 1 — Click Continue with Google

![Google SSO login — pick an account](/img/screenshots/Login-Signin-using-SSO-01.png)

On the login page, click **Continue with Google**. A Google account picker opens. Select the Google account you want to use.

### Step 2 — Authorise YesBill

![Google SSO login — authorise](/img/screenshots/Login-Signin-using-SSO-02.png)

You may see a permissions screen asking you to authorise YesBill to access your email address. Click **Allow**. You'll be redirected back to YesBill and logged in automatically.

:::tip
SSO accounts don't have a YesBill password. To change your login password, do it from your Google Account settings.
:::

## First Login

After signing in for the first time, you'll be taken through the **Onboarding** flow to set up your profile and optionally configure an AI provider.

:::tip
Use a strong, unique password for your YesBill account. You can change it later from **Settings → Security**.
:::

## Forgot Your Password?

If you can't remember your login password, YesBill provides a secure self-service reset flow.

### Step 1 — Click "Forgot Password"

![Forgot password screen – enter email](/img/screenshots/Forget-Password-01.png)

On the login screen, click the **Forgot password?** link. You'll be taken to the password reset page where you enter your registered email address.

### Step 2 — Submit Your Email

![Forgot password screen – confirmation](/img/screenshots/Forget-Password-02.png)

Enter your email and click **Send Reset Link**. You'll see a confirmation message that a reset email has been sent.

### Step 3 — Check Your Inbox

![Forgot password reset email](/img/screenshots/Forget-Password-email-01.png)

Open the email and click the **Reset Password** button. The link is valid for 24 hours — check your spam folder if it doesn't arrive within a few minutes.

### Step 4 — Set a New Password

![Set new password screen](/img/screenshots/Forget-Password-Set-New-password-01.png)

Enter your new password (and confirm it), then click **Update Password**. You'll be redirected to the login page to sign in with your new credentials.

## Other Login Issues

- **Email not verified?** Check your spam folder for the original confirmation email
- **Account locked?** Contact support at [support@yesbill.com](mailto:ishanrock1234@gmail.com)
