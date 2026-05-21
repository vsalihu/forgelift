# IronRank

IronRank is a smart gym progression and ranking web app. Later stages will add workout logging, rank calculations, weak point detection, recovery estimates, personal records, and overload recommendations.

This repository contains the Stage 1 foundation only.

## Stage 1 Features

- React + Vite frontend
- Tailwind CSS dark gym dashboard styling
- Express API with MongoDB and Mongoose
- JWT authentication
- Register and login flows
- Protected routes
- Gender-aware onboarding
- User profile storage
- Dashboard shell with placeholder future feature cards
- Responsive app layout with navbar and sidebar
- Central frontend auth context and API service

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Authentication: JWT and bcrypt
- Icons: lucide-react
- Animations: Framer Motion

## Folder Structure

```txt
ironrank/
  client/
    src/
      components/
        Button.jsx
        FormInput.jsx
        Layout.jsx
        Navbar.jsx
        ProgressBar.jsx
        ProtectedRoute.jsx
        RankCard.jsx
        SelectInput.jsx
        Sidebar.jsx
        StatCard.jsx
      context/
        AuthContext.jsx
      hooks/
        useAuth.js
      pages/
        DashboardPage.jsx
        LandingPage.jsx
        LoginPage.jsx
        NotFoundPage.jsx
        OnboardingPage.jsx
        ProfilePage.jsx
        RegisterPage.jsx
      services/
        api.js
      utils/
        onboarding.js
      App.jsx
      index.css
      main.jsx
    index.html
    package.json
    postcss.config.js
    tailwind.config.js
    vite.config.js
  server/
    src/
      config/
        db.js
      controllers/
        authController.js
        userController.js
      middleware/
        authMiddleware.js
      models/
        User.js
      routes/
        authRoutes.js
        userRoutes.js
      utils/
        generateToken.js
        validation.js
      server.js
    .env.example
    package.json
  README.md
```

## Backend Setup

```bash
cd ironrank/server
npm install
copy .env.example .env
npm run dev
```

Update `.env` if your MongoDB URI or frontend URL differs.

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ironrank
JWT_SECRET=replace_this_with_a_secure_secret
CLIENT_URL=http://localhost:5173
```

The API runs at `http://localhost:5000`.

## Frontend Setup

```bash
cd ironrank/client
npm install
npm run dev
```

The client runs at `http://localhost:5173`.

If your API uses a different URL, create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## API Routes

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`

User:

- `GET /api/users/me`
- `PUT /api/users/profile`
- `PUT /api/users/onboarding`

Protected user routes require:

```txt
Authorization: Bearer <token>
```

## Next Planned Stages

- Workout logging
- Exercise library
- Personal record tracking
- Rank calculation engine
- Weak point detection
- Recovery readiness calculations
- Smart overload recommendations
- Progress charts and analytics

## Stage 1 Boundaries

This stage intentionally does not include workout logging, rank calculation, recovery calculations, charts, or smart overload logic. Dashboard cards are structured placeholders so real feature data can be added later.
