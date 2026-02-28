# ⚔️ D&D Initiative Master

> A modern, real-time combat tracker for Dungeons & Dragons 5th Edition

![Project Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=flat&logo=drizzle)
![Neon](https://img.shields.io/badge/Database-Neon-00E599?style=flat&logo=neon)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**Built for Dungeon Masters and Players** - Track initiative, manage HP, apply conditions, and synchronize combat state across all devices in real-time.

[Quick Start](#-quick-start) | [Features](#-key-features) | [Usage Guide](#-usage-guide) | [Contributing](#-contributing)

---

## Overview

A modern and efficient tool for managing initiative order in your Dungeons & Dragons games. Forget about pen and paper, and keep the combat flow digital and synchronized across all devices. Perfect for in-person sessions with a shared display or remote games where everyone needs to track the same combat state.

---

## ✨ Key Features

### 🎯 Combat Management
- **Initiative Tracking** - Automatic sorting by initiative roll value (highest to lowest)
- **Turn-Based Combat** - Visual indicator for active combatant with pulse animation
- **Round Counter** - Track combat rounds automatically
- **Turn Controls** - Next/Previous turn navigation with "Next Round" option
- **Auto-scroll** - Automatically scrolls to the active combatant on turn changes

### 📊 Character & Enemy Statistics
- **HP Tracking** - Current HP, Maximum HP, and Temporary HP display
- **D&D 5e Damage Rules** - Temporary HP absorbs damage first per official rules
- **Healing System** - Healing caps at maximum HP automatically
- **Armor Class (AC)** - Quick-edit AC values for each combatant
- **Player vs Enemy** - Visual distinction with color-coded themes
- **Quick-edit Modals** - DM-only access to modify all stats instantly

### 🎲 D&D 5e Conditions System
- **All 14 Official Conditions** - Complete support for:
  - Blinded, Charmed, Deafened, Frightened
  - Grappled, Incapacitated, Invisible, Paralyzed
  - Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious
- **Clickable Descriptions** - View full D&D 5e rules and mechanical effects for each condition
- **Multi-condition Support** - Apply multiple conditions to any combatant
- **Visual Badges** - Color-coded condition indicators on each combatant card

### 🔄 Real-time Synchronization
- **6-character Party Codes** - Easy sharing with memorable codes (excludes confusing characters I, O, 1, 0)
- **Polling-based Sync** - 3-second interval updates across all connected devices
- **Optimistic UI Updates** - Instant feedback before server confirmation
- **DM vs Player Modes** - Different permission levels based on URL parameter (`?dm=true`)
- **Recent Party Resume** - localStorage remembers your last party for quick access

### 🎨 User Experience
- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Navigation Guards** - Confirmation dialogs prevent accidental party exit
- **Delete Confirmations** - Safety prompts for all destructive actions
- **Premium UI** - Built with Radix UI components for accessibility
- **Type Safety** - Full TypeScript implementation throughout

---

## 📸 Screenshots

> **Coming soon!** In the meantime, here's what you'll see:

### Main Features Showcase
- **Combat Tracker Interface** - Initiative-sorted list with HP bars, AC values, conditions, and turn indicators
- **DM Controls** - Intuitive modals for managing stats, dealing damage/healing, and applying conditions
- **Condition System** - All 14 D&D 5e conditions with clickable descriptions showing official rules
- **Party Management** - Create/join parties with 6-character codes, recent party resume feature
- **Mobile Responsive** - Full functionality on tablets and phones
- **Real-time Sync Demo** - Changes reflect instantly across all connected devices

<!-- TODO: Add screenshots of:
1. Main combat view with active combatant highlighted
2. DM stat editing modals (HP, damage/heal, conditions)
3. Conditions selection dialog and description modal
4. Mobile responsive layout
5. Real-time sync demonstration (side-by-side browsers)
6. Party management (create/join screens)
-->

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **[pnpm](https://pnpm.io/)** installed
- A **Neon Database** account ([sign up free](https://neon.tech/))

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone https://github.com/jurgen-alfaro/dnd-initiative-master.git
   cd dnd-initiative-master
   pnpm install
   ```

2. **Set up your database:**
   - Create a new project on [Neon](https://neon.tech/)
   - Copy your connection string from the Neon dashboard
   - Create a `.env` file in the root directory:

   ```env
   DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
   ```

3. **Initialize the database schema:**

   ```bash
   pnpm db:push
   ```

4. **Start the development server:**

   ```bash
   pnpm dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** and create your first party!

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Drizzle migration files |
| `pnpm db:migrate` | Run custom migrations |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:studio` | Open Drizzle Studio (visual database editor) |

---

## 📖 Usage Guide

### Creating a Party (Dungeon Master)

1. Click **"Create New Party"** from the home page
2. Enter a party name (e.g., "Dragon's Lair Raid")
3. You'll receive a unique 6-character code - share this with your players
4. Click **"Start as DM"** to access full controls

### Joining a Party (Players)

1. Click **"Join Existing Party"** from the home page
2. Enter the 6-character code from your DM
3. Click **"Join as Player"** for read-only access
4. View initiative order, combatant stats, and condition effects in real-time

### Managing Combat (DM Only)

#### Adding Combatants
- Click **"Add Combatant"** button
- Enter name, select type (Player/Enemy), set initiative, HP, and AC
- Combatants automatically sort by initiative (highest first)

#### Tracking Initiative
- Click **"Next Turn"** to advance to the next combatant
- Use **"Previous Turn"** to go back if needed
- Click **"Next Round"** to advance turn and increment round counter
- Active combatant is highlighted with visual indicator and pulse animation

#### Managing HP
- Click any HP value to open the damage/healing dialog
- Enter amount and select "Damage" or "Healing"
- Temporary HP automatically absorbs damage first per D&D 5e rules
- HP cannot go below 0 or above maximum HP
- All changes sync in real-time across all connected devices

#### Applying Conditions
- Click **"Conditions"** button on any combatant card
- Select from all 14 D&D 5e conditions with checkboxes
- Click any condition name to view official rules and mechanical effects
- Multiple conditions can be active simultaneously
- Conditions display as color-coded badges on combatant cards

#### Editing Stats
- Click any stat value (AC, Initiative, HP, TmpHP) to open quick-edit modal
- Click combatant name to change name or type (Player/Enemy)
- All changes update optimistically (instant UI feedback)
- Changes sync to database in background

#### Deleting Combatants
- Click the trash icon on any combatant card
- Confirm deletion in the dialog
- **Cannot be undone** - confirmation prevents accidents

### Player View

**Players can:**
- View initiative order and current turn indicator
- See all combatant stats (HP, AC, conditions)
- Track combat rounds
- View condition descriptions by clicking condition names
- Monitor combat flow in real-time

**Players cannot:**
- Add or remove combatants
- Edit stats or apply damage/healing
- Advance turns or change rounds
- Modify conditions

### Recent Parties

The app remembers your last party for quick resume:
- Recent party card appears on home page after joining/creating
- Click to rejoin instantly without entering code
- Dismiss the card if you want to start fresh
- Stored in browser localStorage (per device)

---

## 🎲 D&D 5e Mechanics Explained

New to Dungeons & Dragons? Here's what these terms mean:

### Core Concepts

**Initiative** - Determines turn order in combat. Higher rolls go first. Usually a d20 roll plus your Dexterity modifier.

**Hit Points (HP)** - Represents your health. When HP reaches 0, you're unconscious. Healing restores HP up to your maximum.

**Temporary HP** - Bonus HP that absorbs damage first. Multiple sources don't stack - you always keep the higher amount. Temporary HP doesn't count as healing.

**Armor Class (AC)** - How hard you are to hit. Higher is better. Attackers must roll equal to or higher than your AC to hit you.

**Conditions** - Status effects that modify your abilities. Examples:
- **Blinded**: Can't see, attack rolls have disadvantage
- **Paralyzed**: Can't move or act, automatic critical hits against you
- **Poisoned**: Disadvantage on attack rolls and ability checks

### Combat Flow

1. **Roll Initiative** (everyone rolls once at combat start)
2. **Take Turns** in initiative order (highest to lowest)
3. **On Your Turn**: Move, take actions, bonus actions
4. **Round Ends** when everyone has taken a turn
5. **Repeat** until combat ends

This tracker handles steps 1-4 automatically!

### Useful Resources

- [Official D&D 5e Basic Rules (Free)](https://www.dndbeyond.com/sources/basic-rules)
- [D&D Beyond Character Builder](https://www.dndbeyond.com/)
- [Roll20 (Virtual Tabletop)](https://roll20.net/)

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library with latest features
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Shadcn/UI](https://ui.shadcn.com/)** - Component library built on Radix
- **[Lucide React](https://lucide.dev/)** - Icon library

### Backend & Database
- **[Neon](https://neon.tech/)** - Serverless PostgreSQL database
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe ORM with schema management
- **Next.js Server Actions** - API layer (no separate backend needed)

### Data Management
- **[Zod](https://zod.dev/)** - Runtime schema validation
- **Optimistic Updates** - Instant UI feedback before server confirmation
- **Polling-based Sync** - Real-time updates via 3-second polling interval

### Developer Tools
- **TypeScript** - Type safety throughout the application
- **ESLint** - Code linting with Next.js configuration
- **pnpm** - Fast, disk-efficient package manager

### Architecture Overview

```
┌─────────────────────────────────────────────┐
│          Client (React Components)          │
├─────────────────────────────────────────────┤
│  - Optimistic UI updates                    │
│  - usePartyPolling hook (3s interval)       │
│  - localStorage for recent parties          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│      Next.js Server Actions (API)           │
├─────────────────────────────────────────────┤
│  - Zod validation                           │
│  - Business logic                           │
│  - Database operations via Drizzle          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          Neon PostgreSQL Database           │
├─────────────────────────────────────────────┤
│  Tables:                                    │
│  - parties (name, code, turn state)         │
│  - combatants (stats, conditions, FK)       │
└─────────────────────────────────────────────┘
```

### Key Technical Decisions

**Why Polling instead of WebSockets?**
- Simpler infrastructure (no WebSocket server needed)
- Works with serverless deployments (Vercel, Netlify)
- 3-second polling provides "good enough" real-time feel for turn-based combat
- Lower complexity for small-scale collaborative tool

**Why Optimistic Updates?**
- Instant UI feedback improves perceived performance
- Reduces waiting time for server round-trips
- Automatic rollback on server errors
- Better UX for frequent stat adjustments and turn changes

**Why Neon DB?**
- Serverless scaling (pay-per-use model)
- Excellent Next.js integration
- Built-in connection pooling for serverless functions
- Generous free tier perfect for small groups

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push your code to GitHub**

2. **Import on Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel auto-detects Next.js configuration

3. **Add Environment Variables:**
   - In Vercel dashboard, go to **Settings → Environment Variables**
   - Add `DATABASE_URL` with your Neon connection string
   - **Important**: Use the **pooled connection string** (contains `-pooler` in hostname) for production

4. **Deploy:**
   - Click **"Deploy"**
   - Vercel builds and deploys automatically
   - Share the generated URL with your gaming group!

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |

**Production Note:** Always use Neon's **pooled connection string** for serverless deployments to avoid connection limits. The pooled connection string contains `-pooler` in the hostname.

### Other Platforms

**Netlify:**
- Similar to Vercel, auto-detects Next.js
- Add environment variables in **Site Settings → Build & Deploy**

**Railway:**
- Excellent for apps with databases
- Can host both Next.js and PostgreSQL in one platform
- One-click deploy from GitHub

**Self-Hosting:**
```bash
pnpm build
pnpm start
```
Server runs on port 3000. Configure reverse proxy (nginx/Caddy) and process manager (PM2) as needed.

---

## 🤝 Contributing

Contributions make the open-source community thrive! Any contributions are **greatly appreciated**.

### How to Contribute

1. **Fork the Project**
2. **Create your Feature Branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Make your changes** and commit
   ```bash
   git commit -m 'feat: add some AmazingFeature'
   ```
4. **Push to the Branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Contribution Ideas

- 🐛 **Bug fixes** - Check [Issues](https://github.com/jurgen-alfaro/dnd-initiative-master/issues)
- ✨ **New features** - Spell tracking, death saves, encounter builder, monster database integration
- 📝 **Documentation** - Improve guides, add examples, create tutorials
- 🎨 **UI/UX enhancements** - Design improvements, animations, accessibility
- ♿ **Accessibility** - Screen reader support, keyboard navigation, ARIA labels
- 🌐 **Internationalization** - Translations for other languages
- 🧪 **Test coverage** - Unit tests, integration tests, E2E tests

### Development Guidelines

- Follow existing code style (enforced by ESLint)
- Use TypeScript for type safety
- Test your changes locally before submitting PR
- Update README if adding new features or changing setup
- Keep commits atomic and well-described

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Formatting, missing semicolons, etc. |
| `refactor:` | Code restructuring without behavior change |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance tasks |

**Examples:**
- `feat: add spell tracking for casters`
- `fix: correct temporary HP damage absorption order`
- `docs: add deployment guide for Railway`

### Questions or Suggestions?

Open an [Issue](https://github.com/jurgen-alfaro/dnd-initiative-master/issues) or start a [Discussion](https://github.com/jurgen-alfaro/dnd-initiative-master/discussions)! We'd love to hear from you.

---

## ❓ FAQ

**Q: Do players need accounts to join?**
A: No! Just share the 6-character party code and anyone can join instantly.

**Q: Is combat data persistent?**
A: Yes, all data is stored in the database and persists across sessions until you delete it.

**Q: Can I use this offline?**
A: Not currently. The app requires internet for database synchronization.

**Q: How many players can join a party?**
A: Technically unlimited, but designed for typical D&D groups (4-8 players + enemies).

**Q: Is this official D&D content?**
A: No, this is a fan-made tool. It uses D&D 5e rules but is not affiliated with Wizards of the Coast.

**Q: Can I self-host this application?**
A: Yes! See the [Deployment](#-deployment) section for instructions.

**Q: What happens to my data when I close the browser?**
A: Your combat data is saved in the Neon database. Only the "recent party" feature uses localStorage to remember your last party code.

**Q: Can players see hidden information?**
A: Currently, all stats are visible to everyone. Future versions may include hidden HP and conditions for DM-only view.

---

## 🗺️ Roadmap

Planned features and improvements:

### High Priority
- [ ] **WebSocket support** for true real-time synchronization
- [ ] **Combat log** with history of all actions (damage, healing, conditions)
- [ ] **Death saves** tracking for downed players
- [ ] **Dark mode** toggle

### Medium Priority
- [ ] **Dice roller** integrated into the app
- [ ] **Encounter builder** with CR calculations
- [ ] **Export/Import** combat state (JSON format)
- [ ] **Monster database** integration (SRD content)
- [ ] **Hidden HP mode** for DM (players see status indicators instead)

### Future Enhancements
- [ ] **Character sheets** with full stat blocks
- [ ] **Spell tracking** for casters (spell slots, prepared spells)
- [ ] **Concentration tracking** with automatic condition removal
- [ ] **API** for third-party integrations
- [ ] **Mobile app** (React Native)
- [ ] **Audio cues** for turn changes
- [ ] **Initiative reroll** functionality

Have an idea? [Open an issue](https://github.com/jurgen-alfaro/dnd-initiative-master/issues) to suggest features!

---

## 🔧 Troubleshooting

### Database Connection Errors

**Problem:** Can't connect to database or seeing connection timeout errors

**Solutions:**
- Verify `DATABASE_URL` is correct in `.env` file
- Check Neon dashboard for database status
- Ensure you're using the correct connection string format
- For production/Vercel, use the **pooled connection string** (contains `-pooler`)

### Changes Not Syncing

**Problem:** Updates in one browser don't appear in another

**Solutions:**
- Check browser console for errors (F12 → Console tab)
- Verify all clients are using the exact same party code
- Polling interval is 3 seconds - small delays are normal
- Refresh the page to force a full sync

### Build Errors

**Problem:** `pnpm build` fails or development server won't start

**Solutions:**
- Clear Next.js cache: `rm -rf .next`
- Delete node_modules and reinstall: `rm -rf node_modules && pnpm install`
- Check Node.js version (requires 18 or higher): `node --version`
- Verify all environment variables are set in `.env`

### Database Schema Issues

**Problem:** Database errors about missing tables or columns

**Solutions:**
- Run `pnpm db:push` to sync schema
- Check Neon dashboard to verify tables exist
- Try `pnpm db:generate` then `pnpm db:migrate` for migration-based approach

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- Built with ❤️ for the D&D community
- Inspired by the need for better digital combat tracking tools
- D&D 5e rules from [Wizards of the Coast](https://dnd.wizards.com/)
- UI components from [Shadcn/UI](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Database hosting by [Neon](https://neon.tech/)

---

## 🔗 Links

- **[GitHub Repository](https://github.com/jurgen-alfaro/dnd-initiative-master)** - Source code
- **[Report Bug](https://github.com/jurgen-alfaro/dnd-initiative-master/issues)** - Found an issue?
- **[Request Feature](https://github.com/jurgen-alfaro/dnd-initiative-master/issues)** - Have an idea?
- **[D&D Beyond](https://www.dndbeyond.com/)** - Official D&D digital tools

---

**Happy adventuring!** May your rolls be high and your initiative higher! 🎲⚔️
