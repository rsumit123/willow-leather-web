# Willow & Leather - Frontend

Mobile-first React web app for cricket management simulation game.

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom cricket theme
- **Animations**: Framer Motion
- **State**: Zustand + TanStack Query
- **Routing**: React Router v6

## Getting Started

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start dev server
npm run dev
```

## Environment Variables

Create a `.env` file:

```
VITE_API_URL=http://localhost:8000/api
```

## Features

- 🏏 **Career Mode**: Multi-season management
- 💰 **Auction**: Realistic IPL-style player auction
- 📊 **Analytics**: Team stats, standings, NRR
- 🎮 **Match Simulation**: Ball-by-ball or quick sim
- 📱 **Mobile-First**: Optimized for mobile browsers

## Design System

### Colors

- **Pitch Green**: Primary brand color (#22c55e)
- **Ball Red**: Accent/danger (#ef4444)
- **Dark**: Background theme (#020617 - #0f172a)

### Animations

- Smooth transitions with Framer Motion
- Cricket-themed micro-interactions
- Loading states and skeletons
- Page transitions

## Project Structure

```
src/
├── api/          # API client & types
├── components/
│   ├── common/   # Reusable components
│   ├── auction/  # Auction-specific
│   ├── match/    # Match viewer
│   └── season/   # Season/fixtures
├── pages/        # Route pages
├── store/        # Zustand stores
└── utils/        # Helpers
```

## Build

```bash
npm run build
```

## License

MIT
