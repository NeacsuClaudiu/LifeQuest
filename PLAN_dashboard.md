# Plan: Enhanced HomeScreen Dashboard

## Goal
Add 7 new dashboard features to the existing HomeScreen without changing its overall design or removing any current functionality.

---

## Features to Add

### 1. Daily Progress Card
- Show tasks completed today vs a daily goal (e.g., 5 tasks/day)
- Circular or bar progress indicator
- Color: green (#4CAF50) theme

### 2. XP Progress to Next Level
- Already have XPBar component - enhance it with:
  - Show "X XP to Level Y" text
  - Show percentage progress
  - Show XP earned today

### 3. Current Streak Card
- Dedicated card for streak info
- Show current streak days
- Show best streak ever
- Show "Keep it up!" or warning based on status
- Color: fire orange (#FF5722)

### 4. Weekly Completion Percentage
- Calculate tasks completed this week (Mon-Sun)
- Show as percentage with progress bar
- Compare to last week if data available
- Color: blue (#2196F3)

### 5. Today's Top Priority Task
- Find highest difficulty task from today's active tasks
- Show it prominently with difficulty badge
- Link to complete it directly
- Color: based on difficulty

### 6. Recent Achievements Section
- Show last 3-5 achievements earned
- Show milestone name, date earned, icon
- Examples: "First Task", "7-Day Streak", "Level 5", "100 Tasks"
- Color: gold (#FFD700)

### 7. Motivational Quote of the Day
- Display a random quote that changes daily
- Show quote text and author
- Subtle styling, not dominant
- Color: subtle purple (#A78BFA)

---

## Data Requirements

### New Storage Keys Needed
- `@lifequest_completed_today` - Array of today's completed tasks with timestamps
- `@lifequest_weekly_completed` - Object with week dates as keys, completion counts as values
- `@lifequest_achievements_log` - Array of earned achievements with dates

### New Data Structures
```js
// Daily tracking
{
  date: '2026-01-15',
  completedCount: 3,
  xpEarned: 75
}

// Weekly tracking
{
  '2026-W03': { completed: 12, xpEarned: 300 }
}

// Achievements log
{
  id: 'first_task',
  name: 'First Steps',
  description: 'Completed your first task',
  icon: 'rocket',
  earnedAt: '2026-01-15T10:30:00Z'
}
```

---

## Achievement Definitions

| ID | Name | Condition | Icon |
|----|------|-----------|------|
| first_task | First Steps | tasksCompleted >= 1 | rocket |
| ten_tasks | Getting Started | tasksCompleted >= 10 | checkmark-circle |
| fifty_tasks | Half Century | tasksCompleted >= 50 | trophy |
| hundred_tasks | Century | tasksCompleted >= 100 | star |
| streak_3 | On Fire | currentStreak >= 3 | flame |
| streak_7 | Week Warrior | currentStreak >= 7 | flash |
| streak_30 | Monthly Master | currentStreak >= 30 | medal |
| level_5 | Rising Star | level >= 5 | arrow-up |
| level_10 | Legend | level >= 10 | crown |
| all_elements | Elementalist | unlocked all 4 elements | color-fill |

---

## Motivational Quotes (30+)

Array of { text, author } objects. Rotate daily based on day-of-year index.

Examples:
- "The secret of getting ahead is getting started." - Mark Twain
- "It is during our darkest moments that we must focus to see the light." - Aristotle
- "The only impossible journey is the one you never begin." - Tony Robbins

---

## Implementation Plan

### Step 1: Add Quotes Data
- Create `src/data/Quotes.js` with 30+ quotes
- Export `getQuoteOfDay()` function

### Step 2: Update Storage Utils
- Add helper functions for daily/weekly tracking
- Add achievement checking logic

### Step 3: Update CharacterData
- Add achievement definitions
- Add `checkAchievements(character)` function
- Add `getDailyStats()` and `getWeeklyStats()` functions

### Step 4: Rewrite HomeScreen
- Keep all existing components (Hero, XPBar, EvoCard, StatsRow, TaskList)
- Add new cards in this order:
  1. Quote of the Day (subtle, top)
  2. Daily Progress + Weekly Progress (side by side)
  3. XP Progress (enhanced)
  4. Streak Card (dedicated)
  5. Top Priority Task
  6. Recent Achievements
  7. (Existing) Today's Tasks List

### Step 5: Style Consistency
- Use existing colors: #1A1A2E (card bg), #2A2A3E (borders), #0D0D1A (main bg)
- Use existing border radius: 16px for cards
- Use existing text styles: white for titles, #666 for subtitles
- Use FadeInDown/FadeInUp animations consistently

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/data/Quotes.js` | CREATE - quotes data + getter |
| `src/data/CharacterData.js` | MODIFY - add achievements + stats helpers |
| `src/utils/Storage.js` | MODIFY - add daily/weekly helpers |
| `src/screens/HomeScreen.js` | MODIFY - add all new cards |

---

## Verification
- Build with `npx expo export --platform web`
- Push to GitHub/Vercel
- Verify all cards render correctly
- Verify no existing features broken
