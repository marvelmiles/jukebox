import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useLazyQuery, useQuery } from "@apollo/client";
import { getQueryResultGQL } from "../../api/apollo-gql";
import { getErrMsg, getCachedData, handleFilter } from "../../helpers";
import Container from "../../components/Container";
import { useStateValue } from "../../provider";
import { useApolloClient } from "@apollo/client";
import { CardCarousel, Loading } from "../../components/Animations";
import { BlockLayoutNavigator, DetailedLayout } from "../../components/Layouts";
export default function Results({ country, city, to }) {
  const [{ query }, dispatch] = useStateValue();
  const { cache } = useApolloClient();

  let [getQueryResult, { loading: loadingQueryResult, data: queryResult }] =
    useLazyQuery(getQueryResultGQL, {
      variables: {
        pagination: {
          limit: 10,
        },
      },
      onError(err) {
        getErrMsg(err, true);
      },
    });

  // useEffect(() => {
  //   console.log(query, " query...");
  //   if (query) {
  //     // for (let key in query) {
  //     //   if (key.toLowerCase().indexOf("album") >= 0)
  //     //     setAlbums(
  //     //       getCachedData({ type: key, variables: query[key] }, cache).slice(
  //     //         query[key].scrollToIndex || 0
  //     //       )
  //     //     );
  //     //   else if (key.toLowerCase().indexOf("playlist") >= 0)
  //     //     setPlaylists(
  //     //       getCachedData({ type: key, variables: query[key] }, cache).slice(
  //     //         query[key].scrollToIndex || 0
  //     //       )
  //     //     );
  //     //   else
  //     //     setSongs(
  //     //       getCachedData({ type: key, variables: query[key] }, cache).slice(
  //     //         query[key].scrollToIndex || 0
  //     //       )
  //     //     );
  //     // }
  //   }
  //   return () => {
  //     console.log("unmount...");
  //   };
  // }, [query, cache]);
  queryResult = queryResult?.getQueryResult;
  const onSearchQuery = useCallback(
    (query) => {
      getQueryResult({
        variables: { query },
      });
    },
    [getQueryResult]
  );
  return (
    <Container
      headerProps={{
        searchQueryProps: {
          to,
          onSearchQuery,
        },
      }}
    >
      {loadingQueryResult || !queryResult ? (
        <Loading />
      ) : (
        <>
          {queryResult.songs.data.length ? (
            <CardCarousel
              // onScroll={(index, hasEnded) =>
              //   onScroll("songs", index * 4, hasEnded)
              // }
              leadsToProps={{
                to: `/${to}/result/songs`,
              }}
            >
              <DetailedLayout list={queryResult.songs.data} grid={3} />
            </CardCarousel>
          ) : null}
          {queryResult.albums.data.length ? (
            <CardCarousel
              leadsToProps={{
                primaryTitle: "Albums",
                to: `/${to}/result/albums`,
              }}
              // onScroll={(index, hasEnded) =>
              //   onScroll("albums", index, hasEnded)
              // }
            >
              {queryResult.albums.data.map((a, i) => (
                <BlockLayoutNavigator
                  key={i}
                  to={`/album/${a.id}`}
                  primaryTitle="sssssssssss"
                  secondaryTitle="ddddddddddddddddddddddd"
                />
              ))}
            </CardCarousel>
          ) : null}

          {queryResult.playlists.data.length ? (
            <CardCarousel
              leadsToProps={{
                primaryTitle: "Playlists",
                to: `/${to}/result/playlists`,
              }}
            >
              {queryResult.playlists.data.map((a, i) => (
                <BlockLayoutNavigator key={i} />
              ))}
            </CardCarousel>
          ) : null}
        </>
      )}
    </Container>
  );
}
