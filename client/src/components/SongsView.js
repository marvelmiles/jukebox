import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useApolloClient, useQuery } from "@apollo/client";
import { getGQL } from "../api/apollo-gql";
import { getErrMsg, handleSort } from "../helpers";
import { DetailedComp } from "./Layouts";
import {
  Box,
  IconButton,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import { useStateValue } from "../provider";
import {
  REMOVE_SELECTIONS,
  SET_AUDIO_PLAYING,
  SET_SELECTIONS,
} from "../provider/reducer";

function SongsView({
  getType,
  reportOne,
  country,
  category,
  orderBy = "alphabetical",
  scrollContainer,
  variant,
  layout,
  audioPlayer,
  keyword,
  variables,
  handlePlay,
  isSelectionMode,
}) {
  const [
    {
      selectionList,
      audioPlaying: { activeAudioId, playState },
    },
    dispatch,
  ] = useStateValue();
  const { cache } = useApolloClient();
  const stateRef = useRef({
    hasSorted: false,
    prevScrollPos: 0,
    data: [],
  }).current;

  const [data, setData] = useState({
    [reportOne]: [],
  });

  let { loading, refetch: refetchSongs } = useQuery(
    getGQL(reportOne, "") || getGQL(getType),
    {
      variables: variables,
      onError(err) {
        getErrMsg(err, true);
      },
      onCompleted(data) {
        console.log(data[getType]);
        if (stateRef.hasSorted) {
          stateRef.hasSorted = false;
          return console.log("successfully comp");
        }
        if (stateRef.isPaginating) {
          console.log("refecth completed.... ");
          data = data[getType][reportOne];
          stateRef[reportOne] = {
            pagination: data.pagination,
            data: stateRef[reportOne].data.concat(data[reportOne].data),
            __typename: data[reportOne].__typename,
          };
          stateRef.isPaginating = false;
          this.client.cache.writeQuery({
            query: getGQL(getType),
            variables,
            data: {
              [getType]: {
                [reportOne]: stateRef.songs,
                __typename: data.__typename,
              },
            },
            broadcast: false,
          });
        } else
          handleSort(
            data[getType].data || data[getType][reportOne].data,
            orderBy,
            (songs) => {
              // stateRef[reportOne].data = songs;
              // stateRef[reportOne].hasSorted = true;
              // setData(songs);
              // for (let key in songs) {
              //   const arr = [];
              //   let t = 0;
              //   for (let i = 0; i < 30; i++) {
              //     t++;
              //     if (t > songs[key].length - 1) t = 0;
              //     arr.push(songs[key][t]);
              //   }
              //   songs[key] = songs[key].concat(arr);
              // }
              stateRef.pagination =
                data[getType].pagination || data[getType][reportOne].pagination;
              setData(songs);
              stateRef.hasSorted = true;
              const reduceData = () => {
                let arr = [];
                for (let key in songs) {
                  arr = arr.concat(songs[key]);
                }
                return arr;
              };
              this.client.cache.writeQuery({
                query: getGQL(reportOne, "") || getGQL(getType),
                variables,
                data: data[getType].data
                  ? {
                      [getType]: {
                        ...data[getType],
                        data: reduceData(),
                      },
                    }
                  : {
                      [getType]: {
                        ...data[getType],
                        [reportOne]: {
                          ...data[getType][reportOne],
                          data: reduceData(),
                        },
                      },
                    },
              });
            }
          );
      },
    }
  );
  const onScroll = (hasEnded) => {
    // if (hasEnded && !stateRef.isPaginating) {
    //   console.log("has end ", stateRef.songs.pagination.next);
    //   stateRef.isPaginating = true;
    //   variables.pagination.next = stateRef.songs.pagination.next;
    //   refetchSongs(variables);
    // }
  };
  useEffect(() => {
    const onScroll = (e) => {
      if (scrollContainer) {
        if (stateRef.prevScrollPos < e.target.scrollTop) return;
        if (
          e.target.scrollTop + e.target.clientHeight / 4 >=
          e.target.scrollHeight - e.target.clientHeight
        ) {
          stateRef.prevScrollPos = e.target.scrollTop;
          refetchSongs();
        }
      } else if (
        window.scrollY > stateRef.prevScrollPos &&
        window.innerHeight + window.scrollY + window.innerHeight / 4 >=
          Math.max(
            document.body.offsetHeight,
            document.body.scrollHeight,
            document.body.clientHeight
          )
      ) {
        stateRef.prevScrollPos = window.scrollY;
        refetchSongs();
      }
      if (!onScroll) return;
    };
    (scrollContainer || window).addEventListener("scsoll", onScroll, false);
    return () =>
      (scrollContainer || window).removeEventListener(
        "scroll",
        onScroll,
        false
      );
  }, [scrollContainer, refetchSongs, stateRef]);

  // useEffect(() => {
  //   if (orderBy && stateRef.pagination && !stateRef.hasSorted) {
  //     console.log("sorting.......");
  //     handleSort(
  //       // (cache
  //       //   .readQuery({
  //       //     query: getGQL(reportOne, "") || getGQL(getType),
  //       //     variables,
  //       //   })
  //       //   [getType])(reportOne ? ["data"] : [reportOne].data),
  //       [],
  //       orderBy,
  //       (data) => setData(data)
  //     );
  //   } else stateRef.hasSorted = false;
  // }, [orderBy, stateRef, cache, getType, reportOne, variables]);
  const _renderView = (c, index) => {
    const handleAction = (action, props) => {
      switch (action) {
        case "playPauseAudio":
          return handlePlay
            ? handlePlay()
            : dispatch({
                type: SET_AUDIO_PLAYING,
                payload: {
                  getType,
                  reportOne,
                  variables,
                  index,
                  activeAudioId: c.id,
                  audioPlayer,
                  playState: playState === "playing" ? "paused" : "play",
                },
              });
        default:
          c.index = index;
          return dispatch(
            props
              ? {
                  type: REMOVE_SELECTIONS,
                  payload: c.id,
                }
              : {
                  type: SET_SELECTIONS,
                  payload: {
                    selection: c,
                  },
                  keyword: isSelectionMode ? "" : keyword,
                }
          );
      }
    };
    switch (layout) {
      default:
        return (
          <DetailedComp
            c={c}
            index={index}
            key={index}
            activeId={activeAudioId}
            isPlaying={playState === "playing"}
            isSelectionMode={!!selectionList || isSelectionMode}
            checked={!!selectionList?.[c.id]}
            handleAction={(action, props) => handleAction(action, props)}
          />
        );
    }
  };

  return (
    <Stack sx={{ border: "1px solid green" }}>
      <Box sx={{ flexGrow: 1 }}>
        {Object.keys(data).map((group, i) => {
          return (
            <Box key={i}>
              {orderBy === "alphabetical" ? (
                <Box sx={{ border: "1px solid pink" }}>{group}</Box>
              ) : null}
              <List>
                {data[group].map((c = {}, j) => {
                  const index = i > 0 ? i + 2 + j : i + j;
                  return _renderView(c, index);
                })}
              </List>
            </Box>
          );
        })}
      </Box>
      {orderBy === "alphabetical" ? (
        <Box sx={{ border: "1px solid red" }}>
          {Object.keys(data).map((group, i) => {
            return <Typography key={i}>{group}</Typography>;
          })}
        </Box>
      ) : null}
    </Stack>
  );
}

SongsView.propTypes = {};

export default SongsView;
