# Security Specification - MyHR Lazuardi

## Data Invariants
1. An attendance record must belong to a valid user.
2. An employee can only check in/out for themselves.
3. Check-out time must be after check-in time.
4. User profiles can only be created by the user themselves (initial) but roles can only be updated by admins.

## The Dirty Dozen Payloads
1. **Identity Theft**: User A tries to create an attendance record for User B.
2. **Identity Theft**: User A tries to read User B's profile.
3. **Privilege Escalation**: User A tries to update their own role to 'admin'.
4. **Invalid State**: User A tries to check out with a timestamp from 2 days ago.
5. **Ghost Fields**: User A tries to inject `isVerified: true` into their attendance.
6. **Resource Poisoning**: User A uses a 1MB string as a `notes` field.
7. **Negative ID**: User A uses `../..` in a document ID.
8. **PII Leak**: User A tries to list all emails in the `users` collection.
9. **Orphaned Record**: User A creates an attendance record for a non-existent `userId`.
10. **Time Spoofing**: User A provides a client-side `checkIn.time` that isn't the server time.
11. **Check-out Gap**: User A updates check-out without having a check-in.
12. **Admin Spoof**: User A adds `isAdmin: true` to their token metadata (ignored by rules).

## Test Runner (Conceptual)
All tests will be performed using standard Firestore security rules testing patterns.
`permission_denied` should be returned for all 12 malicious payloads.
