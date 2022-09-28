import { Box } from "@mui/material";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CardCarousel } from "../../components/Animations";
import Container from "../../components/Container";
import AlbumsBG from "../../assets/images/explore-albums-bg.jpg";
import ArtistsBG from "../../assets/images/explore-artists-bg.jpg";
import { LeadTo } from "../../components/Navigation";
import Discoveries from "../../components/Discoveries";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import {
  getAnalyticsReportGQL,
  getTopSearchedSongsGQL,
  reportAnalyticsGQL,
} from "../../api/apollo-gql";
import { deSerializeUserFromCookie, getErrMsg } from "../../helpers";
import { useStateValue } from "../../provider";
import { io } from "socket.io-client";
import { CompactLayout } from "../../components/Layouts";
export default function Home() {
  const { cache } = useApolloClient();
  let [{ socket, audioPlaying }] = useStateValue();
  const analyticsVariables = useMemo(
    () => ({
      report:
        "topSearchedSongs topSearchedArtists topSearchedAlbums topSearchedPlaylists",
      limit: 4,
    }),
    []
  );
  // let socket = useRef(io.connect("http://localhost:8080/")).current;
  // useEffect(() => {
  //   socket.on("connect", () => {
  //     socket.emit("reportTopSearched");
  //   });
  //   socket.on("topSearchedReport", (err, report) => {
  //     console.log("socket top report ");
  //     if (err) return;
  //     cache.writeQuery({
  //       query: getAnalyticsReportGQL,
  //       variables: analyticsVariables,
  //       data: {
  //         getAnalyticsReport: report,
  //       },
  //     });
  //   });
  //   // console.log("SSS");
  //   return () => {
  //     socket.removeAllListeners("topSearchedReport");
  //   };
  // }, [socket, analyticsVariables, cache]);

  const user = deSerializeUserFromCookie();
  const [reportAnalytics] = useMutation(reportAnalyticsGQL, {
    context: {
      headers: {
        authorization: `Bearer ${user.jwtToken}`,
      },
    },
    onError(err) {
      getErrMsg(err, true);
    },
    onCompleted() {
      console.log("reported successfully...");
    },
  });

  let { loading: loadingReports, data: analyticsReport } = useQuery(
    getAnalyticsReportGQL,
    {
      variables: analyticsVariables,
      onError(err) {
        getErrMsg(err, true);
      },
    }
  );
  analyticsReport = analyticsReport?.getAnalyticsReport;
  const _styles = {
    top: {
      bg: {
        background: `linear-gradient(rgba(11,19,32,0.8777) 100%, rgba(11,19,32,0.8777) 100%),url(${AlbumsBG})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        backgroundPosition: "center center",
        borderRadius: 2,
        mx: 1,
      },
    },
  };
  console.log(analyticsReport, "anaal");
  return (
    <Container
      headerProps={{
        activeTab: "explore",
        secondaryBar: null,
      }}
    >
      <CardCarousel renderArrowBtnOnly>
        {loadingReports || !analyticsReport ? (
          <div>loading....</div>
        ) : (
          <>
            {analyticsReport.topSearchedSongs ? (
              <Box sx={_styles.top.bg}>
                <LeadTo
                  primaryTitle="Top Searched Songs"
                  secondaryTitle="Updated Hourly."
                  to={"/explore/top-searched-songs"}
                  navState={{}}
                />
                <CompactLayout
                  query={{
                    type: "getAnalyticsReport",
                    variables: analyticsVariables,
                    key: "topSearchedSongs",
                  }}
                  isStream={true}
                  list={analyticsReport.topSearchedSongs}
                  primaryTitle="ddd"
                  path="explore"
                  view="song"
                  primaryKey="title"
                  secondaryKey="count"
                  onSelected={({ id }) => {
                    reportAnalytics({
                      variables: {
                        id,
                        collection: "songs",
                        operation: "query",
                      },
                    });
                  }}
                />
              </Box>
            ) : null}
            {analyticsReport.topSearchedAlbums ? (
              <Box sx={_styles.top.bg}>
                <LeadTo
                  primaryTitle="Top Searched Albums"
                  secondaryTitle="Updated Hourly."
                  to={"/explore/top-searched-albums"}
                />
                <CompactLayout
                  isStream={true}
                  list={analyticsReport.topSearchedAlbums}
                  primaryTitle="ddd"
                />
              </Box>
            ) : null}
            {false && analyticsReport.topSearchedPlaylists ? (
              <Box sx={_styles.top.bg}>
                <LeadTo
                  primaryTitle="Top Searched Playlists"
                  secondaryTitle="Updated Hourly."
                  to="/explore/top-searched-playlists"
                />
                <CompactLayout
                  isStream={true}
                  list={Array.from(new Array(4))}
                  primaryTitle="ddd"
                />
              </Box>
            ) : null}
            {false && analyticsReport.topSearchedArtists ? (
              <Box sx={_styles.top.bg}>
                <LeadTo
                  primaryTitle={analyticsReport.topSearchedArtists[0].username}
                  secondaryTitle="Updated Hourly."
                  to="/explore/top-searched-artists"
                />
                <CompactLayout
                  list={Array.from(new Array(4))}
                  primaryTitle="ddd"
                  query={{
                    type: "getAnalyticsReport",
                    key: "topSearchedSongs",
                    variables: analyticsVariables,
                  }}
                />
              </Box>
            ) : null}
          </>
        )}
      </CardCarousel>

      <Discoveries path="explore" country="all" />
    </Container>
  );
}
