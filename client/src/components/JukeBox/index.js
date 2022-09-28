import React, { useRef, useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { useStateValue } from "../../provider";
import {
  deSerializeUserFromCookie,
  getCachedData,
  getErrMsg,
  handleIncludes,
  handleLoop,
  shuffleList,
} from "../../helpers";
import {
  SET_RADIO_PLAYING,
  SET_AUDIO_PLAYING,
  SET_CURRENT_FOOTER,
} from "../../provider/reducer";
import { gql, useApolloClient, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  Paper,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { HorizontalScroll, Wave } from "../Animations";
import { Link } from "react-router-dom";
import { AudioPlayer } from "./components";
import { MUSIC_PLAYER, RADIO_PLAYER } from "../../config";
import {
  getUserRecentPlaysGQL,
  getUserSongsGQL,
  getSongByIdGQL,
  getRadioByIdGQL,
  getPlaylistByIdGQL,
  getAlbumByIdGQL,
  getQueryResultGQL,
} from "../../api/apollo-gql";

function Index({ isActive }) {
  let [
    {
      audioPlaying,
      settings: {
        playback: { autoplay, closePlayer },
      },
    },
    dispatch,
  ] = useStateValue();
  const { cache } = useApolloClient();
  const user = deSerializeUserFromCookie();
  const [queueAnchor, setQueueAnchor] = useState(null);
  const [repeatMode, setRepeatMode] = useState(
    audioPlaying.repeatMode || "all"
  );
  const [shuffleMode, setShuffleMode] = useState(
    audioPlaying.shuffleMode || "off"
  );
  const [saveUserRecentPlays] = useMutation(
    gql`
      mutation saveUserRecentPlaysMutation(
        $mediaCollection: MediaCollectionInput!
      ) {
        saveUserRecentPlays(mediaCollection: $mediaCollection)
      }
    `,
    {
      onError(err) {
        getErrMsg(err, true);
      },
      onCompleted() {
        console.log("saved recent plays successs");
      },
    }
  );
  const stateRef = useRef({
    keys: {
      true: Date.now(),
      false: Date.now(),
    },
    streams: [],
  }).current;

  if (stateRef.streamType !== audioPlaying.getType) {
    stateRef.streamType = audioPlaying.getType;
    stateRef.streams = getCachedData(audioPlaying, cache);
  }

  const isMusic = audioPlaying.type === MUSIC_PLAYER;
  const _styles = {
    root: {
      py: 1,
      color: "#fff",
      height: "100%",
      width: "100%",
    },
    timer: {
      color: "#fff",
      width: "32px",
      fontSize: "11px",
      fontWeight: "400",
      alignSelf: "center",
    },
    info: {
      root: {
        mx: 1,
        flexGrow: {
          xs: 1,
          sm: 0,
        },
        maxWidth: {
          sm: "300px",
        },
      },
      wave: {
        display: {
          xs: "none",
        },
      },
      cover: {
        width: "30px",
        height: "30px",
        mx: 1,
      },
      action: {
        border: ({ palette: { background } }) =>
          `1px solid ${background.paper}`,
        display: {
          sm: "none",
        },
      },
    },
    link: {
      textDecoration: "none",
      color: "initial",
      overflow: "hidden",
      display: "inline-flex",
      alignItems: "center",
      flexGrow: 1,
    },
    grow: {
      flexGrow: 1,
    },
    my: {
      my: 1,
    },
    player: {
      root: {
        flexGrow: 1,
        display: {
          xs: "none",
          sm: "block",
        },
      },
      play: {
        border: ({ palette: { background } }) =>
          `1px solid ${background.paper}`,
        mx: 1,
      },
      volume: {
        width: "180px",
        display: {
          xs: "none",
          sm: "flex",
        },
      },
    },
  };
  const stream = stateRef.streams[audioPlaying.index];
  const onPlay = useCallback(() => {
    console.log("played...");
    stateRef.autoplay = false;
    stateRef.reset = false;
    audioPlaying.playState = "playing";
    audioPlaying.activeAudioId = stream.id;
    dispatch({
      type: SET_AUDIO_PLAYING,
      payload: audioPlaying,
    });
    return;
    let recent = cache.readQuery({
      query: getUserRecentPlaysGQL,
      variables: {
        mediaCollectionType: isMusic ? "songs" : "radios",
      },
    })?.getUserRecentPlays;
    const saveRecent = () => {
      // cache.writeQuery({
      //   query: getUserRecentPlaysGQL,
      //   variables: {
      //     mediaCollectionType: isMusic ? "songs" : "radios",
      //   },
      //   data: {
      //     getUserRecentPlays: recent
      //       ? recent.concat(stateRef.streams[audioPlaying.index])
      //       : [stateRef.streams[audioPlaying.index]],
      //   },
      // });
      saveUserRecentPlays({
        context: {
          headers: {
            authorization: `Bearer ${user.jwtToken}`,
          },
        },
        variables: {
          mediaCollection: {
            type: isMusic ? "songs" : "radios",
            payload: [audioPlaying.activeAudioId],
          },
        },
      });
    };
    if (recent) {
      handleIncludes(
        recent,
        audioPlaying.activeAudioId,
        (bool) => !bool && saveRecent()
      );
    } else saveRecent();
  }, [
    audioPlaying,
    dispatch,
    saveUserRecentPlays,
    isMusic,
    cache,
    user?.jwtToken,
    stream.id,
  ]);
  const onPlaying = useCallback(
    (audio) => {
      return;
      if (audio.paused || audioPlaying.playState !== "playing") return;
      audioPlaying.currentTime = audio.currentTime;
      dispatch({
        type: SET_AUDIO_PLAYING,
        payload: audioPlaying,
      });
    },
    [audioPlaying, dispatch]
  );
  const onPause = useCallback(
    (audio) => {
      audioPlaying.playState = "paused";
      // audioPlaying.currentTime = audio.currentTime;
      console.log("paused clicked...");
      dispatch({
        type: SET_AUDIO_PLAYING,
        payload: audioPlaying,
      });
    },
    [audioPlaying, dispatch]
  );

  const handleStop = useCallback(() => {
    if (isActive) {
      stateRef.autoplay = audioPlaying.playState === "playing" ? true : false;
      stateRef.reset = stateRef.streams.length === 1;
      audioPlaying.playState = "stoped";
      console.log("stopper ", audioPlaying.playState);
      dispatch({
        type: SET_AUDIO_PLAYING,
        payload: audioPlaying,
      });
    }
  }, [dispatch, audioPlaying, isActive]);

  const onClickNext = useCallback(
    (order) => {
      if (stateRef.streams.length - 1 === audioPlaying.index && order)
        return handleStop();
      audioPlaying.playState = "play";
      audioPlaying.index =
        stateRef.streams.length - 1 === audioPlaying.index
          ? 0
          : audioPlaying.index + 1;
      audioPlaying.activeAudioId = stateRef.streams[audioPlaying.index].id;
      dispatch({
        type: SET_AUDIO_PLAYING,
        payload: audioPlaying,
      });
    },
    [dispatch, audioPlaying, handleStop]
  );

  const onClickPrev = useCallback(() => {
    audioPlaying.playState = "play";
    audioPlaying.index =
      0 === audioPlaying.index
        ? stateRef.streams.length - 1
        : audioPlaying.index - 1;
    audioPlaying.activeAudioId = stateRef.streams[audioPlaying.index].id;
    dispatch({
      type: SET_AUDIO_PLAYING,
      payload: audioPlaying,
    });
  }, [dispatch, audioPlaying]);

  const onPlayError = useCallback((err) => {
    switch (err.code) {
      case err.MEDIA_ERR_ABORTED:
        console.log("You aborted the video playback.");
        break;
      case err.MEDIA_ERR_NETWORK:
        console.log("A network error caused the audio download to fail.");
        break;
      case err.MEDIA_ERR_DECODE:
        console.log(
          "The audio playback was aborted due to a corruption problem or because the video used features your browser did not support."
        );
        break;
      case err.MEDIA_ERR_SRC_NOT_SUPPORTED:
        console.log(
          "The audio was not loaded, either because the server or network failed or because the format is not supported."
        );
        break;
      default:
        console.log("An unknown error occurred.");
        break;
    }
  }, []);
  const onQueueClick = useCallback(({ currentTarget }) => {
    setQueueAnchor(currentTarget);
  }, []);

  useEffect(() => {
    if (audioPlaying.queue) {
      for (let key in audioPlaying.queue) {
        stateRef.streams.splice(
          audioPlaying.index + 1,
          0,
          audioPlaying.queue[key]
        );
      }
      dispatch({
        type: SET_AUDIO_PLAYING,
        payload: {
          queue: [],
        },
      });
    }
  }, [audioPlaying.queue, audioPlaying.index, stateRef, dispatch]);

  if (!stateRef.streams?.length) return null;

  return (
    <>
      <Stack alignItems="center" sx={_styles.root}>
        <Stack
          justifyContent="flex-start"
          alignItems="center"
          sx={_styles.info.root}
        >
          <Wave
            unset={
              audioPlaying.playState === "play" ||
              audioPlaying.playState === "stoped"
            }
            isPaused={audioPlaying.playState === "paused"}
            sx={{
              ..._styles.info.wave,
              display: "inline-flex",
            }}
          />
          <Link to={audioPlaying.viewPath || ""} style={_styles.link}>
            <Box component="img" src={stream.cover} sx={_styles.info.cover} />
            <Box sx={_styles.grow}>
              <HorizontalScroll>
                {isMusic ? stream.title : stream.name}
              </HorizontalScroll>
              <HorizontalScroll>
                {isMusic
                  ? stream.artist || "Unknown artist"
                  : stream.genres || stream.category}
              </HorizontalScroll>
            </Box>
          </Link>
        </Stack>
        <AudioPlayer
          src={isMusic ? stream.src : stream.url}
          key={audioPlaying.reset || stateRef.reset ? Date.now() : isMusic}
          startTime={audioPlaying.currentTime || 0}
          autoplay={
            audioPlaying.playState === "play"
              ? stateRef.autoplay
                ? true
                : autoplay
              : audioPlaying.playState !== "playing"
              ? false
              : true
          }
          flushStateOnStop={closePlayer}
          shuffleMode={shuffleMode}
          repeatMode={repeatMode}
          listenInterval={0}
          onListen={onPlaying}
          onClickPlay={onPlay}
          onClickPause={onPause}
          onClickNext={onClickNext}
          onClickPrev={onClickPrev}
          onClickRepeat={(mode) => setRepeatMode(mode)}
          onClickShuffle={(mode) => {
            setShuffleMode(mode);
            if (mode === "on") {
              stateRef._streams = stateRef.streams;
              stateRef.streams = shuffleList(
                stateRef.streams,
                stream,
                audioPlaying.index
              );
            } else if (stateRef._streams) {
              stateRef.streams = stateRef._streams;
              stateRef._streams = null;
            }
            dispatch({
              type: SET_AUDIO_PLAYING,
              payload: audioPlaying,
            });
          }}
          onError={onPlayError}
          onStop={handleStop}
          onQueueClick={onQueueClick}
          // enableDurationUI={isMusic}
          // enableShallowControlUI={isMusic}
        />
      </Stack>
      <Popover
        open={!!queueAnchor}
        anchorEl={queueAnchor}
        onClick={() => setQueueAnchor(null)}
      >
        <Paper>
          <Stack>
            <Typography>{stateRef.streams.length}</Typography>
            <Button>add to queue</Button>
          </Stack>
          <List>
            {stateRef.streams.map((s, i) => (
              <ListItem
                key={i}
                onClick={() => {
                  audioPlaying.index = i;
                  audioPlaying.activeAudioId = s.id;
                  dispatch({
                    type: SET_AUDIO_PLAYING,
                    payload: audioPlaying,
                  });
                }}
              >
                <ListItemButton>{s.title || s.name}</ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Popover>
    </>
  );
}

Index.propTypes = {};

export default Index;
