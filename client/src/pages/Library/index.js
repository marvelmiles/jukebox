import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { MusicNote } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { getUserRecentPlaysGQL, uploadSongsGQL } from "../../api/apollo-gql";
import { CardCarousel } from "../../components/Animations";
import Container from "../../components/Container";
import DragDropFile from "../../components/DragDropFile";
import { CompactPlays } from "../../components/Layouts";
import { LeadTo } from "../../components/Navigation";
import RecentPlays from "../../components/RecentPlays";
import { getErrMsg } from "../../helpers";
import Favourites from "./Favourites";
import FollowedArtists from "./FollowedArtists";
import Songs from "./Songs";
import SongsResult from "../Explore/SongsResult";
const Home = () => {
  const [activeRecent, setActiveRecent] = useState("songs");
  const [uploadSongs, { loading }] = useMutation(uploadSongsGQL, {
    onError(err) {
      getErrMsg(err, true);
    },
    onCompleted({ uploadSongs: { data, extraInfo } }) {
      console.log("uploaded succss.... ", data, extraInfo);
    },
  });
  return (
    <Container
      headerProps={{
        activeTab: "library",
        secondaryBar: null,
      }}
    >
      <List
        sx={{
          width: "350px",
          backgroundColor: "primary.main",
          borderRadius: 5,
        }}
      >
        {[
          {
            icon: MusicNote,
            to: "/u/library/songs",
            element: "All Songs",
          },
          {
            icon: MusicNote,
            to: "/u/library/favourite-songs",
            element: "Favourite Songs",
          },
          {
            icon: MusicNote,
            to: "/u/library/favourite-albums",
            element: "Favourite Albums",
          },
          {
            icon: MusicNote,
            to: "/u/library/favourite-playlists",
            element: "Favourite Playlists",
          },
          {
            icon: MusicNote,
            to: "/u/library/favourite-radios",
            element: "Favourite Radios",
          },
          {
            icon: MusicNote,
            to: "/u/library/followed-artists",
            element: "Followed Artists",
          },
        ].map((l, i) => (
          <ListItem key={i}>
            <ListItemButton to={l.to} LinkComponent={Link}>
              <ListItemIcon>{<l.icon />}</ListItemIcon>
              <ListItemText>{l.element}</ListItemText>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box
        sx={{
          backgroundColor: "primary.main",
          maxWidth: "350px",
          borderRadius: 5,
          height: "300px",
        }}
      >
        <DragDropFile
          reset={!loading}
          accept="audio"
          dropView={<Box>Uploading....</Box>}
          onFilesTransfer={(files) => {
            uploadSongs({
              variables: {
                songs: files,
              },
            });
          }}
        />
      </Box>
      <Box sx={{ mt: 3 }}>
        <LeadTo
          primaryTitle="Recently Played"
          variant="h4"
          to={`/u/recent-plays/${activeRecent}`}
        />
        <Button
          sx={{
            backgroundColor: false ? "secondary.main" : "primary.main",
            color: false === "hot" ? "primary.contrastText" : "",
            borderRadius: "20px",
            width: {
              xs: "auto",
              sm: "60px",
            },
            my: 0,
          }}
          onClick={() => setActiveRecent("songs")}
        >
          Songs
        </Button>
        <Button
          sx={{
            backgroundColor: false ? "secondary.main" : "primary.main",
            color: false === "hot" ? "primary.contrastText" : "",
            borderRadius: "20px",
            width: {
              xs: "auto",
              sm: "60px",
            },
            m: 1,
            my: 0,
          }}
          onClick={() => setActiveRecent("radios")}
        >
          Radios
        </Button>
        <RecentPlays mediaCollectionType={activeRecent} operation="local" />
      </Box>
    </Container>
  );
};

export default function Index() {
  return (
    <Routes>
      {[
        {
          path: "/",
          element: <Home />,
        },
        {
          path: "/songs",
          element: <SongsResult getType="getUserSongs" keyword={"songs"} />,
        },
        {
          path: "/playlists",
          element: (
            <SongsResult getType="getUserPlaylists" keyword={"playlists"} />
          ),
        },
        {
          path: "/favourite-songs",
          element: <Favourites defaultTab="songs" />,
        },
        {
          path: "/favourite-albums",
          element: <Favourites defaultTab="albums" />,
        },
        {
          path: "/favourite-albums",
          element: <Favourites defaultTab="playlists" />,
        },
        {
          path: "/favourite-albums",
          element: <Favourites defaultTab="radios" />,
        },
        {
          path: "/followed-artists",
          element: <FollowedArtists />,
        },
      ].map((r, i) => (
        <Route key={i} path={r.path} element={r.element} />
      ))}
    </Routes>
  );
}
