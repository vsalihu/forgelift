# ForgeLift Portfolio Summary

## Project Overview

ForgeLift is a full-stack smart gym progression app that turns workout logging into actionable training guidance. It combines workout tracking, personal records, ranks, recovery readiness, weak point detection, overload recommendations, deload warnings, weekly missions, and monthly reports in one mobile-friendly dashboard.

## Problem Solved

Most gym trackers store workouts but leave users to interpret the data themselves. ForgeLift analyses training history and answers practical questions:

- What should I train today?
- Am I ready to increase weight?
- Which muscles are undertrained?
- Am I building too much fatigue?
- What should I focus on this week?
- Am I progressing month to month?

## My Role

I designed and built the full application foundation:

- React frontend and responsive dashboard UI
- Express API and MongoDB data layer
- JWT authentication and protected routes
- Workout analysis and training intelligence utilities
- Demo data, deployment preparation, and documentation

## Key Technical Features

- Full-stack JavaScript architecture
- Modular Express route/controller/model structure
- Mongoose schemas for workouts, exercises, ranks, recovery, missions, reports, and recommendations
- Route-based frontend code splitting for heavier analytics pages
- Central API service with token handling and expired-session cleanup
- Demo seeding and backend smoke testing scripts
- Production basics with Helmet, CORS configuration, JSON limits, and auth rate limiting

## Backend Features

- Register/login with JWT and bcrypt
- Gender-aware onboarding and editable profile settings
- Exercise library with muscle impact profiles
- Workout persistence with calculated set volume and estimated 1RM
- Personal record detection
- Muscle Load Mapping for direct, indirect, and stabiliser work
- Rank and XP system
- Recovery Readiness calculation
- Weak Point Detector and Training Balance Score
- Smart Overload and Smart Deload engines
- Goal Path Missions and Weekly Targets
- Advanced Analytics and Monthly Reports
- Demo seed and smoke test utilities

## Frontend Features

- Premium dark gym dashboard
- Mobile-first Gym Mode
- Fast workout logger with templates and recent exercises
- Workout history and workout detail pages
- PR timeline
- Ranks page
- Recovery, Weak Points, Training Balance, Overload, Deload, and Missions pages
- Advanced Analytics and Monthly Reports
- Shared UI components for cards, badges, empty states, errors, and loading skeletons
- Mobile bottom navigation and desktop sidebar

## Smart Fitness Logic

ForgeLift uses workout history to generate training insight:

- Estimated 1RM uses the Epley formula.
- Muscle Load Mapping separates direct, indirect, and stabiliser load.
- Recovery accounts for load type, RPE, soreness, sleep, energy, failed sets, experience, and goal path.
- Weak point detection compares ranks, volume, direct work, frequency, push/pull balance, and goal-path needs.
- Smart Overload recommends increasing weight, repeating weight, adding reps, reducing weight, or holding back due to recovery.
- Smart Deload detects plateaus, fatigue accumulation, and high-risk training patterns.
- Missions convert analysis into weekly action plans.

## What Makes It Different

ForgeLift is more than a workout notebook. It behaves like a lightweight training assistant by connecting workout logging to progression decisions, recovery management, imbalance detection, and weekly planning. The demo account shows the system working immediately without requiring manual data entry.

## Technologies Used

- React
- Vite
- Tailwind CSS
- Framer Motion
- Recharts
- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcrypt
- Helmet
- express-rate-limit

## Future Improvements

- Coach dashboard
- Gym leaderboards
- Wearable integration
- AI form notes
- PDF report export
- Subscription plans
