# YesBill - Development Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Access App
```
http://localhost:5173
```

---

## 📦 Installed Packages

### Core Dependencies
- `react` - UI library
- `react-dom` - React DOM renderer
- `react-router-dom` - Client-side routing
- `axios` - HTTP client for API calls

### UI & Styling
- `tailwindcss` - Utility-first CSS
- `clsx` - Conditional class names
- `tailwind-merge` - Merge Tailwind classes
- `class-variance-authority` - CVA for component variants

### Animation & Interaction
- `framer-motion` - Animation library
- `lucide-react` - Icon library

### Date Handling
- `date-fns` - Date utility functions

---

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Base components (shadcn-inspired)
│   │   │   ├── button.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   └── card.jsx
│   │   ├── DailyTracker.jsx  # Main calendar
│   │   └── StatsCards.jsx    # Animated stats
│   ├── pages/
│   │   ├── Auth.jsx          # Login/Signup
│   │   ├── Dashboard.jsx     # Main app
│   │   ├── Summary.jsx       # Monthly insights
│   │   └── Settings.jsx      # User config
│   ├── services/
│   │   └── api.js            # API client
│   ├── lib/
│   │   └── utils.js          # Helper functions
│   ├── App.jsx               # Router setup
│   └── main.jsx              # Entry point
├── tailwind.config.js
└── package.json
```

---

## 🎨 Component Usage

### Button
```jsx
import { Button } from "@/components/ui/button";

<Button variant="default">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
```

### Input
```jsx
import { Input } from "@/components/ui/input";

<Input type="email" placeholder="you@example.com" />
```

### Card
```jsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### DailyTracker
```jsx
import { DailyTracker } from "@/components/DailyTracker";

<DailyTracker
  records={recordsMap}           // { "2025-01-15": "YES", ... }
  onToggle={handleToggle}        // (date, status) => Promise
  currentMonth={new Date()}      // Date object
  onMonthChange={setCurrentMonth} // (date) => void
/>
```

### StatsCards
```jsx
import { AnimatedStatCard, MonthlyStats, ProgressBar } from "@/components/StatsCards";

// Individual card
<AnimatedStatCard
  title="Days Completed"
  value={25}
  suffix="/ 30"
  trend={12}
  icon={Calendar}
/>

// All stats
<MonthlyStats summary={summaryData} />

// Progress bar
<ProgressBar value={25} max={30} label="Monthly Goal" />
```

---

## 🎯 API Integration

### Auth API
```js
import { authAPI } from "@/services/api";

// Register
await authAPI.register(email, password, name);

// Login
const { token } = await authAPI.login(email, password);
localStorage.setItem("access_token", token);
```

### Config API
```js
import { configAPI } from "@/services/api";

// Get config
const config = await configAPI.get();

// Create config
await configAPI.create({
  daily_amount: 100,
  currency: "USD",
  start_date: "2025-01-01"
});

// Update config
await configAPI.update(configId, { daily_amount: 150 });
```

### Records API
```js
import { recordsAPI } from "@/services/api";

// Get month records
const records = await recordsAPI.getMonth("2025-01");

// Create/update record
await recordsAPI.create({
  date: "2025-01-15",
  status: "YES"
});

// Get summary
const summary = await recordsAPI.getSummary("2025-01");
// Returns: { yes_count, total_days, total_amount }
```

---

## 🎨 Tailwind Classes Reference

### Colors
```
Primary: bg-primary, text-primary, border-primary
YES: bg-green-500, text-green-600
NO: bg-red-500, text-red-600
```

### Spacing
```
p-6   (padding: 24px)
gap-4 (gap: 16px)
space-y-8 (vertical spacing: 32px)
```

### Borders
```
rounded-xl   (border-radius: 12px)
rounded-2xl  (border-radius: 16px)
```

### Shadows
```
shadow-lg         (large shadow)
shadow-xl         (extra large)
shadow-indigo-500/30  (colored shadow at 30% opacity)
```

---

## 🔧 Configuration Files

### Tailwind Config
```js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        background: "#FAFAFA",
      },
    },
  },
};
```

### Vite Config
```js
// vite.config.js
export default {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@/components'"
**Fix:** Check vite.config.js has correct path alias

### Issue: Tailwind styles not loading
**Fix:** Verify tailwind.config.js content paths include all JSX files

### Issue: API calls failing
**Fix:** Check backend is running and CORS is configured correctly

### Issue: Date format errors
**Fix:** Ensure date-fns is installed and using correct format strings

---

## 📝 Development Checklist

- [ ] Run `npm install` in frontend directory
- [ ] Start backend server (Python FastAPI)
- [ ] Start frontend dev server (`npm run dev`)
- [ ] Test auth flow (register → login → dashboard)
- [ ] Test calendar marking (YES/NO toggle)
- [ ] Test month navigation
- [ ] Verify streak counter updates
- [ ] Check responsive layout on mobile
- [ ] Test settings page (update daily amount)
- [ ] Verify summary page calculations

---

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

### Deploy to Vercel
```bash
vercel --prod
```

---

**Happy Tracking! 🎉**
