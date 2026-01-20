import "./App.css";

export default function App() {
  return (
    <div className="app">
      <header className="appHeader">
        <h1>Sports Complex Management System</h1>
        <p className="subtitle">
          UI-first build (React + Vite). Backend will be integrated later.
        </p>
      </header>

      <main className="appMain">
        <div className="card">
          <h2>Current Goal ✅</h2>
          <ul>
            <li>Finish complete working UI (functional + realistic)</li>
            <li>Use role-based screens: Admin / Staff / Coach / Player</li>
            <li>No role dropdown in final login (role comes from backend later)</li>
          </ul>
        </div>

        <div className="card">
          <h2>Next Step 🚀</h2>
          <p>
            We will add routing + a proper layout (Sidebar + Topbar), then build
            Login and Dashboard screens.
          </p>
        </div>
      </main>
    </div>
  );
}
