# Week 11: Push Notifications

The app screen registers the signed-in device's Expo Push Token, saves it in Supabase, sends a test push through a Supabase Edge Function, displays foreground notifications, and routes notification taps to Jelajah, Jadwal, Akun, or this screen.

## Setup

1. Run `week 11/backend/supabase/week11_push_tokens.sql` in the Supabase SQL Editor.
2. Deploy the Edge Function from the repository root:

   ```powershell
   npx supabase --workdir "week 11/backend" functions deploy send-week11-notification --remote YOUR_SUPABASE_PROJECT_REF
   ```

3. Configure Expo push credentials for the EAS project with `npx eas-cli@latest credentials`. Remote push needs FCM credentials on Android and APNs credentials on iOS.
4. Create and install a development build on a physical Android or iOS device:

   ```powershell
   npx eas-cli@latest build --profile development --platform android
   npx eas-cli@latest build --profile development --platform ios
   ```

   Remote push does not work in Expo Go on Android or in the web build.
5. From the repository root, start the existing app with `npx expo start --dev-client`.
6. Sign in, open **Notif**, grant notification permission, and register the device before sending a test notification.

The Supabase Edge Function uses the project's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` server secrets. Never add the service-role key to the mobile app or `.env.local`.
