import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import App from './App';
import Home from './pages/Home';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import PlayerForm from './pages/PlayerForm';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import MatchForm from './pages/MatchForm';
import Rankings from './pages/Rankings';
import MoreMenu from './pages/MoreMenu';
import TeamDraw from './pages/TeamDraw';
import StatsChat from './pages/StatsChat';
import Settings from './pages/Settings';
import Login from './pages/Login';
import HeadToHead from './pages/HeadToHead';
import NextMatch from './pages/NextMatch';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'players', element: <Players /> },
      { path: 'players/new', element: <PlayerForm /> },
      { path: 'players/:id', element: <PlayerProfile /> },
      { path: 'players/:id/edit', element: <PlayerForm /> },
      { path: 'matches', element: <Matches /> },
      { path: 'matches/new', element: <MatchForm /> },
      { path: 'matches/:id', element: <MatchDetail /> },
      { path: 'matches/:id/edit', element: <MatchForm /> },
      { path: 'rankings', element: <Rankings /> },
      { path: 'more', element: <MoreMenu /> },
      { path: 'team-draw', element: <TeamDraw /> },
      { path: 'stats-chat', element: <StatsChat /> },
      { path: 'settings', element: <Settings /> },
      { path: 'login', element: <Login /> },
      { path: 'head-to-head', element: <HeadToHead /> },
      { path: 'next-match', element: <NextMatch /> },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
