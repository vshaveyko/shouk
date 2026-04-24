# Pending Bugs — from Google Doc (1lZAmYsObvd9HquEJsCVCr304QqMPt1hShHtODxRO7h8)

Source: https://docs.google.com/document/d/1lZAmYsObvd9HquEJsCVCr304QqMPt1hShHtODxRO7h8/edit
Parsed: 2026-04-23
Next tracker IDs would start at SHK-053 (last used: SHK-052).
Re-parsed 2026-04-23 and added SHK-044 — SHK-052.

Columns mirror the tracker Bugs sheet:
ID | Type | Feature Area | Title | Description | Priority | Status

---

## SHK-019
- **Type**: Enhancement
- **Feature Area**: Authentication
- **Title**: Remove email/password signup; auth exclusively via OAuth
- **Description**: Remove login creation experience. Everything should go through OAuth authorization. Open question: how does this work for users in a WhatsApp group who lack Gmail, Instagram, or Facebook accounts?
- **Priority**: High
- **Status**: Open

## SHK-020
- **Type**: Enhancement
- **Feature Area**: Listing Creation
- **Title**: Kill dynamic listing schema; hardcode watch form for V1
- **Description**: Drop the per-marketplace listing schema for V1. Build a single watches form with Brad. Mandatory: Price, Images, Title. Optional: Description, Brand, Model, Case Size, Dial Color, Case Material, Box, Papers, etc.
- **Priority**: High
- **Status**: Open

## SHK-021
- **Type**: Enhancement
- **Feature Area**: Marketplace Setup
- **Title**: Add marketplace type selector (Private, Closed, Public)
- **Description**: Marketplace type is missing from the creation flow. Add three options: Private, Closed, Public.
- **Priority**: High
- **Status**: Open

## SHK-022
- **Type**: Enhancement
- **Feature Area**: Owner Admin
- **Title**: Hide Activity tab under owner marketplace section for V1
- **Description**: Activity is a great feature for C2C group admins (e.g. Moda). For B2B, it may be viewable to everyone or behind a paywall. Hide entirely for V1.
- **Priority**: Medium
- **Status**: Open

## SHK-023
- **Type**: Enhancement
- **Feature Area**: Owner Admin
- **Title**: Hide Billing under owner Marketplaces for V1
- **Description**: Billing section under Marketplaces should be hidden in V1.
- **Priority**: Medium
- **Status**: Open

## SHK-024
- **Type**: Enhancement
- **Feature Area**: Owner Admin
- **Title**: Remove Payouts from owner Marketplaces
- **Description**: Payouts can be removed from under Marketplaces.
- **Priority**: Medium
- **Status**: Open

## SHK-025
- **Type**: Enhancement
- **Feature Area**: Owner Admin / Applications
- **Title**: Remove "0 pending. Owners typically approve ~70% of qualified applicants." copy
- **Description**: Remove that copy/line under the Applications section.
- **Priority**: Low
- **Status**: Open

## SHK-026
- **Type**: Enhancement
- **Feature Area**: Owner Admin
- **Title**: Remove Share Marketplace button (top right)
- **Description**: Get rid of the Share Marketplace feature on the top right.
- **Priority**: Low
- **Status**: Open

## SHK-027
- **Type**: Enhancement
- **Feature Area**: Listings
- **Title**: Remove auctions for V1 (C2C-only feature)
- **Description**: Auctions are out of scope for V1. This is exclusively a C2C feature.
- **Priority**: High
- **Status**: Open

## SHK-028
- **Type**: Bug
- **Feature Area**: Navigation
- **Title**: Clicking "Shouks" logo does nothing
- **Description**: Clicking the Shouks brand/logo does not navigate to the homepage; click does nothing.
- **Priority**: Medium
- **Status**: Open

## SHK-029
- **Type**: Bug
- **Feature Area**: Authentication
- **Title**: Login session does not persist across visits to shouks.com
- **Description**: Being logged in doesn't seem to persist. When logged in and then loading shouks.com, it shows the generic landing page with "Get started" and "Log in".
- **Priority**: Critical
- **Status**: Open

## SHK-030
- **Type**: Bug
- **Feature Area**: Navigation
- **Title**: Marketplace dropdown (top left) is broken — selection sticks
- **Description**: The marketplace dropdown on the top left is broken. The selection stays, making it impossible to navigate home unless you click "Discover Marketplaces". Then you can go to explore, but the previous marketplace still shows as selected.
- **Priority**: High
- **Status**: Open

## SHK-031
- **Type**: Bug
- **Feature Area**: Authentication / Identity Verification
- **Title**: Verify identity / account linking flow is broken after Google auth
- **Description**: Verify your identity / linking doesn't work. After authing in with Google, the system didn't recognize that, and when clicking, the whole experience is broken.
- **Priority**: Critical
- **Status**: Open

## SHK-032
- **Type**: Bug
- **Feature Area**: Authentication / Identity Verification
- **Title**: Unverified Google account later appears as verified with hallucinated email
- **Description**: Even though verifying Google doesn't work, clicking later shows that you are verified with some hallucinated email account.
- **Priority**: Critical
- **Status**: Open

## SHK-033
- **Type**: Bug
- **Feature Area**: Authentication / Identity Verification
- **Title**: Phone SMS verification does not send the code
- **Description**: Phone SMS does not send the code.
- **Priority**: Critical
- **Status**: Open

## SHK-034
- **Type**: Bug
- **Feature Area**: Navigation
- **Title**: Marketplaces I created appear twice in the dropdown
- **Description**: Sometimes marketplaces I created appear twice in the marketplaces dropdown.
- **Priority**: High
- **Status**: Open

## SHK-035
- **Type**: Bug
- **Feature Area**: Authentication / Applications
- **Title**: Linking Google during apply-to-marketplace logs user out, creates dummy account
- **Description**: When linking your Google account while trying to apply to a marketplace, it doesn't link properly. Then when you try to go to the home page it immediately logs you out. Logging back in now has your Google account linked so you can apply after — but it's a dummy account.
- **Priority**: Critical
- **Status**: Open

## SHK-036
- **Type**: Bug
- **Feature Area**: Notifications / Messaging
- **Title**: Messages badge mirrors Notifications badge even when inbox is empty
- **Description**: Messages notifications is tied to the notifications badge. If notifications has 3 pings, then so does messages, even though there isn't anything in messages.
- **Priority**: High
- **Status**: Open

## SHK-037
- **Type**: UX Issue
- **Feature Area**: App Shell / Navigation
- **Title**: App UX is overly fitted to groups the user created
- **Description**: The whole UX in the app is a bit strange — it's overly fitted to groups you create. What group would it default to if you created multiple? What if you are just a member of multiple groups?
- **Priority**: Medium
- **Status**: Open

## SHK-038
- **Type**: Bug
- **Feature Area**: Authentication
- **Title**: Signing in with a second Gmail lands in the first account's session
- **Description**: I can't auth in with my other Gmail account. When I use a different account and successfully sign in, I'm actually signed into my first email account.
- **Priority**: Critical
- **Status**: Open

## SHK-039
- **Type**: Bug
- **Feature Area**: Applications
- **Title**: Reply to "needs more info" creates a second application instead of updating the original
- **Description**: After a user replies to a marketplace creator that requested more info on their application, it shows as a second application. Instead, it should show as the same application with more information.
- **Priority**: High
- **Status**: Open

## SHK-040
- **Type**: Bug
- **Feature Area**: Notifications
- **Title**: Notifications only refresh on tab change, not in real-time
- **Description**: Notifications refreshes only when you click a new tab. Being on one screen and waiting does not update.
- **Priority**: Medium
- **Status**: Open

## SHK-041
- **Type**: Enhancement
- **Feature Area**: Listings / Moderation
- **Title**: Remove listing moderation for V1 (C2C-only feature)
- **Description**: Listing moderation is not needed for V1. This is more of a C2C feature.
- **Priority**: Medium
- **Status**: Open

## SHK-042
- **Type**: Enhancement
- **Feature Area**: Marketplace Setup
- **Title**: Add "open/public join" option to marketplace access modes
- **Description**: When creating a marketplace there is no option for just being able to join a public marketplace — it is only application, link, or referral. Needs a 4th option.
- **Priority**: High
- **Status**: Open

## SHK-043
- **Type**: Bug
- **Feature Area**: Navigation
- **Title**: Marketplaces list doubles on every tab except Home
- **Description**: Double marketplace — anytime you tab a different tab other than the home one ("Shouks with icon"), your marketplaces will show two times. The home icon will only show one marketplace; everywhere else will be two.
- **Priority**: High
- **Status**: Open

## SHK-044
- **Type**: Bug
- **Feature Area**: Notifications / Email
- **Title**: Email notifications do not work
- **Description**: Transactional / notification emails don't go out. No provider wired up — renderEmailHtml exists but is never posted to a sender.
- **Priority**: High
- **Status**: Open

## SHK-045
- **Type**: Bug
- **Feature Area**: Navigation
- **Title**: Home icon for multi-marketplace owners routes to first-created marketplace
- **Description**: When having two marketplaces, the home icon sends you to the first marketplace you created, even if you have the other one open.
- **Priority**: High
- **Status**: Open

## SHK-046
- **Type**: Bug
- **Feature Area**: Listing Creation
- **Title**: Adding images to listings requires a picsum URL
- **Description**: Uploading images doesn't work — only picsum URLs pasted by hand render. Needs a real upload path or a clearer affordance.
- **Priority**: High
- **Status**: Open

## SHK-047
- **Type**: Bug
- **Feature Area**: Listings
- **Title**: Edit listing button takes you to a 404 error
- **Description**: The edit button routes to a page that returns 404.
- **Priority**: High
- **Status**: Open

## SHK-048
- **Type**: Bug
- **Feature Area**: Listings
- **Title**: Close listing action has no effect
- **Description**: Confirmation dialog appears, user chooses Close, nothing happens.
- **Priority**: High
- **Status**: Open

## SHK-049
- **Type**: Bug
- **Feature Area**: Listings
- **Title**: Mark-as-sold action has no effect
- **Description**: Confirmation appears, user chooses Mark as sold, nothing happens.
- **Priority**: High
- **Status**: Open

## SHK-050
- **Type**: Bug
- **Feature Area**: Listings
- **Title**: Listings do not appear in the marketplace after publish
- **Description**: Published listings aren't visible in the marketplace feed.
- **Priority**: Critical
- **Status**: Open

## SHK-051
- **Type**: Bug
- **Feature Area**: Navigation
- **Title**: Picking a member-only marketplace in switcher redirects to an owned one
- **Description**: You can only open marketplaces you own from the switcher. Selecting a marketplace you're merely a member of routes you into a different (owned) marketplace instead of that one's listings page.
- **Priority**: High
- **Status**: Open

## SHK-052
- **Type**: Bug
- **Feature Area**: Profile
- **Title**: Double marketplace bug appears in profile page "Your communities"
- **Description**: The profile page lists each marketplace twice for users who both own and (auto-)belong to it.
- **Priority**: Medium
- **Status**: Open
