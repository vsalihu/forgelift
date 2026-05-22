# ForgeLift

ForgeLift is a smart gym progression app that turns workout logs into ranks, recovery insights, overload recommendations, deload warnings, missions, and monthly reports.

It is built as a full-stack portfolio project with a React/Vite frontend, an Express API, MongoDB persistence, JWT authentication, and a modular calculation engine for training analysis.

## Key Features

- Mobile-first Gym Mode for fast in-session logging
- Workout logging, workout history, and workout detail pages
- Reusable workout templates and recent exercise quick-add
- Expanded seeded exercise library with 100+ movements
- Muscle-group exercise filtering for chest, back, legs, glutes, shoulders, arms, core, full body, and cardio
- Exercise impact profiles for Muscle Load Mapping
- Estimated 1RM and volume calculations
- Personal record detection and PR timeline
- Muscle Load Mapping for direct, indirect, and stabiliser work
- Overall rank, muscle group ranks, and XP
- Recovery Readiness with today's workout recommendation
- Weak Point Detector and Training Balance Score
- Smart Overload Engine for next-session targets
- Strength Baselines for conservative related-exercise starting weights
- ForgeLift Assessment for training-level estimation and baseline setup
- Smart Deload and plateau detection
- Goal Path Missions and Weekly Targets
- Advanced Analytics and Monthly Reports
- Responsive dark dashboard UI with mobile navigation
- Beginner education layer with in-app help tooltips and RPE guide
- Usability polish pass with mobile-first spacing, page loading screen, route transitions, grouped sidebar, improved dashboard, and touch-friendly controls
- Visual UX enhancement layer with progress rings, animated progress bars, glow cards, visual dashboard summaries, richer rank badges, and reduced text-heavy detail sections
- Consistent mobile bottom navigation with a grouped More menu
- Private custom exercise creation with muscle impact percentages
- Interactive mission detail panels and completion animations
- Weekly bodyweight check-ins and bodyweight history tracking
- ForgeLift Guided Tutorial with page-specific Quick Tours

## Visual UX Layer

ForgeLift uses reusable visual components to make training data easier to understand at a glance:

- Circular progress rings for recovery, rank progress, missions, and timers
- Animated progress bars for rank, mission, and weekly target progress
- Status glow cards for success, warning, danger, rank, and neutral states
- Compact stat pills for XP, PRs, warnings, RPE, and recommendation status
- Visual dashboard summary cards for today's training, recovery, missions, deloads, and progress
- Gym Mode visual RPE buttons and rest timer feedback
- Collapsible detail sections so users see the important action first and read the explanation only when needed

## Data Truth Layer

ForgeLift follows a trust rule: no data means no claim, limited data means low confidence, and enough real logged data unlocks stronger recommendations.

Fresh users see readiness actions instead of fake warnings. ForgeLift asks for:

- Bodyweight
- ForgeLift Assessment
- User-entered Strength Baselines
- At least 3 logged workouts
- Coverage across push, pull, and lower-body training

The app now separates:

- No data: explains what is missing
- Limited data: shows that ForgeLift is still learning
- Sufficient data: shows normal recovery, overload, weak point, balance, deload, mission, and analytics recommendations

The demo account still shows rich dashboard data because it is seeded with realistic workouts. A brand-new account starts with honest onboarding/readiness states.

## Data Management

ForgeLift includes a protected Data Management page for safe training-data cleanup.

Users can:

- Delete workout data from a selected date range
- Reset all training/progress data while keeping the account and profile
- Reset strength baselines only

Destructive actions require confirmation:

- Date range deletion requires typing `DELETE`
- Full training reset requires typing `RESET`
- Strength baseline reset requires a confirmation modal

Training resets remove user-owned workouts, PRs, ranks, recovery scores, weak points, training balance, overload recommendations, deload recommendations, missions, weekly targets, streaks, analytics snapshots, and monthly reports. Optional checkboxes can also remove strength baselines, workout templates, and ForgeLift Assessment history.

After date-range deletion, ForgeLift recalculates derived training state from remaining workouts so stale recommendations do not reference deleted data.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Framer Motion
- Recharts
- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- bcrypt password hashing
- Helmet, CORS, and auth rate limiting

## Screenshots

Add screenshots here before publishing the portfolio:

- Dashboard
- Gym Mode
- Smart Overload
- Recovery
- Ranks
- Monthly Reports

## Demo Login

After running the demo seed:

- Email: `demo@forgelift.app`
- Password: `Demo123!`

The demo account includes realistic seeded workouts, templates, PRs, ranks, recovery scores, weak points, overload recommendations, deload warnings, missions, analytics, and a monthly report.

## ForgeLift Assessment

The ForgeLift Assessment appears after onboarding and is always available from Profile. It asks about training history, weekly frequency, gym confidence, goal path, optional current lifts, and cautious limitation areas.

When saved, the assessment:

- Estimates the user's training level as Beginner, Intermediate, or Advanced
- Calculates confidence based on lift data and profile completeness
- Creates user-entered Strength Baselines from known lifts
- Generates conservative related-exercise estimates through the existing baseline estimator
- Updates the user's goal path and training experience
- Stores a summary so users can retake the assessment later

Real workout history still takes priority. Assessment baselines are starting points for recommendations, not guaranteed numbers and not a shortcut to inflated ranks.

## Local Setup

Clone the project and install dependencies:

```bash
cd forgelift/server
npm install

cd ../client
npm install
```

Create the backend environment file:

```bash
cd ../server
copy .env.example .env
```

Default local backend variables:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/forgelift
JWT_SECRET=replace_this_with_a_secure_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Seed exercises and demo data:

```bash
cd forgelift/server
npm run seed:exercises
npm run seed:demo
npm run test:smoke
```

Run the backend:

```bash
cd forgelift/server
npm run dev
```

Run the frontend:

```bash
cd forgelift/client
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

## Production Build

Frontend:

```bash
cd forgelift/client
npm run build
npm run preview
```

Backend:

```bash
cd forgelift/server
npm start
```

## Deployment Guide

Recommended deployment setup:

- Frontend: Vercel or Netlify
- Backend: Render or Railway
- Database: MongoDB Atlas

Frontend environment variable:

```env
VITE_API_URL=https://your-backend-url.com/api
```

Backend environment variables:

```env
PORT=5000
MONGO_URI=mongodb+srv://your-atlas-uri
JWT_SECRET=use_a_long_secure_secret
CLIENT_URL=https://your-frontend-url.com
NODE_ENV=production
```

If you allow both local and deployed frontends during testing, `CLIENT_URL` can be a comma-separated list:

```env
CLIENT_URL=http://localhost:5173,https://your-frontend-url.com
```

## API Overview

Major API route groups:

- `/api/auth` - register and login
- `/api/users` - current user, profile, onboarding
- `/api/bodyweight` - weekly bodyweight check-ins and bodyweight history
- `/api/tutorials` - page tutorial progress and reset actions
- `/api/exercises` - exercise library and custom exercises
- `/api/workouts` - workout logging, history, detail, recent exercises
- `/api/workout-templates` - user workout templates
- `/api/personal-records` - PR timeline and summaries
- `/api/ranks` - overall and muscle group ranks
- `/api/recovery` - recovery scores and today's recommendation
- `/api/strength-baselines` - user-entered main lift baselines and related exercise estimates
- `/api/weak-points` - weak point detection
- `/api/training-balance` - training balance score
- `/api/overload` - Smart Overload recommendations
- `/api/deload` - plateau and deload recommendations
- `/api/missions` - weekly missions and targets
- `/api/advanced-analytics` - charts and progress insights
- `/api/monthly-reports` - monthly reports

## Project Architecture

ForgeLift is split into two apps:

- `client/` contains the React/Vite frontend, shared UI components, pages, route-based code splitting, services, hooks, and context.
- `server/` contains the Express API, Mongoose models, route controllers, authentication middleware, validation helpers, and calculation utilities.

Most feature logic is kept in backend utilities so workout analysis, ranks, recovery, overload, deload, missions, and reports can be reused consistently across routes.

## Exercise Database

ForgeLift includes an expanded default exercise database covering chest, back, legs, glutes, hamstrings, shoulders, arms, core, full body, and cardio/conditioning work.

Each seeded exercise includes:

- category
- exercise type
- equipment
- difficulty
- movement pattern
- primary muscles
- secondary muscles
- stabiliser muscles
- default rep range
- overload increment
- impact profile

Impact profiles are used by Muscle Load Mapping to understand direct, indirect, and stabiliser training load. For example, Bench Press primarily loads Chest while also indirectly loading Front Shoulders and Triceps. Those indirect loads later inform recovery, weak point detection, training balance, overload recommendations, and deload warnings.

Seed or refresh the default exercise database:

```bash
cd forgelift/server
npm run seed:exercises
```

## Strength Baselines

Strength Baselines let users enter known numbers for main lifts such as Bench Press, Squat, Deadlift, Overhead Press, Barbell Row, Pull-up, Hip Thrust, and Romanian Deadlift.

ForgeLift uses the entered weight and reps to calculate an estimated 1RM, then generates conservative starting estimates for related exercises. For example, a Bench Press baseline can estimate starting points for Incline Bench Press, Dumbbell Bench Press, Close-Grip Bench Press, Chest Press Machine, and fly variations.

Confidence levels are intentionally conservative:

- High: very similar movement pattern
- Medium: related compound movement
- Low: accessory, isolation, machine-variable, or bodyweight movement

These estimates are used for starting recommendations in Workout Logger, Gym Mode, and Smart Overload when no real workout history exists. They are not used to inflate ranks. Real workout history should always take priority once the user logs the exercise.

User-facing warning:

```text
These are estimated starting points based on your entered strength baseline. Adjust them based on your real performance.
```

## Beginner Help Layer

ForgeLift includes beginner-friendly education directly in the app:

- Question mark help icons beside terms like RPE, estimated 1RM, volume, recovery, indirect load, deload, overload, weak points, training balance, ranks, XP, missions, and strength baselines.
- Desktop hover and mobile tap support for compact explanation popovers.
- RPE guide explaining RPE 6 through RPE 10 in plain language.
- Larger beginner tip boxes on key pages such as Workout Logger, Gym Mode, Recovery, Smart Overload, Deload, and Strength Baselines.
- Profile setting to hide larger beginner tips while keeping help icons available.

This lets new lifters understand the training terms without leaving the page.

## Usability And Mobile Polish

ForgeLift includes a final usability optimisation pass focused on mobile comfort and portfolio presentation:

- Global ForgeLift page loader for auth checks and lazy-loaded routes
- Subtle page transitions with Framer Motion
- Consistent page container spacing across mobile, tablet, and desktop
- Larger touch-friendly buttons and inputs
- Grouped desktop sidebar with independent scrolling
- Mobile bottom navigation with Dashboard, Gym Mode, Log, Missions, and a grouped More sheet
- Mobile More menu for Training, Intelligence, Progress, and Account pages
- Dashboard reorganised into Today, Quick Status, Action Required, Progress, and Recent Activity
- Gym Mode mobile improvements with larger current exercise focus and sticky finish action
- Workout Logger mobile set cards and larger save controls
- Exercise Library mobile horizontal filter chips
- Improved loading skeleton, error state, and empty state components

## Navigation And Custom UI

ForgeLift keeps authenticated navigation consistent on mobile and desktop:

- Desktop sidebar groups pages into Main, Training, Intelligence, Progress, and Account sections.
- Mobile bottom navigation stays visible on main authenticated pages and uses safe-area padding.
- The More tab opens a custom bottom sheet instead of a basic browser dropdown.
- Shared custom controls support search inputs, horizontal filter chips, segmented controls, action sheets, and bottom sheets.

## ForgeLift Guided Tutorial

ForgeLift includes a reusable guided tutorial system for page-specific onboarding.

The tutorial layer supports:

- Quick Tour launch buttons on major authenticated pages
- animated dark overlay and highlighted target areas
- step cards with Next, Back, Skip, Finish, and Don't show again controls
- mobile bottom-sheet style tutorial cards that avoid the bottom nav
- backend-persisted progress per user and page
- Profile action to reset all tutorials

Dashboard and Gym Mode can auto-start for users who have not completed or recently skipped those tours. Other pages expose the tutorial through the Quick Tour button so users can learn the page without being interrupted.

## Custom Exercises

Users can create private custom exercises when a movement is missing from the default database.

Custom exercises include:

- name, category, type, equipment, difficulty, and instructions
- broad muscle groups
- primary, secondary, and stabiliser muscles
- adjustable impact percentages from 0 to 100

Custom exercises appear in the Exercise Library and Exercise Picker, can be used in Gym Mode, Workout Logger, and templates, and feed the same muscle load mapping pipeline as default ForgeLift exercises. Users can edit or delete only their own custom exercises; default seeded exercises remain global and protected.

## Missions UX

Missions include richer interaction:

- mission detail panels with why the mission was generated
- progress breakdown, XP reward, target muscles, and deadline context
- quick actions such as starting a related workout or opening the exercise library
- grouped completion animation when missions are completed

## Weekly Bodyweight Tracking

ForgeLift prompts users weekly to update bodyweight. Bodyweight entries help keep bodyweight exercise logging, strength ratios, ranks, analytics, and reports more accurate.

Bodyweight tracking includes:

- Dashboard weekly check-in card when no entry exists for the current week
- Profile bodyweight section with current bodyweight and history chart
- bodyweight entry source tracking for manual updates, weekly prompts, and profile updates
- historical workout sets keep their original `bodyweightUsed` even if the profile bodyweight changes later

## Smarter Workout Logging

Workout Logger and Gym Mode support faster, more visual exercise logging:

- Bodyweight exercises can be logged with a Bodyweight only toggle.
- Bodyweight-only sets use the user's profile bodyweight as the training load.
- Weighted bodyweight sets store bodyweight, added load, and total load separately.
- Example: an 82kg user logging Pull-Up +10kg stores bodyweightUsed 82, addedLoad 10, and totalLoad/weight 92.
- The exercise picker includes search, muscle-group filters, exercise type/equipment/difficulty filters, recent exercises, and Smart Overload suggestions.
- Exercise picker cards show primary, secondary, and stabiliser muscle impact percentages with visual bars.
- Add Set stays disabled until the required set data is entered.
- Add Set pre-fills the next set from the previous set so repeated working sets can be logged quickly.
- Smart Overload treats bodyweight exercises differently: it prioritises reps and control first, then small added-load jumps when appropriate.

Gym Mode has also been refined into a live-session view:

- The full exercise list stays visible, with compact cards for every exercise in the current workout.
- Tapping an exercise makes it the current exercise and expands its set controls.
- Next Exercise moves to the next exercise already in the list, or opens the exercise picker when the user is at the end.
- Current Exercise scrolls back to the active card if the user has moved around the page.
- Reset clears only the unsaved Gym Mode draft after confirmation; saved workouts are not touched.
- Local draft restore keeps the workout title, notes, active exercise, bodyweight set fields, and current set inputs.
- Mobile Gym Mode uses its own sticky action bar for Add Exercise, Current Exercise, and Finish.

## Broad And Detailed Muscle Taxonomy

ForgeLift supports a two-level muscle system:

- Broad groups for beginner-friendly filtering and summaries: Chest, Back, Legs, Shoulders, Arms, Glutes, Core, Full Body, and Cardio.
- Detailed muscles for advanced exercise targeting: Quads, Hamstrings, Brachialis, Brachioradialis, Biceps Long Head, Biceps Short Head, Triceps heads, Front/Side/Rear Delts, Lats, Upper/Mid/Lower Chest, Upper/Mid/Lower Back, Rhomboids, Abs, Obliques, and more.

The exercise library and exercise picker include broad filters plus an expandable advanced muscle filter section. Searches such as `Quads`, `Brachialis`, `Biceps Short Head`, and `Side Delts` return relevant movements with impact percentage bars.

Muscle names are normalised for backwards compatibility. Older names like Front Shoulders and Rear Shoulders are mapped to Front Delts and Rear Delts, while broad systems such as recovery, ranks, and training balance continue to work from broad muscle groups. Re-run the exercise seed after pulling these changes:

```bash
cd forgelift/server
npm run seed:exercises
```

The default exercise database now includes 180 exercises, with added detail coverage for Abductors, Adductors, Tibialis, Hip Flexors, Rotator Cuff, Rhomboids, Teres Major, Inner/Lower Chest, biceps heads, triceps heads, and delt regions. Filter chips show counts and hide empty advanced filters so users do not land on blank tabs.

## Testing And Demo Commands

Backend:

```bash
cd forgelift/server
npm run seed:exercises
npm run seed:demo
npm run test:smoke
npm run dev
```

Frontend:

```bash
cd forgelift/client
npm run build
npm run dev
```

## Future Improvements

- Coach dashboard
- Gym leaderboards
- Wearable integration
- AI form notes
- PDF report export
- Subscription plans
