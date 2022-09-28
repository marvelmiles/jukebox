import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useStateValue } from "../provider";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { HorizontalScroll, Wave } from "./Animations";
import { LAYOUT, MUSIC_PLAYER } from "../config";
import { useEffect, useRef, useState } from "react";
import {
  REMOVE_SELECTIONS,
  SET_DIALOG,
  SET_POPOVER,
  SET_SELECTIONS,
  SET_AUDIO_PLAYING,
} from "../provider/reducer";
import PauseIcon from "@mui/icons-material/Pause";
import { Link } from "react-router-dom";
import AlbumCoverSm from "../assets/images/album-cover-sm.jpg";
import {
  useApolloClient,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
import {
  addToUserFavGQL,
  getAlbumSongsByIdGQL,
  getGQL,
  getNullQueryGQL,
  getPlaylistSongsByIdGQL,
  getUserPlaylistsGQL,
  removeFromUserFavGQL,
} from "../api/apollo-gql";
import {
  deSerializeUserFromCookie,
  getCachedData,
  getErrMsg,
  splitArrayIntoChunksOfLen,
} from "../helpers";
import { SearchQueryForm } from "./Forms";
import DownloadIcon from "@mui/icons-material/Download";
import { LinkWithQuery } from "./Navigation";
import {
  CheckBox,
  CheckBoxOutlineBlank,
  Favorite,
  Headset,
  HeartBroken,
  MoreHoriz,
} from "@mui/icons-material";
import PlayArrow from "@mui/icons-material/PlayArrow";
import SelectionToolBox from "./SelectionToolBox";
import useTouchDevice from "../hooks/useTouchDevice";
import Pause from "@mui/icons-material/Pause";

export const BlockLayout = ({
  noWrap,
  list,
  queryMap,
  audioPlayer = MUSIC_PLAYER,
}) => {
  const [
    { selectionList, hasQueryMapAction, audioPlaying, settings },
    dispatch,
  ] = useStateValue();
  const [getCollectionSongs] = useLazyQuery(
    {
      playlist: getPlaylistSongsByIdGQL,
      album: getAlbumSongsByIdGQL,
    }[queryMap.key] || getNullQueryGQL,
    {
      onError(err) {
        console.log("has error...");
        getErrMsg(err, true);
      },
    }
  );
  return (
    <Stack
      flexWrap={noWrap ? "nowrap" : "wrap"}
      sx={{ border: "1px solid green" }}
    >
      {list.map((c = {}, i) => (
        <Box
          key={i}
          sx={{
            position: "relative",
            minWidth: "180px",
            width: "90%",
            maxWidth: "180px",
            ml: 1,
          }}
        >
          {hasQueryMapAction && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: "100%",
                backgroundColor: "rgba(0,0,0,0)",
                zIndex: 1,
                borderRadius: "inherit",
              }}
            >
              {selectionList?.[c.id] >= 0 ? (
                <IconButton
                  sx={{
                    position: "relative",
                    top: "25%",
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                  onClick={() =>
                    dispatch({
                      type: REMOVE_SELECTIONS,
                      payload: c.id,
                    })
                  }
                >
                  <CheckBox />
                </IconButton>
              ) : (
                <IconButton
                  sx={{
                    position: "relative",
                    top: "25%",
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                  onClick={() => {
                    dispatch({
                      type: SET_SELECTIONS,
                      payload: {
                        selection: {
                          id: c.id,
                          index: i,
                        },
                        queryMap,
                      },
                    });
                  }}
                >
                  <CheckBoxOutlineBlankIcon />
                </IconButton>
              )}
            </Box>
          )}
          <Card
            sx={{
              minWidth: "100%",
              p: 1,
            }}
            elevation={0}
          >
            <Box sx={{ position: "relative" }}>
              <Link to={`/${queryMap.key}/${c.id}`}>
                <CardMedia component="img" image={AlbumCoverSm} />
              </Link>
              {audioPlaying?.type === audioPlayer &&
              audioPlaying?.collectionId === c.id &&
              settings?.playback?.enableInterfaceControl &&
              audioPlaying?.playState === "playing" ? (
                <IconButton
                  sx={{
                    width: "50px",
                    height: "50px",
                    position: "absolute",
                    bottom: "-15px",
                    left: "-5px",
                  }}
                  onClick={() => {
                    audioPlaying.playState = "paused";
                    dispatch({
                      type: SET_AUDIO_PLAYING,
                      payload: audioPlaying,
                    });
                  }}
                >
                  <PauseIcon />
                </IconButton>
              ) : (
                <IconButton
                  sx={{
                    width: "50px",
                    height: "50px",
                    position: "absolute",
                    bottom: "-15px",
                    left: "-5px",
                  }}
                  onClick={() => {
                    getCollectionSongs({
                      variables: {
                        id: c.id,
                      },
                      onCompleted({ getAlbumSongsById, getPlaylistSongsById }) {
                        console.log(getAlbumSongsById, getPlaylistSongsById);
                        if (!(getAlbumSongsById || getPlaylistSongsById).length)
                          return console.log("collection have no song...");
                        dispatch({
                          type: SET_AUDIO_PLAYING,
                          payload: {
                            query: {
                              type: {
                                playlist: "getPlaylistSongsById",
                                album: "getAlbumSongsById",
                              }[queryMap.key],
                              variables: {
                                id: c.id,
                              },
                            },
                            type: audioPlayer,
                            playState: "play",
                            collectionId: c.id,
                          },
                        });
                      },
                    });
                  }}
                >
                  <PlayArrow />
                </IconButton>
              )}
              {true && (
                <IconButton
                  sx={{
                    alignSelf: "flex-end",
                    position: "absolute",
                    bottom: "-15px",
                    right: "-8px",
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              )}
            </Box>
            <CardContent sx={{ p: 0, mt: "15px" }}>
              <Link to={`/${queryMap.key}/${c.id}`}>
                <Typography>The seconda delxue wave</Typography>
                <Typography variant="subtitle2">Ruger</Typography>
              </Link>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Stack>
  );
};

export const DetailedLayout = ({
  list,
  onInputCheck,
  audioPlayer = MUSIC_PLAYER,
  onSelected,
  queryMap,
  emptyScreen,
  selectionMode,
  selectionList,
  grid,
  onScroll,
}) => {
  const [{ selectionList: SLIST, audioPlaying, settings }, dispatch] =
    useStateValue();
  const { isTouchDevice } = useTouchDevice();
  const [dialogGroup, setDialogGroup] = useState({});
  const cache = useApolloClient();
  const _styles = {
    root: {
      width: "100%",
      display: "flex",
      mb: 2,
      p: 1,
      "&:hover": {
        backgroundColor: "primary.light",
        transition: "backgroundColor .3s linear",
        "& .song-check-box": {
          display: "inline-flex",
        },
      },
      transition: "backgroundColor .3s linear",
      "&:nth-of-type(2)": {
        backgroundColor: "primary.main",
        transition: "backgroundColor .3s linear",
        "&:hover": {
          backgroundColor: "primary.light",
          transition: "backgroundColor .3s linear",
        },
      },
    },
    listBox: {
      display: "flex",
      flexDirection: {
        xs: "column",
        s1024: "row",
      },
      justifyContent: {
        xs: "normal",
        s1024: "space-around",
      },
      flexGrow: 1,
      overflow: "hidden",
      width: {
        s320: "calc(100% - 120px)",
        sm: "calc(100% - 150px)",
      },
      position: "relative",
    },
    icon: { fontSize: "25px", mx: "5px" },
    dot: {
      minWidth: "3px",
      width: "3px",
      maxWidth: "3px",
      minHeight: "3px",
      height: "3px",
      maxheight: "3px",
      borderRadius: "50%",
      backgroundColor: "#fff",
      mx: 1,
      display: {
        xs: "block",
        s1024: "none",
      },
    },
    info: {
      justifyContent: "space-around",
      alignItems: "center",
      width: {
        xs: "100%",
        s1024: "50%",
      },
      "& > div": {
        px: 1,
        width: {
          xs: "calc(50% - 3px)",
          s1024: "50%",
        },
        maxWidth: {
          xs: "calc(50% - 3px)",
          s1024: "50%",
        },
      },
    },
    year: {
      mx: 1,
      display: {
        xs: "none",
        md: "block",
      },
    },
    ml1: {
      ml: 1,
    },
    date: {
      maxWidth: "40px",
      textAlign: "center",
      display: {
        xs: "none",
        s320: "block",
      },
      mx: 1,
    },
  };
  const stateRef = useRef({}).current;
  selectionList = selectionList || SLIST;
  if (!list.length) return emptyScreen;
  list = grid ? splitArrayIntoChunksOfLen(list, 10) : list;
  // console.log(list);
  // return (
  //   <>
  //     {list.map((r, i) => {
  //       return (
  //         <Box
  //           key={i}
  //           sx={{
  //             width: "350px",
  //             backgroundColor: "primary.main",
  //           }}
  //         >
  //           gggg{i}ggg
  //           {r.map((c = {}, j) => {
  //             return <Box>{i}</Box>;
  //           })}
  //         </Box>
  //       );
  //     })}
  //   </>
  // );

  return (
    <>
      {list.map((c = {}, i) => {
        const bool = selectionList?.[c.id] >= 0;
        return (
          <List
            key={i}
            sx={{
              backgroundColor: "primary.main",
              ml: 1,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            {(grid ? c : [c]).map((f, j) => (
              <ListItem
                disableGutters
                disablePadding
                sx={{
                  ...(bool
                    ? {
                        "& .song-check-box": {
                          display: "inline-flex",
                        },
                      }
                    : {}),
                  position: "relative",
                  ..._styles.root,
                }}
                key={j + i}
              >
                {i + 1}
                <IconButton
                  sx={{
                    display: "none",
                    position: "absolute",
                    zIndex: 1,
                    backgroundColor: "primary.main",
                    top: "5px",
                    left: "5px",
                    "&:hover": {
                      backgroundColor: "primary.main",
                    },
                  }}
                  className="song-check-box"
                >
                  {bool ? (
                    <CheckBox
                      onClick={() => {
                        if (typeof onInputCheck === "function")
                          onInputCheck(c, i);
                        else {
                          dispatch({
                            type: REMOVE_SELECTIONS,
                            payload: c.id,
                          });
                        }
                      }}
                    />
                  ) : (
                    <CheckBoxOutlineBlankIcon
                      onClick={() => {
                        if (typeof onInputCheck === "function")
                          onInputCheck(c, i);
                        else {
                          dispatch({
                            type: SET_SELECTIONS,
                            payload: {
                              queryMap,
                              selection: {
                                id: c.id,
                                index: i,
                              },
                            },
                          });
                        }
                      }}
                    />
                  )}
                </IconButton>
                {selectionMode && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      zIndex: 1,
                      width: "100%",
                      height: "100%",
                      border: "1px solid red",
                    }}
                  />
                )}
                <Box sx={_styles.listBox}>
                  <Stack sx={_styles.info}>
                    <Link
                      to={""}
                      onClick={() =>
                        typeof onSelected === "function" && onSelected(c)
                      }
                    >
                      <HorizontalScroll gap="100" styles={_styles.horiScroll}>
                        {c.title || "Unknown  title"}
                      </HorizontalScroll>
                    </Link>
                    <Box sx={_styles.dot} component="span" />
                    <HorizontalScroll gap="100" styles={_styles.horiScroll}>
                      {c.genre || "Unknown genre"}
                    </HorizontalScroll>
                  </Stack>
                  <Stack sx={_styles.info}>
                    <HorizontalScroll gap="100" styles={_styles.horiScroll}>
                      {c.artist || "Unknown artist"}
                    </HorizontalScroll>
                    <Box sx={_styles.dot} component="span" />
                    <HorizontalScroll gap="100" styles={_styles.horiScroll}>
                      {c.album || "Unknown album"}
                    </HorizontalScroll>
                  </Stack>
                </Box>
                {c.year && (
                  <Typography variant="body1" sx={_styles.year}>
                    {c.year}
                  </Typography>
                )}
                <Stack
                  variant="flex-center"
                  direction={{
                    xs: "column",
                    md: "row",
                  }}
                  sx={_styles.ml1}
                  onClick={() =>
                    typeof onSelected === "function" && onSelected(c)
                  }
                >
                  {audioPlaying?.type === audioPlayer &&
                  audioPlaying?.activeId === c.id &&
                  settings?.playback?.enableInterfaceControl &&
                  audioPlaying?.playState === "playing" ? (
                    <IconButton
                      sx={_styles.icon}
                      onClick={() => {
                        audioPlaying.playState = "paused";
                        dispatch({
                          type: SET_AUDIO_PLAYING,
                          payload: audioPlaying,
                        });
                      }}
                    >
                      <PauseIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      sx={_styles.icon}
                      onClick={() => {
                        //   return console.log(
                        //     getCachedData(
                        //       {
                        //         type: queryMap.type,
                        //         variables: queryMap.variables,
                        //       },
                        //       cache
                        //     )
                        //   );
                        dispatch({
                          type: SET_AUDIO_PLAYING,
                          payload: {
                            query: {
                              type: queryMap.type,
                              variables: queryMap.variables,
                            },
                            activeId: c.id,
                            index: i,
                            type: audioPlayer,
                            playState: "play",
                          },
                        });
                      }}
                    >
                      <PlayArrow />
                    </IconButton>
                  )}
                  {isTouchDevice ? (
                    <IconButton
                      onClick={() => {
                        queryMap && (queryMap.song = c.id);
                        dispatch({
                          type: SET_SELECTIONS,
                          payload: {
                            queryMap: queryMap
                              ? queryMap
                              : {
                                  song: c.id,
                                  deleteType: "deleteSongsById",
                                },
                          },
                        });
                        setDialogGroup({
                          open: true,
                          title: c.title,
                          cover: c.cover,
                          artist: c.artist,
                        });
                      }}
                    >
                      <MoreHoriz />
                    </IconButton>
                  ) : (
                    <IconButton>
                      <DownloadIcon />
                    </IconButton>
                  )}
                </Stack>

                <ListItemText
                  sx={{
                    ..._styles.date,
                    visibility: c.duration ? "visible" : "hidden",
                    opacity: c.duration ? 1 : 0,
                  }}
                >{`${Math.floor(c.duration / 60)}:${Math.floor(
                  c.duration % 60
                )}`}</ListItemText>
              </ListItem>
            ))}
          </List>
        );
      })}
      <Dialog
        PaperProps={{
          sx: {
            backgroundColor: "primary.main",
            p: 0,
            width: "100%",
            maxWidth: "500px",
          },
        }}
        sx={{
          p: 0,
        }}
        open={dialogGroup.open || false}
        onClose={() =>
          setDialogGroup((prev) => ({
            ...prev,
            open: false,
          }))
        }
      >
        <DialogTitle sx={{ p: 2 }}>
          <Typography>{dialogGroup.title}</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <SelectionToolBox
            layout={"list"}
            onClose={() =>
              setDialogGroup((prev) => ({
                ...prev,
                open: false,
              }))
            }
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export const CompactLayout = ({
  list,
  grid,
  onSelected,
  queryMap,
  variant,
  audioPlayer = MUSIC_PLAYER,
  path,
}) => {
  const user = deSerializeUserFromCookie();
  const [{ audioPlaying, settings }, dispatch] = useStateValue();
  const [addToUserFav] = useMutation(addToUserFavGQL);
  const [removeFromUserFav] = useMutation(removeFromUserFavGQL);
  const { cache } = useApolloClient();
  list = list.length > 15 ? splitArrayIntoChunksOfLen(list, grid) : list;
  const toggleFav = (c) => {
    if (c.isFavourite)
      removeFromUserFav({
        context: {
          headers: {
            authorization: `Bearer ${user?.jwtToken}`,
          },
        },
        variables: {
          mediaCollection: {
            type: "songs",
            payload: [c.id],
          },
        },
        onError(err) {
          getErrMsg(err, true);
        },
        onCompleted() {
          console.log("rm fav suc");
          cache.modify({
            id: cache.identify(c),
            fields: {
              isFavourite() {
                return false;
              },
            },
          });
        },
      });
    else
      addToUserFav({
        context: {
          headers: {
            authorization: `Bearer ${user?.jwtToken}`,
          },
        },
        variables: {
          mediaCollection: {
            type: "songs",
            payload: [c.id],
          },
        },
        onError(err) {
          getErrMsg(err, true);
        },
        onCompleted() {
          console.log("add fav suc");
          cache.modify({
            id: cache.identify(c),
            fields: {
              isFavourite() {
                return true;
              },
            },
          });
        },
      });
  };
  return list.map((item, i) => {
    return (
      <ListItem
        key={i}
        sx={{
          minWidth: `350px`,
          flexDirection: "column",
          py: variant === "compact" ? 0 : 1,
          // border: "1px solid red",
        }}
      >
        {(item.length >= 0 ? item : [item]).map((c = {}, j) => {
          const index = item.length >= 0 ? j + i * grid : i;
          return (
            <Stack
              key={j}
              alignItems="center"
              sx={{
                width: "100%",
                my: variant === "compact" ? "0px" : 0,
              }}
            >
              <Typography
                sx={{
                  // alignSelf: "fle",
                  borderBottom: (theme) =>
                    `1px solid ${theme.palette.primary.light}`,
                  pb: "5px",
                }}
              >
                {index + 1}
              </Typography>
              <Card
                component={Stack}
                alignItems="center"
                elevation={0}
                sx={{
                  ml: 1,
                  flexGrow: 1,
                }}
              >
                <Box sx={{ position: "relative" }}>
                  <CardMedia
                    component="img"
                    image={AlbumCoverSm}
                    sx={{
                      width: variant === "compact" ? "40px" : "60px",
                      height: variant === "compact" ? "40px" : "60px",
                    }}
                  />
                  {audioPlaying?.type === audioPlayer &&
                  audioPlaying?.activeId === c.id &&
                  settings?.playback?.enableInterfaceControl &&
                  audioPlaying?.playState === "playing" ? (
                    <IconButton
                      sx={{
                        position: "absolute",
                        zIndex: 1,
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                      }}
                      onClick={() => {
                        audioPlaying.playState = "paused";
                        dispatch({
                          type: SET_AUDIO_PLAYING,
                          payload: audioPlaying,
                        });
                      }}
                    >
                      <PauseIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      sx={{
                        position: "absolute",
                        zIndex: 1,
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                      }}
                      onClick={() => {
                        dispatch({
                          type: SET_AUDIO_PLAYING,
                          payload: {
                            query: {
                              type: queryMap.getType,
                              variables: queryMap.variables,
                            },
                            type: audioPlayer,
                            playState: "play",
                            activeId: c.id,
                            index: 0,
                          },
                        });
                      }}
                    >
                      <PlayArrow />
                    </IconButton>
                  )}
                </Box>

                <CardContent
                  component={Stack}
                  alignItems="center"
                  sx={{
                    p: 0,
                    flexGrow: 1,
                    "&:last-child": {
                      pb: 0,
                    },
                  }}
                >
                  <Wave />
                  <Box>
                    <Link to={`/${path}/${c.id}`}>
                      <Typography
                        component="h5"
                        variant="subtitle2"
                        // sx={{ fontSize: "0.7rem" }}
                      >
                        {c.title || "Unknown title"}
                      </Typography>
                    </Link>
                    <Typography
                      component="h5"
                      variant="caption"
                      sx={{ fontSize: "0.7rem" }}
                    >
                      {c.artist || "Unknown artist"}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    "&>:not(:first-of-type)": {
                      ml: 0,
                    },
                  }}
                  onClick={() => onSelected(c)}
                >
                  <IconButton
                    onClick={() => toggleFav(c)}
                    sx={{
                      "&": {
                        my: "2px",
                        minWidth: "30px",
                        width: "30px",
                        minHeight: "30px",
                        height: "30px",
                        "&>*": {
                          fontSize:
                            variant === "compact" ? "1em !important" : ".8em",
                        },
                      },
                    }}
                  >
                    {c.isFavourite ? <Favorite /> : <HeartBroken />}
                  </IconButton>
                  <IconButton
                    sx={{
                      "&": {
                        my: "2px",
                        minWidth: "30px",
                        width: "30px",
                        minHeight: "30px",
                        height: "30px",
                        "&>*": {
                          fontSize:
                            variant === "compact" ? "1em !important" : ".8em",
                        },
                      },
                    }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Stack>
          );
        })}
      </ListItem>
    );
  });
};

export const CompactLayoutNavigator = ({ to = "", mx = "" }) => {
  return (
    <Link to={typeof selected === "undefined" ? to : ""}>
      <Card
        elevation={0}
        sx={{
          minWidth: "0",
          width: "90%",
          maxWidth: "180px", // learn-card
          mx: mx || "auto",
        }}
      >
        <Box sx={{ position: "relative", borderRadius: 3 }}>
          <CardMedia
            component="img"
            image={AlbumCoverSm}
            sx={{ borderRadius: "inherit" }}
          />
          <Typography
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              p: "5px",
              backgroundColor: "primary.light",
            }}
          >
            27.1k
          </Typography>
        </Box>
        <CardContent>
          <Typography>Love</Typography>
          <Typography variant="caption">Boomplay nigeria</Typography>
        </CardContent>
      </Card>
    </Link>
  );
};

export const BlockLayoutNavigator = ({
  to = "",
  primaryTitle,
  secondaryTitle,
}) => {
  return (
    <Link to={to}>
      <Card
        elevation={0}
        sx={{
          minWidth: "180px",
          maxWidth: `180px`,
          width: "100%",
          mx: 1,
        }}
      >
        <Box sx={{ position: "relative", borderRadius: 2 }}>
          <CardMedia
            component="img"
            src={AlbumCoverSm}
            sx={{
              height: "150px",
              borderRadius: "inherit",
            }}
          />
          <Stack
            alignItems="center"
            sx={{
              bgcolor: "primary.light",
              p: 1,
              position: "absolute",
              top: 0,
              right: 0,
            }}
          >
            <Headset
              sx={{
                fontSize: "16px",
                mr: "4px",
              }}
            />
            <Typography component="span" variant="h5">
              1.3m
            </Typography>
          </Stack>
        </Box>
        <CardContent sx={{ p: 1 }}>
          <Typography>{primaryTitle}</Typography>
          <Typography>{secondaryTitle}</Typography>
        </CardContent>
      </Card>
    </Link>
  );
};

export const CompactPlays = ({ list, onClick }) => {
  const { audioPlaying } = useStateValue();
  return (
    <Card
      component={Stack}
      alignItems="center"
      elevation={0}
      sx={{
        ml: 1,
        flexGrow: 1,
      }}
    >
      <Box sx={{ position: "relative", width: "80px", height: "80px" }}>
        <CardMedia component="img" src={AlbumCoverSm} />
        <IconButton
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
          }}
          onClick={onClick || (() => {})}
        >
          <PlayArrow />
        </IconButton>
      </Box>
      <CardContent>
        <List>
          {Array.from(new Array(3)).map((l, i) => (
            <ListItem
              disableGutters
              disablePadding
              disableRipple
              disableTouchRipple
              key={i}
              sx={{
                color: "#fff",
                m: 0,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: "0",
                  width: "auto",
                  mr: 1,
                }}
              >
                01
              </ListItemIcon>
              <ListItemText>for my hand ft. ed sheearen</ListItemText>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export const getDeleteDialog = (name, handleAction) => {
  return {
    type: SET_DIALOG,
    payload: {
      open: true,
      header: (
        <Typography variant="h5" component="span">
          Are you sure you want to delete this?
        </Typography>
      ),
      content: (
        <Typography variant="h5" component="span" sx={{ p: 1 }}>
          If you delete {name} it will be permanent
        </Typography>
      ),
      actions: (
        <>
          <Button
            variant="radius"
            sx={{
              bgColor: "secondary-hover",
            }}
            onClick={() => handleAction("close")}
          >
            Cancel
          </Button>
          <Button
            variant="radius"
            sx={{
              bgColor: "secondary-hover-bg",
            }}
            onClick={() => handleAction("delete")}
          >
            Ok
          </Button>
        </>
      ),
    },
  };
};

export const DetailedComp = ({
  c = {},
  index,
  selectionMode,
  isTouchDevice = true,
  isPlaying,
  activeId,
  checked,
  handleAction,
  isSelectionMode,
}) => {
  return (
    <ListItem>
      {index} {c.title || c.name}
      {isSelectionMode ? (
        <IconButton onClick={() => handleAction("inputCheck", checked)}>
          {checked ? <CheckBox /> : <CheckBoxOutlineBlank />}
        </IconButton>
      ) : null}
      <IconButton onClick={() => handleAction("playPauseAudio")}>
        {isPlaying && activeId === c.id ? <Pause /> : <PlayArrow />}
      </IconButton>
    </ListItem>
  );
};

export const BlockComp = () => {
  return (
    <Card component={Stack} alignItems="center" sx={{ p: 0 }}>
      <CardMedia
        src={AlbumCoverSm}
        component="img"
        sx={{ width: "50px", height: "50px", borderRadius: 2 }}
      />
      <CardContent>
        <Typography>album name</Typography>
        <Typography>album artist</Typography>
      </CardContent>
    </Card>
  );
};
