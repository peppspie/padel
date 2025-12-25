import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { NewTournament } from './pages/NewTournament';
import { TournamentView } from './pages/TournamentView';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewTournament />} />
          <Route path="/tournament/:id" element={<TournamentView />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;