
# Fix MFA Flow: Authenticate AFTER Code Verification

## Problem

Current flow:
1. User enters email + password
2. `signInWithPassword` is called -- user is NOW authenticated with a valid Supabase session
3. MFA code is sent to email
4. User enters code
5. If valid, proceed

This is broken because:
- The user already has a session before entering the MFA code
- If the page is refreshed during MFA, `mfaPending` resets to `false` and the user is fully logged in without MFA
- The toast "codigo enviado" appears while the user is technically already authenticated

## Solution

New flow:
1. User enters email + password
2. `signInWithPassword` validates credentials (confirms they are correct)
3. IMMEDIATELY call `supabase.auth.signOut()` to destroy the session
4. Send MFA code to email
5. Show MFA verification screen (no active session exists)
6. User enters the 6-digit code
7. `verify-mfa-code` edge function validates the code
8. On success, call `signInWithPassword` AGAIN to create the real session
9. User is now authenticated

## Technical Changes

### File: `src/pages/Auth.tsx`

1. Add `mfaPassword` state to temporarily hold the password during MFA flow (in-memory only, cleared after use)
2. In `handleSignIn`:
   - After successful `signInWithPassword`, call `supabase.auth.signOut()` immediately
   - Store email and password in MFA state
   - Send MFA code
   - Show MFA screen
3. In `handleMFAVerified`:
   - Call `signInWithPassword` again with the stored credentials
   - Clear the stored password from state
   - Show success toast
4. In `handleMFACancel`:
   - Clear all MFA state including stored password
   - No need to call signOut (user is already signed out)
5. Update the guard on line 64: remove the `!mfaPending` check since user won't have a session during MFA

### File: `src/components/MFAVerification.tsx`

- No structural changes needed; the component already handles code input, verification, and resend correctly
- The `onVerified` callback will now trigger the real sign-in in Auth.tsx

### No changes to edge functions

- `send-mfa-code` and `verify-mfa-code` work correctly as-is
- They use `supabaseAdmin` (service role), so they don't depend on the user having an active session

## Security Benefits

- No valid session exists during MFA verification
- Page refresh during MFA returns user to login form (no bypass)
- Password is only held in React state (memory) during the brief MFA window, never persisted
- Password state is cleared immediately after re-authentication or cancellation
