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

  const stateRef = useRef({
    query: "",
    pagination: {
      songs: { hasNext: "", next: "" },
    },
  }).current;
  let [
    getQueryResult,
    { loading: loadingQueryResult, refetch: refetchQueryResult },
  ] = useLazyQuery(getQueryResultGQL, {
    onError(err) {
      getErrMsg(err, true);
    },
    onCompleted({ getQueryResult }) {
      if (stateRef.queryResult && stateRef.isScrolling) {
        let selection;
        for (let key in getQueryResult) {
          if (getQueryResult[key]?.data) {
            selection = key;
            break;
          }
        }
        stateRef.queryResult = {
          ...stateRef.queryResult,
          [selection]: {
            pagination: getQueryResult[selection].pagination,
            data: stateRef.queryResult[selection].data.concat(
              getQueryResult[selection].data
            ),
          },
        };
        cache.writeQuery({
          query: getQueryResultGQL,
          variables: { query: stateRef.query },
          data: {
            getQueryResult: stateRef.queryResult,
          },
          broadcast: false,
        });
      } else stateRef.queryResult = getQueryResult;
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
  const queryResult = stateRef.queryResult;
  console.log(queryResult, "qr...");
  const onScroll = async (key, index, hasEnded) => {
    if (!stateRef[`refetching${key}`]) {
      stateRef[`refetching${key}`] = true;
      stateRef.refresh = true;
      stateRef.isScrolling = true;
      if (!queryResult[key]) return;
      if (queryResult[key].pagination.hasNext || true) {
        console.log(
          key,
          (
            await refetchQueryResult({
              query: stateRef.query,
              mediaCollectionType: key,
              pagination: {
                limit: 20,
                next: queryResult[key].pagination.next,
              },
            })
          ).data
        );

        // result.data.concat(queryResult[key].data);
        // cache.writeQuery({
        //   query: getQueryResultGQL,
        //   variables: {
        //     query: stateRef.query,
        //   },
        //   data: {
        //     getQueryResult: {
        //       ...queryResult,
        //       [key]: result,
        //     },
        //   },
        // });
      }
    }
  };
  // data?.getQueryResult && console.log(data.getQueryResult, "result...");
  // previousData?.getQueryResult &&
  //   console.log(previousData.getQueryResult, "rev data");
  const onSearchQuery = useCallback(
    async (query, init) => {
      console.log("in query............ ", query);
      stateRef.query = query;
      stateRef.isScrolling = false;
      await getQueryResult({
        variables: { query },
      });

      // if (typeof stateRef.query === "string") {
      //   const data = cache.readQuery({
      //     query: getQueryResultGQL,
      //     variables: { query: "" },
      //   })?.getQueryResult;
      //   if (data) {
      //     for (let key in {
      //       songs: "songs",
      //       // albums: "albums",
      //       // playlists: "playlists",
      //     }) {
      //       handleFilter(
      //         data[key].data.slice(stateRef.songsOffset || 0),
      //         query,
      //         (_data) => {
      //           console.log(_data, " ", key);
      //           cache.writeQuery({
      //             query: getQueryResultGQL,
      //             variables: { query: "" },
      //             data: {
      //               getQueryResult: {
      //                 ...data,
      //                 [key]: {
      //                   ...data[key],
      //                   data: _data,
      //                 },
      //               },
      //             },
      //             broadcast: true,
      //           });
      //         }
      //       );
      //     }
      //   }
      // }
      // stateRef.query = query;
    },
    [cache, getQueryResult, stateRef]
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
              onScroll={(index, hasEnded) =>
                onScroll("songs", index * 4, hasEnded)
              }
              leadsToProps={{
                to: `/${to}/result/songs/`,
              }}
            >
              <DetailedLayout list={queryResult.songs.data} grid={3} />
            </CardCarousel>
          ) : null}
          {queryResult.albums.data.length ? (
            <CardCarousel
              leadsToProps={{
                primaryTitle: "Albums",
              }}
              onScroll={(index, hasEnded) =>
                onScroll("albums", index, hasEnded)
              }
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
