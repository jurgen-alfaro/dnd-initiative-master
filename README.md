# ⚔️ D&D Initiative Master

![Project Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=flat&logo=drizzle)
![Neon](https://img.shields.io/badge/Database-Neon-00E599?style=flat&logo=neon)

A modern and efficient tool for managing initiative order in your Dungeons & Dragons games. Forget about pen and paper, and keep the combat flow digital and synchronized.

---

## ✨ Key Features

- 🛡️ **Combatant Management**: Easily add players and enemies with their respective modifiers.
- ⏱️ **Automatic Sorting**: Combatants are instantly ordered by their initiative rolls.
- 👥 **Party Synchronization**: Create or join a shared "party" so everyone sees the same order in real-time.
- 📱 **Responsive Design**: Optimized for use on tablets or laptops during your sessions.
- 🎨 **Premium UI**: Built with Tailwind CSS 4 and Radix UI components for a fluid experience.

---

## 🛠️ Tech Stack

This project uses cutting-edge technologies to ensure speed and scalability:

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [Neon](https://neon.tech/) (Serverless Postgres)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Components**: Radix UI & Shadcn/UI
- **Validation**: Zod

---

## 🚀 Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/) installed.
- A Postgres database instance (recommended: Neon).

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/dnd-initiative-master.git
   cd dnd-initiative-master
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root with your connection URL:

   ```env
   DATABASE_URL="postgres://your-user:password@your-host/your-db"
   ```

4. **Prepare the Database:**

   ```bash
   pnpm db:push
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```

Visit `http://localhost:3000` to get started.

---

## 📸 Screenshots

> [!TIP]
> Add GIFs or images of your application in action here to impress your visitors!

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

Built with ❤️ for the D&D community.
