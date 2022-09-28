import {
  Add,
  Delete,
  Edit,
  Favorite,
  HearingDisabled,
  HeartBroken,
  More,
  MoreHoriz,
  Pause,
  Person,
  PlayArrow,
  Restaurant,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Input,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Container from "../components/Container";
import AlbumCover from "../assets/images/album-cover.jpg";
import {
  gql,
  useApolloClient,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  deSerializeUserFromCookie,
  getErrMsg,
  getIdsFromList,
  handleFilter,
  handleSort,
  shuffleArray,
} from "../helpers";
import { useStateValue } from "../provider";
import { DetailedLayout, getDeleteDialog } from "../components/Layouts";

import {
  SET_DIALOG,
  SET_POPOVER,
  SET_AUDIO_PLAYING,
  SET_SELECTIONS,
  REMOVE_SELECTIONS,
} from "../provider/reducer";
import {
  AlbumForm,
  EditAlbumForm,
  serializeToBody,
  SongForm,
} from "../components/Forms";
import {
  addToUserFavGQL,
  removeFromUserFavGQL,
  updateAlbumByIdGQL,
  updatePlaylistByIdGQL,
  getAlbumByIdGQL,
  getPlaylistByIdGQL,
  getUserPlaylistsGQL,
  getUserAlbumsGQL,
  reportAnalyticsGQL,
  uploadSongsGQL,
} from "../api/apollo-gql";
import { LAYOUT, MUSIC_PLAYER } from "../config";
import HeadsetIcon from "@mui/icons-material/Headset";
import { SecondaryBar } from "./Navigation";
export default function CollectionView({ isPlaylist = false }) {
  const user = deSerializeUserFromCookie();
  const navigate = useNavigate();
  const { id } = useParams();
  const variables = {
    id,
  };
  const [{ audioPlaying }, dispatch] = useStateValue();
  const [isFav, setIsFav] = useState(false);
  const [queryList, setQueryList] = useState(null);
  const { cache } = useApolloClient();
  const [reportAnalytics] = useMutation(reportAnalyticsGQL, {
    onError(err) {
      getErrMsg(err, true);
    },
    onCompleted() {
      console.log("reported successsfully...");
    },
  });
  const [deleteCollectionById] = useMutation(
    isPlaylist
      ? gql`
          mutation deletePlaylistById($id: ID!) {
            deletePlaylistById(id: $id)
          }
        `
      : gql`
          mutation deleteAlbumById($id: ID!) {
            deleteAlbumById(id: $id)
          }
        `,
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
        navigate(isPlaylist ? "/u/playlists" : "/u/albums");
      },
      update(cache) {
        const { getUserAlbums, getUserPlaylists } = cache.readQuery({
          query: isPlaylist ? getUserPlaylistsGQL : getUserAlbumsGQL,
        });
        handleFilter(
          isPlaylist ? getUserPlaylists : getUserAlbums,
          collection.id,
          (data) => {
            cache.writeQuery({
              query: isPlaylist ? getUserPlaylistsGQL : getUserAlbumsGQL,
              data: isPlaylist
                ? {
                    getUserPlaylists: data,
                  }
                : {
                    getUserAlbums: data,
                  },
            });
          }
        );
      },
    }
  );
  const [addToUserFavourite] = useMutation(addToUserFavGQL);
  const [removeFromUserFavourite] = useMutation(removeFromUserFavGQL);
  const [updateCollectionById] = useMutation(
    isPlaylist ? updatePlaylistByIdGQL : updateAlbumByIdGQL,
    {
      context: {
        headers: {
          authorization: `Bearer ${user.jwtToken}`,
        },
      },
      onError(err) {
        getErrMsg(err, true);
      },
    }
  );
  const [getAlbumDefaultInfoById] = useLazyQuery(gql`
    query getAlbumDefaultInfoByIdQuery($id: ID!) {
      getAlbumDefaultInfoById(id: $id) {
        name
        artist
        cover
      }
    }
  `);
  let { loading, data } = useQuery(
    isPlaylist ? getPlaylistByIdGQL : getAlbumByIdGQL,
    {
      variables,
      context: {
        headers: {
          authorization: `Bearer ${user.jwtToken}`,
        },
      },
      onError(err) {
        getErrMsg(err, true);
      },
      onCompleted({ getAlbumById, getPlaylistById }) {
        // const data = isPlaylist ? getPlaylistById : getAlbumById;
        // if (!data) return navigate(isPlaylist ? "/u/playlists" : "/u/albums");
        // data.songs.forEach(
        //   (s) => (stateRef.genres = stateRef.genres.concat(s.genre.split(",")))
        // );
        // if (stateRef.genres.length) stateRef.genres.splice(0, 0, "All genres");
        // setIsFav(data.isFavourite);
      },
    }
  );
  const [uploadSongs] = useMutation(uploadSongsGQL, {
    onError(err) {
      getErrMsg(err, true);
    },
  });
  const [dialog, setDialog] = useState({});
  const stateRef = useRef({
    genres: [],
  }).current;
  const songsInputFileRef = useRef();
  const collection = isPlaylist ? data?.getPlaylistById : data?.getAlbumById;
  const onSubmit = useCallback(
    (data, stateChanged) => {
      if (stateChanged) {
        serializeToBody(data, collection, (prop, value) => {
          switch (prop) {
            case "year":
            case "track":
              return parseInt(value);
            default:
              return value;
          }
        });
        console.log(data);
      }
      return;
      let action;
      switch (action) {
        case "close":
          return dispatch({
            type: SET_DIALOG,
            payload: {
              open: false,
            },
          });
        case "update":
          let csongs = [];
          if (data.selections) {
            const songs = [];
            for (let key in data.selections.selectionList) {
              songs.push(data.selections.selectionList[key].id);
              csongs.push(data.selections.selectionList[key]);
            }
            delete data.selections;
            data.mediaCollection = {
              type: "songs",
              payload: songs,
            };
          }
          cache.writeQuery({
            query: isPlaylist ? getPlaylistByIdGQL : getAlbumByIdGQL,
            data: isPlaylist
              ? {
                  getPlaylistById: {
                    ...collection,
                    name: data.name || collection.name,
                    songs: (collection.songs || collection.playlist).concat(
                      csongs
                    ),
                  },
                }
              : {
                  getAlbumById: {
                    ...collection,
                    name: data.name || collection.name,
                    cover: data.cover
                      ? URL.createObjectURL(data.cover)
                      : collection.cover,
                    artist: data.artist || collection.artist,
                    songs: collection.songs.concat(csongs),
                  },
                },
          });
          console.log(data);
          data.id = collection.id;
          return updateCollectionById({
            variables: data,
          });
        case "find-album-info":
          return getAlbumDefaultInfoById({
            context: {
              header: {
                authorization: `Bearer ${user?.jwtToken}`,
              },
            },
            variables: {
              id: collection.id,
            },
            onError(err) {
              getErrMsg(err, true);
              data.setDialog({
                open: true,
                content: (
                  <Typography>Encountered error while finding info.</Typography>
                ),
                actions: (
                  <Button
                    onClick={() =>
                      data.setDialog((prev) => ({
                        ...prev,
                        open: false,
                      }))
                    }
                  >
                    Close
                  </Button>
                ),
              });
            },
            onCompleted({ getAlbumDefaultInfoById: res }) {
              console.log("gotten default info", res);

              data.setDialog({
                open: true,
                headers: <Typography>Album info..</Typography>,
                content: res ? (
                  <AlbumForm formData={res} addonSongs={-1} readOnly />
                ) : (
                  <Typography>Album info is empty.</Typography>
                ),
                actions: (
                  <>
                    <Button
                      onClick={() =>
                        data.setDialog((prev) => ({
                          ...prev,
                          open: false,
                        }))
                      }
                      sx={{
                        bgColor: "secondary-hover",
                      }}
                    >
                      close
                    </Button>

                    <Button
                      disabled={!res}
                      onClick={() => {
                        data.reset(res);
                        data.setDialog((prev) => ({
                          ...prev,
                          open: false,
                        }));
                      }}
                      sx={{
                        bgColor: "secondary-hover-bg",
                      }}
                    >
                      Apply info
                    </Button>
                  </>
                ),
              });
            },
          });
        case "close-find-info":
          return data.setDialog((prev) => ({
            ...prev,
            open: false,
          }));
        default:
          return;
      }
    },
    [
      cache,
      collection,
      dispatch,
      getAlbumDefaultInfoById,
      isPlaylist,
      updateCollectionById,
      user.jwtToken,
    ]
  );
  useEffect(() => {
    reportAnalytics({
      variables: {
        id,
        operation: "query",
        collection: isPlaylist ? "playlists" : "albums",
      },
    });
    return () => {
      dispatch({
        type: REMOVE_SELECTIONS,
      });
    };
  }, [reportAnalytics, id, isPlaylist, dispatch]);
  if (!user) return <Navigate to="/u/login" />;
  if (loading) return <div>loading...</div>;
  if (!collection)
    return <Navigate to={`/u/${isPlaylist ? "playlists" : "albums"}`} />;
  const songs = queryList ? queryList : collection.songs || [];
  data = data?.getAlbumById || data?.getPlaylistById;

  const toggleFav = () => {
    if (isFav)
      removeFromUserFavourite({
        variables: {
          mediaCollection: {
            type: "albums",
            payload: [data.id],
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
            type: "albums",
            payload: [data.id],
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

  const renderDialogContent = () => {
    switch (dialog.openFor) {
      default:
        return (
          <AlbumForm
            onStateChange={(handlers) => (stateRef.formHandlers = handlers)}
            onSubmit={onSubmit}
          />
        );
    }
  };
  const renderDialogActions = () => {
    switch (dialog.openFor) {
      default:
        return (
          <>
            <Button
              onClick={() =>
                setDialog((prev) => ({
                  ...prev,
                  open: false,
                }))
              }
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                stateRef.formHandlers.handleSubmit();
              }}
            >
              Update
            </Button>
          </>
        );
    }
  };
  return (
    <>
      <Container
        headerProps={{
          handleSearchQuery(query) {
            if (query) {
              (collection.songs || collection.playlist).length > 0 &&
                handleFilter(
                  collection.songs || collection.playlist,
                  query,
                  (data) => {
                    console.log("query list", data);
                    setQueryList(data);
                  }
                );
            } else setQueryList(null);
          },
        }}
      >
        <Box sx={{ position: "relative" }}>
          <Box
            component="img"
            src={AlbumCover}
            alt={collection.name + " cover"}
            sx={{
              width: "100%",
              height: {
                xs: "350px",
              },
              boxShadow: (theme) => `0px 0px 5px #fff`,
            }}
          />

          <Stack
            sx={{
              position: "absolute",
              bottom: "8px",
              right: "5px",
              width: "100%",
            }}
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Stack
                alignItems="center"
                sx={{
                  bgcolor: "primary.light",
                  p: 1,
                }}
              >
                <HeadsetIcon
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
            <Stack alignItems="center">
              <IconButton
                onClick={toggleFav}
                sx={{
                  mx: 1,
                }}
              >
                {isFav ? <HeartBroken /> : <HearingDisabled />}
              </IconButton>
              <Avatar />
            </Stack>
          </Stack>
        </Box>
        <Typography
          variant="h6"
          component="h6"
          textAlign="center"
          sx={{
            mt: 3,
          }}
        >
          {collection.name}
        </Typography>

        <Stack
          alignItems="center"
          justifyContent="center"
          flexWrap="wrap"
          sx={{
            minWidth: "100%",
            my: {
              xs: 2,
              sm: 4,
              xl: 10,
            },
            "& > button": {
              backgroundColor: "primary.main",
              ml: 1,
              my: 1,
              borderRadius: "24px",
            },
          }}
        >
          {!audioPlaying?.reset && audioPlaying?.autoplay ? (
            <Button
              onClick={() => {
                dispatch({
                  type: SET_AUDIO_PLAYING,
                  payload: {
                    ...audioPlaying,
                    autoplay: false,
                  },
                });
              }}
            >
              <Pause />
              <Typography component="h1" variant="caption">
                Pause song
              </Typography>
            </Button>
          ) : (
            <Button
              onClick={() => {
                // dispatch({
                //   type: SET_AUDIO_PLAYING,
                //   payload: {
                //     type: MUSIC_PLAYER,
                //     query: {
                //       variables,
                //       type: isPlaylist ? "get-playlist" : "get-album",
                //     },
                //     index: audioPlaying?.index || 0,
                //     playState: "play",
                //     repeatMode: "all",
                //   },
                // });
              }}
            >
              <PlayArrow />
              <Typography sx={{ display: "none" }}>Play all</Typography>
            </Button>
          )}
          <Button>
            <HeartBroken />
            <Typography component="span" sx={{ display: "none" }}>
              Download all
            </Typography>
          </Button>
          <Button
            sx={{
              display: {},
            }}
            onClick={({ currentTarget }) =>
              setDialog({
                open: true,
                openFor: "edit",
              })
            }
          >
            <Edit />
            <Typography component="span" sx={{ display: "none" }}>
              Play all
            </Typography>
          </Button>
          <Button
            sx={
              {
                // display: {
                //   xs: "none",
                //   s280: "inline-flex",
                // },
              }
            }
            onClick={() => {
              dispatch(
                getDeleteDialog(collection.name, (action) => {
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
                      deleteCollectionById({
                        variables: {
                          id: collection.id,
                        },
                      });
                      return;
                  }
                })
              );
            }}
          >
            <Delete />
            <Typography component="span" sx={{ display: "none" }}>
              Play all
            </Typography>
          </Button>
        </Stack>

        <Box id="song-box">
          <input
            type="file"
            style={{ display: "none" }}
            multiple
            onChange={(e) => {
              uploadSongs({
                variables: {
                  songs: e.target.files,
                },
                onCompleted({ uploadSongs: { data, warnings } }) {
                  console.log(
                    data[0]?.isFavourite,
                    getIdsFromList(data),
                    "data..."
                  );
                  updateCollectionById({
                    variables: {
                      id: collection.id,
                      songs: getIdsFromList(data),
                    },
                  });
                  cache.writeQuery({
                    query: isPlaylist ? getPlaylistByIdGQL : getAlbumByIdGQL,
                    variables,
                    data: {
                      [isPlaylist ? "getPlaylistById" : "getAlbumById"]: {
                        ...collection,
                        songs: data,
                      },
                    },
                  });
                  //    cache.modify({
                  //        id: collection.id,
                  //        fields:{
                  //            songs(s){
                  //                cache.writeFragment()
                  //            }
                  //        }
                  //    })
                },
              });
            }}
            ref={songsInputFileRef}
          />
          <SecondaryBar
            hideDivider
            actionsMap={{
              genres: stateRef.genres,
              listLen: songs.length,
              hideMore: "md",
            }}
            handleAction={(action, info) => {
              switch (action) {
                case "sort-by":
                  return handleSort(songs, info, (data) => {
                    setQueryList(data);
                  });
                case "shuffle":
                  return;
                  return dispatch({
                    type: SET_AUDIO_PLAYING,
                    payload: {
                      type: MUSIC_PLAYER,
                      index: Math.floor(
                        Math.random() *
                          (collection.songs || collection.playlist).length
                      ),
                      query: {
                        variables,
                        type: isPlaylist ? "get-playlist" : "get-song",
                      },
                      playState: "play",
                    },
                  });
                case "genre":
                  return handleSort(songs, info, (data) => {
                    setQueryList(data);
                  });
                default:
                  return songsInputFileRef.current.click();
              }
            }}
          />
          <Box
            sx={{
              mx: 2,
              mt: 4,
            }}
          >
            <Typography variant="h5" component="h5">
              {isPlaylist ? "Playlist" : "Album"} songs: {songs.length}
            </Typography>
          </Box>
          <DetailedLayout
            layout={LAYOUT.DETAILED}
            list={songs}
            queryMap={{
              id,
              getType: isPlaylist ? "getPlaylistById" : "getAlbumById",
              key: isPlaylist ? "playlist" : "album",
            }}
          />
        </Box>
      </Container>
      <Dialog open={dialog.open || false}>
        <DialogTitle></DialogTitle>
        <DialogContent>{renderDialogContent()}</DialogContent>
        <DialogActions>{renderDialogActions()}</DialogActions>
      </Dialog>
    </>
  );
}
