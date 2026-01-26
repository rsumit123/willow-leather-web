import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/common/Layout';
import { HomePage } from './pages/Home';
import { NewCareerPage } from './pages/NewCareer';
import { AuctionPage } from './pages/Auction';
import { DashboardPage } from './pages/Dashboard';
import { SquadPage } from './pages/Squad';
import { StandingsPage } from './pages/Standings';
import { FixturesPage } from './pages/Fixtures';
import { MatchPage } from './pages/Match';
import { PlayingXIPage } from './pages/PlayingXI';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/new-career" element={<NewCareerPage />} />
          <Route path="/auction" element={<AuctionPage />} />

          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/squad" element={<SquadPage />} />
            <Route path="/standings" element={<StandingsPage />} />
            <Route path="/fixtures" element={<FixturesPage />} />
            <Route path="/match/:fixtureId" element={<MatchPage />} />
            <Route path="/playing-xi" element={<PlayingXIPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
