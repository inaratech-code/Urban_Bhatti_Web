# WhatsApp Business API Setup Guide

To enable WhatsApp notifications for orders, you need to set up a WhatsApp Business API account and get the required credentials.

## Step 1: Create a Meta Business Account

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Create a business account (if you don't have one)
3. Verify your business

## Step 2: Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as the app type
4. Fill in your app details:
   - App Name: `Urban Bhatti Restaurant`
   - Contact Email: Your email
   - Business Account: Select your business account
5. Click **"Create App"**

## Step 3: Add WhatsApp Product

1. In your app dashboard, go to **"Add Products"**
2. Find **"WhatsApp"** and click **"Set Up"**
3. Follow the setup wizard

## Step 4: Get Your Phone Number ID

1. In the WhatsApp section of your app, go to **"API Setup"**
2. You'll see **"Phone number ID"** — copy this value
   - Example: `123456789012345`

## Step 5: Get Your Access Token

1. In the same **"API Setup"** section, find **"Temporary access token"**
2. Click **"Generate token"** or copy the existing token
   - **Note**: Temporary tokens expire in 24 hours. For production, you'll need a permanent token.

### For Production (Permanent Token):

1. Go to **"Tools"** → **"Graph API Explorer"**
2. Select your app from the dropdown
3. Add permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. Click **"Generate Access Token"**
5. Copy the token

**OR** use System User Access Token (Recommended for production):
1. Go to **"Business Settings"** → **"System Users"**
2. Create a system user (if needed)
3. Assign WhatsApp permissions
4. Generate a token for the system user

## Step 6: Add Environment Variables

Create or update your `.env.local` file in the `restaurant-web` directory:

```env
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_TO_NUMBER=9864320552
```

**Important**: 
- Never commit `.env.local` to git (it should be in `.gitignore`)
- Replace `your_access_token_here` with your actual access token
- Replace `your_phone_number_id_here` with your actual phone number ID
- `WHATSAPP_TO_NUMBER` is optional (defaults to 9864320552)

## Step 7: Verify Phone Number

1. In WhatsApp Business API dashboard, go to **"Phone Numbers"**
2. Add and verify your business phone number
3. This is the number that will receive order notifications

## Step 8: Test

1. Restart your Next.js development server:
   ```bash
   npm run dev
   ```
2. Place a test order
3. Check the server console for:
   - `[WhatsApp] Order notification sent successfully` ✅
   - OR error messages if something is wrong

## Troubleshooting

### "Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID"
- Make sure `.env.local` exists in `restaurant-web/` directory
- Verify the variable names are exactly as shown (case-sensitive)
- Restart your dev server after adding variables

### "Failed to send order notification"
- Check if your access token is valid (not expired)
- Verify phone number ID is correct
- Check WhatsApp Business API status in Meta dashboard
- Ensure your phone number is verified

### Token Expired
- Temporary tokens expire in 24 hours
- Generate a new token or set up a permanent token (see Step 5)

## Alternative: Use WhatsApp Cloud API (Free Tier)

Meta offers a free tier for WhatsApp Business API:
- 1,000 conversations per month free
- Perfect for small businesses
- Same setup process as above

## Need Help?

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Help Center](https://www.facebook.com/business/help)

