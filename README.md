# Friendly

> **Your campus. Always in sync.**

Friendly is a web-based social coordination platform built for students at Robert Gordon University (RGU). It solves a universal student problem — figuring out when your whole group is free to study — without the back-and-forth of long group chats.

Built at **RGU Hack 2026** 🎉

---

## ✨ Features

- **Zero-friction sign-up** — anonymous authentication means you're in within seconds, no email required
- **Group management** — create a study group, share a 6-character invite code, and your friends join instantly
- **Smart availability engine** — set your free time blocks for each day of the week; a sweep-line algorithm finds the time slots where the most people overlap
- **Real-time campus map** — toggle your live location on an interactive map and see where your study group members are right now, each shown with their current study status
- **Group chat** — real-time messaging within each group
- **Study sessions** — propose sessions at specific times and let group members RSVP
- **Friends & direct messages** — send friend requests and DM individuals

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript + React 19 |
| Database & Auth | [Firebase](https://firebase.google.com/) (Firestore + Anonymous Auth) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Maps | [Leaflet](https://leafletjs.com/) + [React-Leaflet](https://react-leaflet.js.org/) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [Lucide React](https://lucide.dev/) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/Max11122006/friendly.git
cd friendly/client

# Install dependencies
npm install
```

### Running the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

---

## 📖 How to Use

1. **Landing page** — visit `/` to see an overview of features, then click **Get Started**
2. **Dashboard** — create a new group or join an existing one with an invite code
3. **Group view** — three tabs:
   - **Chat** — real-time group messaging
   - **Availability** — set your free time blocks; the app surfaces the best shared slots automatically
   - **Sessions** — propose study sessions and RSVP
4. **Profile** (`/profile`) — set your name, degree, year, interests, avatar, and current study status
5. **Map** (`/map`) — toggle location sharing to appear on the live campus map
6. **Friends** (`/friends`) — send and manage friend requests
7. **Direct messages** (`/dm/[uid]`) — chat one-on-one with a friend

---

## 📁 Project Structure

```
friendly/
├── client/                   # Next.js application
│   ├── app/                  # App Router pages
│   │   ├── page.tsx          # Landing page
│   │   └── (main)/           # Authenticated routes
│   │       ├── dashboard/    # Group creation & joining
│   │       ├── group/[id]/   # Group chat, availability & sessions
│   │       ├── map/          # Live campus map
│   │       ├── profile/      # User profile & settings
│   │       ├── friends/      # Friends list
│   │       └── dm/[uid]/     # Direct messages
│   ├── components/           # Shared React components
│   ├── context/              # React Context (auth, user state)
│   ├── lib/                  # Business logic & Firebase utilities
│   │   ├── firebase.ts
│   │   ├── availabilityService.ts
│   │   └── recommendationEngine.ts
│   └── types/                # TypeScript type definitions
└── challenges/               # RGU Hack 2026 challenge briefs
```

---

## 🗺 Study Status Indicators

When sharing your location on the map, your pin colour reflects your current status:

| Status | Colour | Meaning |
|---|---|---|
| 🔴 Locked In | Red | Deep focus — don't disturb |
| 🟢 Come Study | Green | Happy for others to join |
| 🔵 Free | Blue | Available and around |
| 🟠 Eating | Orange | On a break |
| ⚫ Invisible | — | Not visible on map |

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project was built for RGU Hack 2026. All rights reserved by the team.
