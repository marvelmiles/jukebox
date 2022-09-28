import React, { useEffect, useState } from "react";
import Container from "../components/Container";
import SongCover from "../assets/images/explore-albums-bg.jpg";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { HorizontalScroll } from "../components/Animations";
import {
  Delete,
  Edit,
  Favorite,
  HeartBroken,
  Pause,
  PlayArrow,
  Stop,
  ThumbUpOffAlt,
} from "@mui/icons-material";
import {
  gql,
  useApolloClient,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createFile, deSerializeUserFromCookie, getErrMsg } from "../helpers";
import { getDeleteDialog } from "../components/Layouts";
import { CollectionViewDialog } from "../components/MoreStream";
import { useStateValue } from "../provider";
import { SET_DIALOG, SET_AUDIO_PLAYING } from "../provider/reducer";
import { MUSIC_PLAYER } from "../config";
import {
  getSongByIdGQL,
  getUserRecentPlaysGQL,
  updateSongByIdGQL,
  reportAnalyticsGQL,
  getGQL,
  addToUserFavGQL,
  removeFromUserFavGQL,
} from "../api/apollo-gql";
import { getSongFormDialog } from "../components/Forms";
export default function Song() {
  const user = deSerializeUserFromCookie();
  const { cache } = useApolloClient();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [reportAnalytics] = useMutation(reportAnalyticsGQL, {
    onError(err) {
      getErrMsg(err, true);
    },
    onCompleted() {
      console.log("reported successfully...");
    },
  });

  const [updateSongById] = useMutation(updateSongByIdGQL, {
    context: {
      headers: {
        authorization: `Bearer ${user.jwtToken}`,
      },
    },
    onError(err) {
      getErrMsg(err, true);
    },
    onCompleted({ updateSongById }) {
      console.log("updated song suc....");
    },
  });
  const [
    {
      audioPlaying,
      settings: {
        playback: { enableInterfaceControl },
      },
    },
    dispatch,
  ] = useStateValue();

  const { id } = useParams();
  const songVariables = {
    id,
  };
  const [isFav, setIsFav] = useState(false);
  let { loading, data: song } = useQuery(getSongByIdGQL, {
    variables: songVariables,
    context: {
      headers: {
        authorization: `Bearer ${user?.jwtToken}`,
      },
    },
    onError(err) {
      getErrMsg(err, true);
    },
    onCompleted({ getSongById }) {
      console.log("gotten song...");
      if (!getSongById) return navigate("/u/songs");
      setIsFav(getSongById.isFavourite);
    },
  });
  const [addToUserFavourite] = useMutation(addToUserFavGQL);
  const [removeFromUserFavourite] = useMutation(removeFromUserFavGQL);
  const [deleteSongs] = useMutation(
    gql`
      mutation deleteSongsMutation($songs: [String]!) {
        deleteSongs(songs: $songs)
      }
    `,
    {
      context: {
        headers: `Bearer ${user.jwtToken}`,
      },
      update(cache) {
        const songs = cache.readQuery({
          query: getUserRecentPlaysGQL,
          variables: {
            mediaCollectinType: "songs",
          },
        })?.getUserRecentPlays;
        songs &&
          cache.writeQuery({
            query: getUserRecentPlaysGQL,
            variables: {
              mediaCollectinType: "songs",
            },
            data: songs.filter((s) => s.id !== song.id),
          });
        dispatch({
          type: SET_AUDIO_PLAYING,
          payload: null,
        });
      },
      onError(err) {
        getErrMsg(err, true);
      },
      onCompleted() {
        return navigate("/u/songs");
      },
    }
  );

  const _styles = {
    listCont: {
      display: "flex",
      flexDirection: {
        xs: "column",
        lg: "row",
      },
      justifyContent: {
        xs: "normal",
        lg: "space-around",
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
        lg: "none",
      },
    },
    info: {
      justifyContent: "space-around",
      alignItems: "center",
      width: {
        xs: "100%",
        lg: "50%",
      },
      mx: "auto",
      maxWidth: "500px",
      "& > div": {
        // px: 1,
        // minWidth: {
        //   xs: "calc(50% - 3px)",
        //   lg: "0",
        // },
        // maxWidth: {
        //   xs: "calc(50% - 3px)",
        //   lg: "50%",
        // },
      },
    },
  };
  const [viewDialogQuery, setViewDialogQuery] = useState({});
  const isMd = useMediaQuery("(min-width:768px)");
  const [updateCollectionById] = useMutation(
    getGQL(viewDialogQuery.update, true),
    {
      context: {
        headers: {
          authorization: `Bearer ${user.jwtToken}`,
        },
      },
      onError(err) {
        getErrMsg(err, true);
      },
      onCompleted() {
        console.log("updated sucessfully..");
      },
    }
  );
  console.log(song);
  if (loading) return <div>loading...</div>;
  if (!song) return null;
  song = song.getSongById;

  const toggleFav = () => {
    if (isFav)
      removeFromUserFavourite({
        variables: {
          mediaCollection: {
            type: "songs",
            payload: [song.id],
          },
        },
        context: {
          headers: {
            authorization: `Bearer ${user.jwtToken}`,
          },
        },
        onError(err) {
          getErrMsg(err, true);
        },
        onCompleted() {
          setIsFav(false);
        },
      });
    else
      addToUserFavourite({
        variables: {
          mediaCollection: {
            type: "songs",
            payload: [song.id],
          },
        },
        context: {
          headers: {
            authorization: `Bearer ${user.jwtToken}`,
          },
        },
        onError(err) {
          getErrMsg(err, true);
        },
        onCompleted() {
          setIsFav(true);
        },
      });
  };

  const deleteSong = () =>
    dispatch(
      getDeleteDialog(song.title, (action) => {
        switch (action) {
          case "close":
            return dispatch({
              type: SET_DIALOG,
              payload: {
                open: false,
              },
            });
          default:
            dispatch({
              type: SET_DIALOG,
              payload: {
                open: false,
              },
            });
            deleteSongs({
              variables: {
                songs: [song.id],
              },
            });
            break;
        }
      })
    );
  const editSong = () => {
    
  };
  const stopPlayer = () => {};
  return (
    <Container mountHeader={false} sx={{}}>
      <Stack
        direction="column"
        variant="flex-center"
        sx={{
          p: 1,
        }}
      >
        <Avatar
          sx={{
            width: 100,
            height: 100,
            border: (theme) => `10px solid ${theme.palette.primary.dark}`,
            animation: "rotation 8s infinite linear",
            my: 5,
          }}
          src={SongCover}
        />
        <Box
          sx={{
            textAlign: "center",
            "& > *": {
              my: 2,
            },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: "600",
              fontSize: {
                md: "2.125rem",
              },
            }}
          >
            {song.title}
          </Typography>
          <Typography variant="h5">
            Track - {song.track || "Unknown track"}
          </Typography>
          <Typography variant="h5">Album - {song.album}</Typography>
          <Typography variant="h5">
            Year of release - {song.year || "Unknown"}
          </Typography>
          <Stack
            sx={{
              ..._styles.info,
              // border: "1px solid red",
            }}
          >
            <HorizontalScroll
              // gap="100"
              styles={{
                // ..._styles.horiScroll,,
                root: {
                  textAlign: "right",
                },
              }}
            >
              {song.artist}
            </HorizontalScroll>
            <Box sx={_styles.dot} component="span" />
            <HorizontalScroll
              styles={{
                root: {
                  textAlign: "left",
                },
              }}
            >
              {song.genre || "Unknown Genre"}
            </HorizontalScroll>
          </Stack>
        </Box>
        <Stack sx={{ mt: 3 }} justifyContent="space-evenly">
          <Button
            variant="icon-label"
            sx={{
              display: {
                xs: "none",
                s200: "block",
              },
            }}
          >
            <Edit />
            <Typography component="h6">Download</Typography>
          </Button>

          {isFav ? (
            <Button
              variant="icon-label"
              sx={{
                display: {
                  xs: "none",
                  s280: "block",
                },
              }}
              onClick={toggleFav}
            >
              <Favorite />
              <Typography variant="h6">Favourite</Typography>
            </Button>
          ) : (
            <Button
              variant="icon-label"
              sx={{
                display: {
                  xs: "none",
                  s280: "block",
                },
              }}
              onClick={toggleFav}
            >
              <HeartBroken />
              <Typography variant="h6">Favourite</Typography>
            </Button>
          )}
          <Button
            sx={{
              display: {
                xs: "none",
                s320: "block",
              },
            }}
            variant="icon-label"
            onClick={() =>
              setViewDialogQuery({
                query: "getUserPlaylists",
                update: "updatePlaylistById",
              })
            }
          >
            <Stop />
            <Typography component="h6">Playlist</Typography>
          </Button>
          <Button
            sx={{
              display: {
                xs: "none",
                s400: "block",
              },
            }}
            variant="icon-label"
            onClick={() =>
              setViewDialogQuery({
                query: "getUserAlbums",
                update: "updateAlbumById",
              })
            }
          >
            <Stop />
            <Typography component="h6">Album</Typography>
          </Button>

          {true ? (
            <Button
              variant="icon-label"
              sx={{
                display: {
                  xs: "none",
                  md: "block",
                },
              }}
              onClick={deleteSong}
            >
              <Delete />
              <Typography component="h6">Delete</Typography>
            </Button>
          ) : null}
          <Button
            variant="icon-label"
            sx={{
              display: {
                xs: "none",
                md: "block",
              },
            }}
            onClick={editSong}
          >
            <Edit />
            <Typography>Edit</Typography>
          </Button>

          <Button
            sx={{
              display: {
                xs: "none",
                md: "block",
              },
            }}
            variant="icon-label"
            onClick={stopPlayer}
          >
            <Stop />
            <Typography component="h6">Stop Play</Typography>
          </Button>

          <Button
            variant="icon-label"
            sx={{
              display: {
                xs: "block",
                md: "none",
              },
            }}
            onClick={() =>
              dispatch({
                type: SET_DIALOG,
                payload: {
                  open: true,
                  autoClose: true,
                  content: (
                    <List component="nav">
                      {[
                        {
                          icon: HeartBroken,
                          text: "Download",
                          display: {
                            xs: "inline-flex",
                            s200: "none",
                          },
                        },
                        {
                          icon: HeartBroken,
                          text: "Favourite",
                          display: {
                            xs: "inline-flex",
                            s280: "none",
                          },
                        },
                        {
                          icon: HeartBroken,
                          text: "Playlist",
                          display: {
                            xs: "inline-flex",
                            s320: "none",
                          },
                        },
                        {
                          icon: HeartBroken,
                          text: "Album",
                          display: {
                            xs: "inline-flex",
                            s400: "none",
                          },
                        },
                        {
                          icon: HeartBroken,
                          text: "Delete",
                          display: {
                            xs: "inline-flex",
                            md: "none",
                          },
                        },
                        {
                          icon: HeartBroken,
                          text: "Edit",
                          display: {
                            xs: "inline-flex",
                            md: "none",
                          },
                        },
                        {
                          icon: HeartBroken,
                          text: "Stop",
                          display: {
                            xs: "inline-flex",
                            md: "none",
                          },
                        },
                      ].map((l, i) => (
                        <ListItemButton
                          key={i}
                          sx={{
                            display: l.display,
                          }}
                        >
                          <ListItemIcon>
                            <l.icon />
                          </ListItemIcon>
                          <ListItemText primary={l.text} />
                        </ListItemButton>
                      ))}
                    </List>
                  ),
                },
              })
            }
          >
            <Edit />
            <Typography component="h6"> More</Typography>
          </Button>
        </Stack>
      </Stack>
      <CollectionViewDialog
        open={!!viewDialogQuery.query}
        queryName={viewDialogQuery.query}
        handleAction={(list) => {
          setViewDialogQuery({});
          if (list) {
            for (let _id in list) {
              _id = list[_id];
              updateCollectionById({
                variables: {
                  id: _id,
                  songs: [id],
                },
              });
            }
          }
        }}
      />
    </Container>
  );
}
