import React from "react";
import { Route, Routes } from "react-router-dom";
import { MoreCollectionView, MoreSongView } from "../../components/MoreStream";
import Result from "./Result";
import Home from "./Home";
export default function Index() {
  return (
    <Routes>
      <Route path="/result" element={<Result />} />
      {[
        {
          path: "/top-searched-songs",
          element: <MoreSongView country="all" reportOne="topSearchedSongs" />,
        },
        {
          path: "/top-searched-albums",
          element: (
            <MoreCollectionView
              country="all"
              reportOne="topSearchedAlbums"
              queryMapKey="album"
            />
          ),
        },
        {
          path: "/top-searched-playlists",
          element: (
            <MoreCollectionView
              country="all"
              reportOne="topSearchedPlaylists"
              queryMapKey="playlist"
            />
          ),
        },
        {
          path: "/trending-songs",
          element: <MoreSongView country="all" reportOne="trendingSongs" />,
        },
        {
          path: "/trending-albums",
          element: (
            <MoreCollectionView
              country="all"
              reportOne="trendingAlbums"
              queryMapKey="album"
            />
          ),
        },
        {
          path: "/trending-playlists",
          element: (
            <MoreCollectionView
              country="all"
              reportOne="trendingPlaylists"
              queryMapKey="playlist"
            />
          ),
        },
        {
          path: "/trending-artists",
          report: "trendingArtists",
        },
      ].map((r, i) => (
        <Route key={i} path={r.path} element={r.element} />
      ))}
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
