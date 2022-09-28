import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import { CardCarousel, Loading } from "./Animations";
import { BlockLayout, CompactLayout, CompactLayoutNavigator } from "./Layouts";
import {
  getTrendingAlbumsGQL,
  getTrendingArtistsGQL,
  getTrendingPlaylistsGQL,
  getTrendingSongsGQL,
} from "../api/apollo-gql";
import { useApolloClient, useQuery } from "@apollo/client";
import { deSerializeUserFromCookie, getErrMsg } from "../helpers";
import { useStateValue } from "../provider";

function Discoveries({ path, country, limit, onQueryConfig }) {
  const user = deSerializeUserFromCookie();
  const { cache } = useApolloClient();
  const [{ socket }, dispatch] = useStateValue();
  const { id } = deSerializeUserFromCookie() || {};
  const [activeTrendingSongs, setActiveTrendingSongs] = useState("hot");
  const [activeTrendingAlbums, setActiveTrendingAlbums] = useState("hot");
  const [activeTrendingPlaylists, setActiveTrendingPlaylists] = useState("hot");
  const stateRef = useRef({
    trendingSongs: [],
    trendingAlbums: [],
    trendingPlaylists: [],
    variables: {
      trendingSongs: {
        userId: user.id,
        country,
        category: activeTrendingSongs,
        report: "trendingSongs",
        pagination: {
          limit: 40,
        },
        scrollToIndex: 3,
      },
      trendingAlbums: {
        userId: user.id,
        country,
        category: activeTrendingAlbums,
        report: "trendingAlbums",
        pagination: {
          limit: 40,
        },
        scrollToIndex: 3,
      },
      trendingPlaylists: {
        userId: user.id,
        country,
        category: activeTrendingPlaylists,
        report: "trendingPlaylists",
        pagination: {
          limit: 40,
        },
        scrollToIndex: 3,
      },
    },
  }).current;

  if (stateRef.variables.trendingSongs.category !== activeTrendingSongs)
    stateRef.variables.trendingSongs.category = activeTrendingSongs;

  if (stateRef.variables.trendingPlaylists.category !== activeTrendingPlaylists)
    stateRef.variables.trendingPlaylists.category = activeTrendingPlaylists;

  if (stateRef.variables.trendingAlbums.category !== activeTrendingAlbums)
    stateRef.variables.trendingAlbumsVar.category = activeTrendingAlbums;

  let { loading: loadingTrendingSongs, refetch: refetchSongs } = useQuery(
    getTrendingSongsGQL,
    {
      variables: stateRef.variables.trendingSongs,
      onError(err) {
        getErrMsg(err, true);
      },
      onCompleted({ getAnalyticsReport: { trendingSongs } }) {
        stateRef.variables.trendingSongs.pagination = trendingSongs.pagination;
        stateRef.refetchingtrendingSongs = false;
        stateRef.trendingSongs = trendingSongs.data.concat(
          stateRef.trendingSongs
        );
      },
    }
  );
  let { loading: loadingTrendingAlbums, refetch: refetchAlbums } = useQuery(
    getTrendingAlbumsGQL,
    {
      variables: stateRef.variables.trendingAlbums,
      onError(err) {
        getErrMsg(err, true);
      },
      onCompleted({ getAnalyticsReport: { trendingAlbums } }) {
        console.log("refetched albmsss...", trendingAlbums);
        stateRef.variables.trendingAlbums.pagination =
          trendingAlbums.pagination;
        stateRef.refetchingtrendingAlbums = false;
        stateRef.trendingAlbums = trendingAlbums.data.concat(
          stateRef.trendingAlbums
        );
      },
    }
  );
  let { loading: loadingTrendingPlaylists, refetch: refetchPlaylists } =
    useQuery(getTrendingPlaylistsGQL, {
      variables: stateRef.variables.trendingPlaylists,
      onError(err) {
        getErrMsg(err, true);
      },
      onCompleted({ getAnalyticsReport: { trendingPlaylists } }) {
        stateRef.variables.trendingPlaylists.pagination =
          trendingPlaylists.pagination;
        stateRef.refetchingtrendingPlaylists = false;
        stateRef.trendingPlaylists = trendingPlaylists.data.concat(
          stateRef.trendingPlaylists
        );
      },
    });

  !loadingTrendingSongs &&
    !loadingTrendingAlbums &&
    !loadingTrendingPlaylists &&
    console.log(
      stateRef.trendingSongs,
      stateRef.trendingAlbums,
      stateRef.trendingPlaylists,
      "opp"
    );

  useEffect(() => {
    const options = {
      userId: id,
      category: `${activeTrendingSongs} ${activeTrendingAlbums} ${activeTrendingPlaylists}`,
    };
    // socket.volatile.emit("reportTrending", options);
    socket.on("connect", () => {
      //   socket.emit("reportTrending", options);
    });
    socket.on("trendingReport", (err, report) => {
      console.log("socket trending report ", err, report);
      if (err) return;
      report.trendingSongs &&
        cache.writeQuery({
          query: getTrendingSongsGQL,
          variables: stateRef.trendingSongsVar,
          data: {
            getAnalyticsReport: report,
          },
        });

      report.trendingAlbums &&
        cache.writeQuery({
          query: getTrendingAlbumsGQL,
          //   variables: trendingAlbumsVar,
          data: {
            getAnalyticsReport: report,
          },
        });

      // report.trendingPlaylists &&
      //   cache.writeQuery({
      //     query: getTrendingPlaylistsGQL,
      //     variables: trendingPlaylistsVar,
      //     data: {
      //       getAnalyticsReport: report,
      //     },
      //   });
    });
    return () => {
      socket.removeAllListeners("trendingReport");
      if (
        window.location.search.indexOf("query=") &&
        window.location.pathname.toLowerCase() === "/discover/result"
      ) {
        const query = {};
        for (let key in stateRef.variables) {
          stateRef.variables[key].pagination = {
            limit: 40,
          };
          query[key] = stateRef.variables[key];
        }
        if (Object.keys(query).length)
          dispatch({
            payload: query,
          });
      }
    };
  }, [
    cache,
    activeTrendingAlbums,
    activeTrendingSongs,
    activeTrendingPlaylists,
    socket,
    id,
    dispatch,
    stateRef,
  ]);
  const onScrollEnd = (key, index, hasEnded) => {
    index = index * 3 + 2;
    console.log(index, "scrolling...");
    index > stateRef.variables[key].scrollToIndex &&
      (stateRef.variables[key].scrollToIndex = index);
    if (hasEnded) {
      if (!stateRef[`refetching${key}`]) {
        stateRef[`refetching${key}`] = true;
        console.log("refetch albumddd ", stateRef[key].variables);
        stateRef.variables[key].pagination = {
          limit: 40,
          next: stateRef.variables[key].pagination.next,
        };
        console.log("refe ", stateRef.variables[key]);
        switch (key) {
          case "trendingPlaylists":
            return refetchPlaylists(stateRef.variables[key]);
          case "trendingAlbums":
            return refetchAlbums(stateRef.variables[key]);
          default:
            return refetchSongs(stateRef.variables[key]);
        }
      }
    }
  };

  return (
    <Box>
      {loadingTrendingSongs ||
      loadingTrendingAlbums ||
      loadingTrendingPlaylists ? (
        <Loading />
      ) : (
        <>
          {stateRef.trendingSongs.length ? (
            <CardCarousel
              leadsToProps={{
                primaryTitle: "Trending Songs",
                secondaryTitle:
                  "Updated hourly. Most played songs in the region",
                renderTabsBtn: true,
                activeTab: activeTrendingSongs,
                to: `/${path}/trending-songs`,
                handleAction: (_, info) => setActiveTrendingSongs(info),
              }}
              onScroll={(_index, hasEnded) =>
                onScrollEnd("trendingSongs", _index, hasEnded)
              }
            >
              <CompactLayout
                grid={3}
                list={stateRef.trendingSongs}
                primaryKey="title"
                secondaryKey="artist"
                path="song"
                queryMap={{
                  getType: "trendingSongs",
                  variables: stateRef.trendingSongsVar,
                }}
              />
            </CardCarousel>
          ) : null}

          {stateRef.trendingAlbums.length ? (
            <CardCarousel
              leadsToProps={{
                primaryTitle: "Trending Albums",
                secondaryTitle:
                  "Updated hourly. Most played albums in the region",
                renderTabsBtn: true,
                to: `/${path}/trending-albums`,
                handleAction: (_, info) => setActiveTrendingAlbums(info),
              }}
              onScroll={(_index, hasEnded) =>
                onScrollEnd("trendingAlbums", _index, hasEnded)
              }
              // emitScrollEndSentinel={280 * 4}
            >
              <BlockLayout
                noWrap
                grid={3}
                list={stateRef.trendingAlbums}
                primaryKey="name"
                secondaryKey="artist"
                path="album"
                queryMap={{
                  //   getType: "trendingAlbums",
                  //   variables: trendingAlbumsVar,
                  key: "album",
                }}
              />
            </CardCarousel>
          ) : null}

          {stateRef.trendingPlaylists.length ? (
            <CardCarousel
              leadsToProps={{
                primaryTitle: "Trending Playlists",
                secondaryTitle:
                  "Updated hourly. Most played playlists in the region",
                renderTabsBtn: true,
                to: `/${path}/trending-playlists`,
                handleAction: (_, info) => setActiveTrendingPlaylists(info),
              }}
              onScroll={(_index, hasEnded) =>
                onScrollEnd("trendingPlaylists", _index, hasEnded)
              }
            >
              <BlockLayout
                noWrap
                grid={3}
                list={stateRef.trendingPlaylists}
                primaryKey="name"
                secondaryKey="count"
                queryMap={{
                  key: "playlist",
                }}
              />
            </CardCarousel>
          ) : null}
        </>
      )}
    </Box>
  );
}

Discoveries.propTypes = {};

export default Discoveries;
