# Architecture Cleanup & Refactor Analysis

Based on the requested objectives, an exhaustive review of the project directory was performed. Below are the findings and a safe, step-by-step strategy for migrating to a strict domain-driven Service Layer Architecture.

## 1. Unused Files to Remove
The following files are either complete duplicates (copied from previous projects) or completely unreferenced in the frontend and API pathways:
- `src/app/api/auth/send-otp/route.ts` (Dead API route)
- `src/app/api/auth/verify-otp/route.ts` (Dead API route)
- `src/models/Participant.ts` (Shadow user model completely replaced by `User.ts`)
- `src/lib/ratelimit.ts` (Only used by dead routes)
- `src/lib/sendoxi-otp.ts` (Duplicate OTP logic; the real OTP logic is in `otpService.ts`)
- `src/lib/session.ts` (Duplicate wrapper; the real session handler is `lib/auth.ts`)
- `src/services/auth.service.ts` (Created but never imported)
- `src/services/prediction.service.ts` (Created but never imported)

## 2. Unused APIs
- `/api/auth/send-otp`
- `/api/auth/verify-otp`
*Note: The frontend is safely utilizing `/api/auth/login`, `/api/auth/register`, and `/api/auth/verify`. Removing the dead variants will not break working authentication.*

## 3. Unused npm Packages
A dependency diagnostic check confirms that all production packages (`mongoose`, `jose`, `zod`, `dotenv`) are actively utilized. `depcheck` flags tailwind dependencies as unused, but that is a false positive based on Next.js 15+ / Tailwind v4's new `@tailwindcss/postcss` build pipeline.

## 4. Refactored Folder Structure
To align with a clean Domain-Driven Design (DDD), the application should be structured as follows:

```text
src/
├── app/
│   ├── api/
│   │   ├── admin/       (Admin panel analytics, config)
│   │   ├── auth/        (Login, Register, Session)
│   │   ├── matches/     (Match lifecycle, fetching timelines)
│   │   ├── predictions/ (Submitting and retrieving user picks)
│   │   └── questions/   (PROPOSED: For separating Match data from Prediction prompts)
├── services/
│   ├── AuthService.ts
│   ├── MatchService.ts
│   ├── PredictionService.ts
│   └── QuestionService.ts
├── models/
│   └── (Corresponding Data Models)
```

## 5. Suggested Service Layer Architecture & Logic Consolidation
Currently, business logic is scattered inside Next.js API Routes (e.g., `app/api/predictions/route.ts`). This makes the code untestable and heavily coupled. 

**Refactoring Plan:**
1. **Move Business Logic Out**: 
   All `POST`/`GET` route handlers will become thin wrappers that simply validate `zod` schemas and call `PredictionService.submitPrediction({ ... })`.
2. **Prediction Lockdown Logic**: 
   The 15-minute start lockdown is partially defined in `MatchCard.tsx` (frontend) and `app/api/predictions/route.ts` (backend). This check will be centralized inside `PredictionService.validateLockout(matchId)`.
3. **OTP and Auth Consolidation**:
   Move session generation and OTP verification completely into `AuthService.ts` so the `/api/auth/verify` route drops from 60 lines to 15.

## 6. Recommended MongoDB Indexes
To support scaling and ensure fast query execution, the following indexes should be explicitly defined in the Mongoose schemas:

- **Match Model**: `MatchSchema.index({ status: 1, startTime: 1 })`
  *Reason: Used frequently by the frontend to fetch "Upcoming/Live" matches.*
- **Prediction Model**: `PredictionSchema.index({ userId: 1, matchId: 1 }, { unique: true })`
  *Reason: Prevents race-condition duplicate inserts (Already implemented correctly).*
- **User Model**: `UserSchema.index({ phone: 1 }, { unique: true })`
  *Reason: Optimizes login lookups.*
- **OtpStore Model**: `OtpStoreSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 })`
  *Reason: Auto-clean expired OTPs.*
