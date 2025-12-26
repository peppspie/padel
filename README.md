# Padel Tournament Manager 🎾

A professional, mobile-optimized WebApp for managing Padel tournaments. Built with React and TypeScript, it handles group stages, knockout brackets, and real-time scoring with a focus on simplicity and high-performance user experience on smartphones.

## ✨ Key Features

- 📱 **Mobile First**: Optimized interface for use directly on court side.
- 🏆 **Versatile Tournament Modes**:
  - **Group Stage**: Automatic Round-Robin generation with real-time standings.
  - **Knockout Stage**: Dynamic bracket generation with auto-advancing winners.
  - **Mixed Mode**: Seamless transition from groups to knockout with cross-seeding (e.g., 1st A vs 2nd B).
- ⚙️ **Granular Configuration**: Define separate scoring rules (sets, games) for group and knockout stages.
- 🌑 **Dark Mode**: Sleek, high-contrast dark theme by default.
- 💾 **Local Persistence**: Data is saved in the browser's storage, allowing offline usage.
- ⬇️ **Export/Import**: Backup or share tournament data via JSON files.
- 🌍 **Internationalization**: Full support for English and Italian.

## 🚀 Technologies

- **Frontend**: [React 19](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 5](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Navigation**: [React Router 7](https://reactrouter.com/)
- **i18n**: [i18next 25](https://www.i18next.com/)

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: v24.x or higher (Tested on v24.11.1)
- **npm**: v11.x or higher (Tested on v11.6.2)

### Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/peppspie/padel.git
   cd padel
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Access the app at `http://localhost:5173/padel/`. To test on mobile, use the Network IP address displayed in the terminal.

### Production Build

```bash
npm run build
```

## 📦 Deployment

The project is configured for continuous deployment to **GitHub Pages** via GitHub Actions. Every push to the `main` branch triggers an automatic build and deploy.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
