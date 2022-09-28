import { useQuery } from "@apollo/client";
import { Box, Button } from "@mui/material";
import React, { useRef, useState } from "react";
import { Route, Router, Routes } from "react-router-dom";
import { getJukeMixGQL } from "../api/apollo-gql";
import { Loading } from "../components/Animations";
import Container from "../components/Container";
import Discoveries from "../components/Discoveries";
import { MoreSongView, MoreCollectionView } from "../components/MoreStream";
import MusicCollections from "../components/MusicCollections";
import SongsView from "../components/SongsView";
import { deSerializeUserFromCookie, getErrMsg } from "../helpers";
import { useStateValue } from "../provider";
import AlbumsResult from "./Explore/AlbumsResult";
import Result from "./Explore/Result";
import SongsResult from "./Explore/SongsResult";

export const Home = () => {
  const [tab, setTab] = useState("jukemix");
  const { id: userId } = deSerializeUserFromCookie();
  const { data, loading } = useQuery(getJukeMixGQL, {
    variables: {
      mixin: {
        usersChoice: ["topDownloads", "dailyTrending"],
        // charts: ["topSongs-nigeria"],
        // recommendation: ["topSongs", "topAlbums"],
        // nostalgic: ["random"],
      },
      userId,
    },
    onError(err) {
      getErrMsg(err, true);
    },
  });
  console.log(data?.getJukeMix?.usersChoice);
  return (
    <Container
      mountHeader
      headerProps={{
        searchQueryProps: {
          to: "discover",
        },
        secondaryBar: null,
        mountCategoryBar: true,
        categoryBar: (
          <>
            <Button variant="tab" onClick={() => setTab("jukemix")}>
              JukeMix
            </Button>
            <Button variant="tab" onClick={() => setTab("trending")}>
              Trending
            </Button>
          </>
        ),
      }}
    >
      {tab === "trending" ? (
        <Discoveries path="discover" />
      ) : loading ? (
        <Loading />
      ) : (
        <Box></Box>
      )}
    </Container>
  );
};

export default function Discover() {
  return (
    <Routes>
      {[
        {
          path: "/",
          element: <Home />,
        },
        {
          path: "/result/*",
          element: (
            <Routes>
              {[
                {
                  path: "/",
                  element: <Result country="nigeria" to="discover" />,
                },
                {
                  path: "/songs",
                  element: (
                    <SongsResult getType="getQueryResult" reportOne="songs" />
                  ),
                },
                {
                  path: "/albums",
                  element: <AlbumsResult />,
                },
              ].map((r, i) => (
                <Route key={i} path={r.path} element={r.element} />
              ))}
            </Routes>
          ),
        },
        {
          path: "/trending-songs",
          element: (
            <SongsResult
              getType="getAnalyticsReport"
              reportOne="trendingSongs"
              categories={["Hot", "New"]}
            />
          ),
        },
        {
          path: "/trending-albums",
          element: (
            <MoreCollectionView
              reportOne="trendingAlbums"
              queryMapKey="album"
            />
          ),
        },
        {
          path: "/trending-playlists",
          element: (
            <MoreCollectionView
              reportOne="trendingPlaylists"
              queryMapKey="playlist"
            />
          ),
        },
      ].map((r, i) => (
        <Route key={i} path={r.path} element={r.element} />
      ))}
    </Routes>
  );
}
