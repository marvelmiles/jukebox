import { Box, IconButton, Slider, Stack } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import RepeatIcon from "@mui/icons-material/Repeat";
import RepeatOneIcon from "@mui/icons-material/RepeatOne";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import { QueueMusic } from "@mui/icons-material";

export const InputRange = ({
  min = "0",
  max = "100",
  value = "0",
  width,
  onInput = () => {},
  type = "custom",
  styles = {},
  onPointerOut,
  ...rest
}) => {
  return (
    <Box
      sx={{
        position: "relative",
        flexGrow: 1,
        height: "2px",
        backgroundColor: "rgb(105,105,170,.1)",
        margin: "15px 15px 0px 10px",
        border: "1px solid red",
        ...styles.root,
      }}
    >
      <input
        type="range"
        {...rest}
        min={min}
        max={max}
        value={value}
        // fires with every tick during change i.e what the slider is currently valued at
        // during the drag
        onInput={onInput}
        onTouchEnd={onPointerOut}
        onMouseUp={onPointerOut}
        style={{
          position: "absolute",
          width: "100%",
          top: "-10px",
          left: 0,
          cursor: "pointer",
          opacity: 0,
          backgroundColor: "transparent",
          zIndex: 1300,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          backgroundColor: "#36e2ec",
          width: `${value}%`,
          height: "100%",
          top: 0,
          left: `0%`,
          // transition: "1s linear",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: "5px",
          height: "5px",
          backgroundColor: "#36e2ec",
          borderRadius: "50%",
          left: `${value}%`,
          top: "-2px",
          // transition: "1s linear",
          "&::before": {
            content: `''`,
            position: "absolute",
            width: "15px",
            height: "15px",
            border: "1px solid #36e2ec",
            borderRadius: "50%",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            boxShadow: "inset 0px 0px 3px #36e2ec",
          },
        }}
      />
    </Box>
  );
};

export const AudioPlayer = ({
  src,
  autoplay,
  shuffleMode,
  repeatMode,
  disableAutoPlayEventListener = false,
  onClickNext,
  onClickPrev,
  onClickPlay,
  onClickPause,
  onClickShuffle,
  onClickRepeat,
  onListen,
  onError,
  onStop,
  listenInterval = 1000,
  reverseControlUI = false,
  enableShallowControlUI = true,
  enableDurationUI = true,
  startTime,
  flushStateOnStop = true,
  onQueueClick,
}) => {
  const [timer, setTimer] = useState(null);
  const [music, setMusic] = useState(null);
  const [pause, setPause] = useState(true);
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
        flexGrow: 1,
        maxWidth: {
          xs: "100%",
          lg: "300px",
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
  let stateRef = useRef({
    startTime,
  });
  stateRef = stateRef.current;
  const onMetaLoaded = useCallback(function (e) {
    console.log("metadata...");
    stateRef.startTime > 0 &&
      (e.target.currentTime =
        ((stateRef.startTime / e.target.duration) * 100 * e.target.duration) /
        100);
    stateRef.stoped = false;
    console.log("music setuped success..........");
    setMusic(e.target);
  }, []);
  const setupMusic = useCallback(() => {
    try {
      setPause(true);
      const audio = new Audio(src);
      audio.crossOrigin = "anonymous";
      audio.load();
      console.log(audio, "dd");
      audio.addEventListener("loadedmetadata", onMetaLoaded, false);
      typeof onError === "function" &&
        audio.addEventListener("error", (e) => onError(e.target.error), false);
    } catch (err) {
      typeof onError === "function" && onError(err);
    }
  }, [src, onError, onMetaLoaded]);

  const playTrack = useCallback(
    (emitFn = true) => {
      if (music) {
        stateRef.forcePlay = false;
        music
          .play()
          .then(() => {
            setPause(false);
            typeof onClickPlay === "function" && emitFn && onClickPlay(music);
          })
          .catch((err) => {
            typeof onError === "function" && onError(err);
          });
      } else if (stateRef.stoped) {
        stateRef.forcePlay = true;
        setupMusic();
      }
    },
    [music, onError, onClickPlay, setupMusic]
  );
  const pauseTrack = useCallback(
    (emitFn = true) => {
      if (music) {
        setPause(true);
        music.pause();
        typeof onClickPause === "function" && emitFn && onClickPause(music);
      }
    },
    [music, onClickPause]
  );

  const handleStop = useCallback(
    (endFn, calcFn) => {
      if (music) {
        endFn && music.removeEventListener("ended", endFn, false);
        calcFn && music.removeEventListener("timeupdate", calcFn, false);
        console.log("stopping...");
        stateRef.stoped = true;
        music.currentTime = 0;
        pauseTrack(false);
        if (flushStateOnStop) {
          setMusic(null);
          setTimer(null);
        }
        typeof onStop === "function" && onStop();
      }
    },
    [music, onStop, pauseTrack, flushStateOnStop]
  );
  const handleRepeatMode = useCallback(() => {
    music._handleRepeat = null;
    music._dragging = null;
    handleStop();
    switch (repeatMode) {
      case "all":
      case "order":
        typeof onClickNext === "function" &&
          onClickNext(repeatMode === "order");
        return;
      case "one":
        setupMusic();
        playTrack();
        break;
      default:
        break;
    }
  }, [music, onClickNext, repeatMode, handleStop, setupMusic, playTrack]);

  useEffect(() => {
    setupMusic();
  }, [setupMusic]);
  useEffect(() => {
    let endFn, calcFn;
    if (music) {
      endFn = () => {
        if (music._dragging === "forward") {
          music._handleRepeat = true;
        } else handleRepeatMode();
      };
      calcFn = (e) => {
        if (enableDurationUI) {
          let dur = music.duration;
          let dur_min = Math.floor(dur / 60);
          let dur_sec = Math.floor(dur % 60);
          if (dur_sec < 10) dur_sec = `0${dur_sec}`;

          let curr = music.currentTime;
          let curr_min = Math.floor(curr / 60);
          let curr_sec = Math.floor(curr % 60);
          if (curr_sec < 10) curr_sec = `0${curr_sec}`;
          setTimer((prev) => ({
            ...prev,
            duration: {
              min: dur_min,
              sec: dur_sec,
            },
            current: {
              min: curr_min,
              sec: curr_sec,
            },
            //learn-more
            seek: String((music.currentTime / music.duration) * 100),
          }));
        }
        if (typeof onListen === "function") {
          onListen(music);
        }
      };
      music.addEventListener("ended", endFn, false);
      music.addEventListener("timeupdate", calcFn, false);
    }
    return () => {
      if (music) {
        music.removeEventListener("ended", endFn, false);
        music.removeEventListener("timeupdate", calcFn, false);
        music.removeEventListener("loadedmetadata", onMetaLoaded, false);
      }
    };
  }, [
    music,
    onClickNext,
    repeatMode,
    enableDurationUI,
    handleRepeatMode,
    handleStop,
    onListen,
    listenInterval,
    onMetaLoaded,
  ]);
  useEffect(() => {
    if (music) {
      console.log(autoplay, "autoplay...");
      if (autoplay || stateRef.forcePlay) playTrack(true);
      else pauseTrack(false);
    }
    return () => {
      if (music) {
        stateRef.hasMounted = false;
        music.pause();
      }
    };
  }, [autoplay, playTrack, pauseTrack, music]);

  return (
    <Stack
      direction={reverseControlUI ? "column-reverse" : "column"}
      sx={{
        flexGrow: {
          xs: 0,
          sm: 1,
        },
        border: "1px solid red",
      }}
    >
      <Stack
        sx={{
          flexGrow: 1,
          border: "1px solid purple",
          width: "100%",
        }}
      >
        <Stack
          variant="flex-center"
          sx={{
            ..._styles.my,
            flexGrow: 1,
            ml: {
              xs: 5,
              lg: 0,
            },
          }}
        >
          {enableShallowControlUI && (
            <>
              {repeatMode === "one" ? (
                <IconButton onClick={() => onClickRepeat("order")}>
                  one
                </IconButton>
              ) : repeatMode === "order" ? (
                <IconButton onClick={() => onClickRepeat("all")}>
                  order
                </IconButton>
              ) : repeatMode === "all" ? (
                <IconButton
                  sx={{
                    backgroundColor: "primary.light",
                    "&:hover": {
                      backgroundColor: "primary.light",
                    },
                  }}
                  onClick={() => onClickRepeat("off")}
                >
                  all
                </IconButton>
              ) : (
                <IconButton
                  sx={{
                    backgroundColor: "primary.light",
                    "&:hover": {
                      backgroundColor: "primary.light",
                    },
                  }}
                  onClick={() => onClickRepeat("one")}
                >
                  off
                </IconButton>
              )}
            </>
          )}

          <IconButton
            onClick={() => {
              handleStop();
              onClickPrev();
            }}
          >
            <SkipPreviousIcon />
          </IconButton>

          {pause ? (
            <IconButton
              onClick={playTrack}
              sx={{
                ..._styles.player.play,
                border: pause ? "2px solid red" : "2px solid #ff",
              }}
            >
              <PlayArrowIcon />
            </IconButton>
          ) : (
            <IconButton onClick={pauseTrack} sx={_styles.player.play}>
              <PauseIcon />
            </IconButton>
          )}
          <IconButton
            onClick={() => {
              handleStop();
              onClickNext();
            }}
          >
            <SkipNextIcon />
          </IconButton>

          {enableShallowControlUI && (
            <>
              {shuffleMode === "off" ? (
                <IconButton onClick={() => onClickShuffle("on")}>
                  <ShuffleIcon />
                </IconButton>
              ) : (
                <IconButton
                  sx={{
                    backgroundColor: "primary.light",
                    "&:hover": {
                      backgroundColor: "primary.light",
                    },
                  }}
                  onClick={() => onClickShuffle("off")}
                >
                  <ShuffleIcon />
                </IconButton>
              )}
            </>
          )}
        </Stack>

        <Stack
          variant="flex-center"
          sx={{
            border: "1px solid red",
            // mt: "3px",
          }}
        >
          <IconButton>
            <VolumeDownIcon />
          </IconButton>
          <IconButton onClick={onQueueClick}>
            <QueueMusic />
          </IconButton>
          <InputRange
            styles={{
              root: {
                width: "250px",
                display: {
                  xs: "none",
                },
              },
            }}
          />
        </Stack>
      </Stack>
      {enableDurationUI && (
        <Stack
          variant="flex-center"
          sx={{
            width: "100%",
            maxWidth: "700px",
            mx: "auto",
          }}
        >
          <Box component="span" sx={_styles.timer}>
            {timer ? `${timer.current.min}:${timer.current.sec}` : "0:00"}
          </Box>
          {/*learn-more*/}
          <InputRange
            value={
              timer?.seek >= 0
                ? timer?.seek
                : music & startTime
                ? String((startTime / music.duration) * 100)
                : "0"
            }
            onPointerOut={() => {
              if (!pause) {
                if (music._handleRepeat && music._dragging === "forward")
                  handleRepeatMode();
                else music._dragging = null;
              }
            }}
            onInput={(e) => {
              //learn-more
              if (music) {
                const ctime = (e.target.value * music.duration) / 100;
                if (ctime >= 0) music.currentTime = ctime;
                if (!pause) {
                  if (Math.floor(ctime) < Math.floor(music.duration)) {
                    music._dragging = "backward";
                    playTrack(false);
                  } else
                    music._dragging =
                      music._dragging === null ? null : "forward";
                }
              }
            }}
          />
          <Box component="span" sx={_styles.timer}>
            {timer ? `${timer.duration.min}:${timer.duration.sec}` : `0:00`}
          </Box>
        </Stack>
      )}
    </Stack>
  );
};
