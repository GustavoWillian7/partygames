import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import ImpostorGamePage from './pages/ImpostorGamePage';
import DuoChaosGamePage from './pages/DuoChaosGamePage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/game/impostor" element={<ImpostorGamePage />} />
          <Route path="/game/duo-chaos" element={<DuoChaosGamePage />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
