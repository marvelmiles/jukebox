import { Box } from "@mui/material";
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import CollectionView from "./components/CollectionView";
import { SigninForm, SignupForm } from "./components/Forms";
import { MUSIC_PLAYER, RADIO_PLAYER, SELECTION_MODE } from "./config";
import Discover from "./pages/Discover";
import Song from "./pages/Song";
import { useStateValue } from "./provider";
import JukeBox from "./components/JukeBox";
import Collections from "./components/Collections";
import SelectionToolBox from "./components/SelectionToolBox";
import RecentPlays from "./pages/RecentPlays";
import Explore from "./pages/Explore";
import Library from "./pages/Library";
export default function App(props) {
  return (
    <Router>
      <Routes>
        {[
          {
            path: "/discover/*",
            element: <Discover />,
          },
          {
            path: "/explore/*",
            element: <Explore />,
          },
          {
            path: "/song/:id",
            element: <Song />,
          },
          {
            path: "/album/:id",
            element: <CollectionView />,
          },
          {
            path: "/playlist/:id",
            element: <CollectionView isPlaylist />,
          },
          {
            path: "/u/signin",
            element: <SigninForm />,
          },
          {
            path: "/u/signup",
            element: <SignupForm />,
          },
          {
            path: "/u/albums",
            element: <Collections />,
          },
          {
            path: "/u/playlists",
            element: <Collections isPlaylists />,
          },
          {
            path: "/u/recent-plays/*",
            element: <RecentPlays />,
          },
          {
            path: "/u/library/*",
            element: <Library />,
          },
        ].map((r, i) => (
          <Route key={i} path={r.path} element={r.element} />
        ))}
        <Route path="/" element={<Navigate to="/discover" />} />
      </Routes>
    </Router>
  );
}
