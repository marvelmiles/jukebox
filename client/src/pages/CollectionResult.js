import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import Container from "../../components/Container";
import SongsView from "../../components/SongsView";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  Popover,
  Typography,
} from "@mui/material";
import { PlayArrow, Sort } from "@mui/icons-material";
import {
  deSerializeUserFromCookie,
  getCachedData,
  getErrMsg,
} from "../../helpers";
import { useStateValue } from "../../provider";
import {
  REMOVE_SELECTIONS,
  SET_AUDIO_PLAYING,
  SET_SELECTIONS,
} from "../../provider/reducer";
import Pause from "@mui/icons-material/Pause";
import { useApolloClient, useLazyQuery } from "@apollo/client";
import {
  getAlbumSongsByIdGQL,
  getNullQueryGQL,
  getPlaylistSongsByIdGQL,
} from "../../api/apollo-gql";
// since the result pages are similar with a uniq getType
// i prefer using object-key, for dynamic ui than passing additional props
function SongsResult({
  getType,
  reportOne,
  categories = [],
  keyword,
  audioPlayer,
}) {
  const [
    {
      selectionLen,
      audioPlaying: { playState, rootGetType },
      hasQueryMapAction,
    },
    dispatch,
  ] = useStateValue();
  const [getCollectionSongs] = useLazyQuery(
    {
      playlists: getPlaylistSongsByIdGQL,
      albums: getAlbumSongsByIdGQL,
    }[keyword] || getNullQueryGQL,
    {
      onError(err) {
        console.log("has error...");
        getErrMsg(err, true);
      },
    }
  );
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [popoverGroup, setPopoverGroup] = useState({});
  const mainRef = useRef();
  const user =
    getType.indexOf("User") >= 0 ? deSerializeUserFromCookie() : undefined;
  const handlePopoverClose = () => {
    setPopoverAnchor(null);
    setPopoverGroup((prev) => ({
      anchorEl: null,
      openFor: "",
    }));
  };
  useEffect(() => {
    if (hasQueryMapAction) {
      setTimeout(() => {
        dispatch({
          type: SET_SELECTIONS,
          payload: {
            keyword,
            selection: {},
          },
        });
      }, 100);
    }
    // return () => {
    //   dispatch({
    //     type: REMOVE_SELECTIONS,
    //     payload: -1,
    //   });
    // };
  }, [dispatch, keyword, hasQueryMapAction]);

  console.log(keyword, "keyword......................................");
  const { cache } = useApolloClient();
  const variables = useMemo(
    () => ({
      report: reportOne,
      mediaCollectionType: reportOne,
      pagination: {
        limit: 100,
      },
      country: "",
      category: "",
    }),
    [reportOne]
  );
  const handlePlay = () => {
    switch (keyword) {
      case "radios":
      case "songs":
        return dispatch({
          type: SET_AUDIO_PLAYING,
          payload: {
            getType,
            reportOne,
            audioPlayer,
            playState: playState === "playing" ? "paused" : "play",
            variables,
          },
        });
      default:
        const id = getCachedData({ getType, variables }, cache)[1].id;
        return getCollectionSongs({
          variables: {
            id,
          },
          onCompleted(data) {
            const { getAlbumSongsById, getPlaylistSongsById } = data;
            if (!(getAlbumSongsById || getPlaylistSongsById).length)
              return console.log("collection have no song...");
            dispatch({
              type: SET_AUDIO_PLAYING,
              payload: {
                getType: {
                  playlists: "getPlaylistSongsById",
                  albums: "getAlbumSongsById",
                }[keyword],
                reportOne,
                rootGetType: getType,
                variables: {
                  id,
                },
                audioPlayer,
                activeCollectionId: id,
                playState: playState === "playing" ? "paused" : "play",
              },
            });
          },
        });
    }
  };
  return (
    <Container
      headerProps={{
        secondaryBar: null,
        mountCategoryBar: true,
        categoryBar: (
          <>
            <Box>
              {selectionLen === undefined ? (
                <>
                  <IconButton onClick={handlePlay}>
                    {playState === "playing" ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  {categories.map((c, i) => (
                    <Button key={i}>{c}</Button>
                  ))}
                  {user ? <Button>Add</Button> : null}
                </>
              ) : (
                <>
                  <Button variant="tab">Cancel</Button>
                  <Typography component="span">
                    Selected {selectionLen} {keyword}
                  </Typography>
                </>
              )}
              <IconButton
                onClick={({ currentTarget }) => {
                  setPopoverAnchor(currentTarget);
                }}
              >
                <Sort />
              </IconButton>
            </Box>
            {keyword ? <Typography></Typography> : null}
          </>
        ),
      }}
      ref={mainRef}
    >
      <SongsView
        getType={getType}
        reportOne={reportOne}
        category={variables.category}
        orderBy={variables.orderBy}
        scrollContainer={mainRef.current}
        keyword={keyword}
        key={keyword}
        audioPlayer={audioPlayer}
        variables={variables}
        handlePlay={handlePlay}
      />
      <Popover
        open={!!popoverAnchor}
        anchorEl={popoverAnchor}
        onClose={handlePopoverClose}
      >
        <List>
          <ListItem
            onClick={({ currentTarget }) =>
              setPopoverGroup({ openFor: "view", anchorEl: currentTarget })
            }
          >
            View
          </ListItem>
          <ListItem
            onClick={({ currentTarget }) =>
              setPopoverGroup({ openFor: "orderBy", anchorEl: currentTarget })
            }
          >
            Order By
          </ListItem>
          <ListItem
            onClick={() => {
              handlePopoverClose();
              dispatch({
                type: SET_SELECTIONS,
                payload: {
                  keyword,
                },
              });
            }}
          >
            Manage
          </ListItem>
        </List>
      </Popover>
      <Popover
        open={!!popoverGroup.anchorEl}
        anchorEl={popoverGroup.anchorEl}
        onClose={handlePopoverClose}
      >
        {
          {
            orderBy: (
              <>
                <ListItem
                  onClick={() =>
                    setVariables((prev) => ({
                      ...prev,
                      orderBy: "alphabetical",
                    }))
                  }
                >
                  Alphabetical
                </ListItem>
                <ListItem
                // onClick={() => {
                //   console.log("refer...........");
                //   setVariables((prev) => ({
                //     ...prev,
                //     orderBy: "plays",
                //   }));
                // }}
                >
                  No. of Plays
                </ListItem>
                {/* <ListItem>Date Added</ListItem> */}
              </>
            ),
            view: (
              <>
                <ListItem>Grid</ListItem>
                <ListItem>Detailed</ListItem>
              </>
            ),
          }[popoverGroup.openFor]
        }
      </Popover>
    </Container>
  );
}

SongsResult.propTypes = {};

export default SongsResult;
