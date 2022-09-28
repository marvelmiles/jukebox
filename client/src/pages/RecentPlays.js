import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  deSerializeUserFromCookie,
  getErrMsg,
  handleFilter,
  handleSort,
  shuffleArray,
  sortArrayBy,
  sortByArtist,
  sortByAZ,
  sortByUploadedAt,
  sortByYear,
} from "../helpers";
import { useStateValue } from "../provider";
import Container from "../components/Container";
import { gql, useApolloClient, useLazyQuery, useQuery } from "@apollo/client";
import { getUserRecentPlayedSongsGQL } from "../api/apollo-gql";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import NotFound from "./NotFound";
import { BlockLayout, DetailedLayout } from "../components/Layouts";
import { SET_AUDIO_PLAYING } from "../provider/reducer";
import { MUSIC_PLAYER, RADIO_PLAYER } from "../config";

function RecentPlays(props) {
  const [_, dispatch] = useStateValue();
  const user = deSerializeUserFromCookie();
  let [recent, setRecent] = useState([]);
  const [queryList, setQueryList] = useState(null);
  let { "*": _tab } = useParams();
  const [activeTab, setActiveTab] = useState(_tab.toLowerCase());
  const stateRef = useRef({ genres: [] }).current;
  const [isSorting, setIsSorting] = useState(false);
  const variables = {
    mediaCollectionType: activeTab,
  };
  let { loading } = useQuery(getUserRecentPlayedSongsGQL, {
    variables,
    context: {
      headers: {
        authorization: `Bearer ${user?.jwtToken}`,
      },
    },
    onError(err) {
      getErrMsg(err, true);
    },
    onCompleted({ getUserRecentPlays }) {
      console.log("get recent ", getUserRecentPlays);
      getUserRecentPlays[activeTab].songs.forEach(
        (s) =>
          s.genre &&
          (stateRef.genres = stateRef.genres.concat(s.genre.split(",")))
      );
      if (stateRef.genres.length) stateRef.genres.splice(0, 0, "All genres");
      setRecent(getUserRecentPlays[activeTab]);
    },
  });
  if (!user) return <Navigate to="/discover" />;
  const navs = [
    {
      label: "Songs",
      path: "/songs",
      to: "/u/recent-plays/songs",
      children: (
        <DetailedLayout
          query={{
            type: "recent",
            variables,
          }}
          list={queryList ? queryList : recent}
          queryMap={{}}
        />
      ),
      onClick() {
        console.log("tabs.,,,,,,,,,,,,");
        setActiveTab("songs");
      },
    },
    {
      label: "Radios",
      path: "/radios",
      to: "/u/recent-plays/radios",
      children: (
        <BlockLayout list={queryList ? queryList : recent} queryMap={{}} />
      ),
      onClick() {
        console.log("tabs.,,,,,,,,,,,,");
        stateRef.genres = [];
        setActiveTab("radios");
      },
    },
  ];

  return (
    <Container
      mountHeader
      headerProps={{
        navs,
        activeTab,
        handleSearchQuery: (query) => {
          query
            ? handleFilter(recent, query, (data) => {
                setQueryList(data);
              })
            : setQueryList(null);
        },
        secondaryBarProps: {
          actionsMap: {
            genres: stateRef.genres,
            listLen: activeTab === "songs" ? recent.length : 0,
            hideMore: "md",
          },
          handleBarAction(action, data) {
            switch (action) {
              case "shuffle":
                return dispatch({
                  type: SET_AUDIO_PLAYING,
                  payload: {
                    type: activeTab === "songs" ? MUSIC_PLAYER : RADIO_PLAYER,
                    streams: recent,
                    index: Math.floor(Math.random() * recent.length),
                    autoplay: true,
                  },
                });
              case "sort-by":
                setIsSorting(true);
                return handleSort(recent, data, (data) => {
                  setRecent(data);
                  setIsSorting(false);
                });
              default:
                break;
            }
          },
        },
      }}
    >
      {loading || isSorting ? (
        <div>loading...</div>
      ) : (
        <Routes>
          {navs.map((n, i) => (
            <Route key={i} path={n.path} element={n.children} />
          ))}
          <Route path="/" element={<Navigate to="/u/recent-plays/songs" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      )}
    </Container>
  );
}

RecentPlays.propTypes = {};

export default RecentPlays;
