import {
  gql,
  useApolloClient,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
import { Add, Edit, Upload } from "@mui/icons-material";
import {
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
import React, { useEffect, useCallback, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import {
  getAlbumSongsByIdGQL,
  getPlaylistSongsByIdGQL,
  getUserAlbumsGQL,
  getUserPlaylistsGQL,
  getUserSongsGQL,
  saveAlbumByIdGQL,
  savePlaylistByIdGQL,
} from "../api/apollo-gql";

import Container from "../components/Container";
import { AlbumForm, PlaylistForm, serializeToBody } from "../components/Forms";
import { LAYOUT, ROLE, SELECTION_MODE } from "../config";
import {
  debounce_leading,
  deSerializeUserFromCookie,
  getCachedData,
  getErrMsg,
  getIdsFromList,
  getMetaData,
  handleSort,
  shuffleArray,
} from "../helpers";
import { useForm } from "../hooks/useForm";
import { useStateValue } from "../provider";
import {
  REMOVE_SELECTIONS,
  SET_CURRENT_FOOTER,
  SET_DIALOG,
} from "../provider/reducer";
import { HorizontalScroll } from "./Animations";
import { BlockLayout } from "./Layouts";

const Collections = ({ isPlaylists = false }) => {
  const user = deSerializeUserFromCookie();
  let [{ hasQueryMapAction }, dispatch] = useStateValue();
  let [collections, setCollections] = useState([]);
  const [queryList, setQueryList] = useState([]);
  const [sortBy, setSortBy] = useState("Date Added");
  const [openDialog, setOpenDialog] = useState(false);
  const { loading } = useQuery(
    isPlaylists ? getUserPlaylistsGQL : getUserAlbumsGQL,
    {
      context: {
        headers: {
          authorization: `Bearer ${user.jwtToken}`,
        },
      },
      onError(err) {
        getErrMsg(err, true);
      },
      onCompleted(data) {
        console.log(data);
        setCollections(
          isPlaylists ? data.getUserPlaylists : data.getUserAlbums
        );
      },
    }
  );
  const { cache } = useApolloClient();
  const [saveCollection] = useMutation(
    isPlaylists ? savePlaylistByIdGQL : saveAlbumByIdGQL
  );

  const stateRef = useRef({}).current;

  const _sortBy = useCallback((data) => {
    switch (data) {
      case "A-Z":
        setCollections((prev) =>
          prev.slice().sort((a, b) =>
            new Intl.Collator("en", {
              sensitivity: "accent",
            }).compare(a.title, b.title)
          )
        );
        break;
      case "Release Year":
        setCollections((prev) =>
          prev
            .slice()
            .sort((a, b) => (a.year === b.year ? 0 : a.year > b.year ? 1 : -1))
        );
        break;
      case "Artist":
        return setCollections((prev) =>
          prev.slice().sort((a, b) =>
            new Intl.Collator("en", {
              sensitivity: "accent",
            }).compare(a.artist, b.artist)
          )
        );
      default:
        setCollections((prev) =>
          prev
            .slice()
            .sort((a, b) =>
              a.uploadedAt === b.uploadedAt
                ? 0
                : a.uploadedAt > b.uploadedAt
                ? 1
                : -1
            )
        );
        break;
    }
  }, []);

  const onSubmit = useCallback(
    (data, stateChanged) => {
      setOpenDialog(false);
      if (stateChanged) {
        serializeToBody(data);
        return saveCollection({
          variables: data,
          context: {
            headers: {
              authorization: `Bearer ${user.jwtToken}`,
            },
          },
          onError(err) {
            getErrMsg(err, true);
          },
          onCompleted({ saveAlbum, savePlaylist }) {
            console.log("saved  collection", savePlaylist, saveAlbum);
            const list = cache
              .readQuery({
                query: isPlaylists ? getUserPlaylistsGQL : getUserAlbumsGQL,
              })
              [isPlaylists ? "getUserPlaylists" : "getUserAlbums"].concat(
                isPlaylists ? savePlaylist : saveAlbum
              );
            cache.writeQuery({
              query: isPlaylists ? getUserPlaylistsGQL : getUserAlbumsGQL,
              data: {
                [isPlaylists ? "getUserPlaylists" : "getUserAlbums"]: list,
              },
            });
          },
        });
        // const songs = [];
        // if (data.songs) {
        //   for (let key in data.songs) {
        //     songs.push(
        //       (cache.readQuery({
        //         query: getUserSongsGQL,
        //       })?.getUserSongs)[data.songs[key]]
        //     );
        //     data.songs.splice(key, 1, songs[songs.length - 1]?.id);
        //   }
        // }
        // cache.writeQuery({
        //   query: isPlaylists ? getPlaylistSongsByIdGQL : getAlbumSongsByIdGQL,
        //   data: {
        //     [isPlaylists ? "getPlaylistSongsById" : "getAlbumSongsById"]: songs,
        //   },
        // });
      }
    },
    [cache, isPlaylists, saveCollection, user?.jwtToken]
  );

  useEffect(() => {
    console.log("caledd once...");
    _sortBy(sortBy);
  }, [dispatch, _sortBy, sortBy, isPlaylists]);
  useEffect(() => {
    if (hasQueryMapAction) {
      // i basically wan it to have this animate in expo
      setTimeout(() => {
        dispatch({
          type: SET_CURRENT_FOOTER,
          payload: {
            [SELECTION_MODE]: SELECTION_MODE,
            active: SELECTION_MODE,
          },
        });
      }, 150);

      return () => {
        console.log("unmount...");
        // dispatch({
        //   type: REMOVE_SELECTIONS,
        //   payload: -1,
        // });
      };
    }
  }, [hasQueryMapAction, dispatch]);
  if (loading) return <div>loading...</div>;
  return (
    <Container
      mountHeader
      headerProps={{
        handleSearchQuery: (query) => {
          console.log("search query album pages...");
          setQueryList(
            collections &&
              collections.filter(({ name }) => {
                return new RegExp(name).test(query);
              })
          );
        },
        secondaryBarProps: {
          noArtist: isPlaylists,
          actionsMap: {
            hideMore: "s280",
          },

          handleAction(action, data) {
            switch (action) {
              default:
                handleSort(collections, data, (data) => {
                  setCollections(data);
                });
            }
          },
        },
      }}
    >
      <BlockLayout
        isPlaylists={isPlaylists}
        list={queryList.length ? queryList : collections}
        emptyScreen={
          <>
            <Typography variant="h5" textAlign="center" sx={{ my: 3, mt: 10 }}>
              You don't have any {isPlaylists ? "playlist" : "album"}.
            </Typography>
            <Button
              variant="icon-text"
              showText="xs"
              sx={{
                width: "120px",
                mx: 0,
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
              }}
              onClick={() => setOpenDialog(true)}
            >
              <Add />
              <Typography component="span">Add</Typography>
            </Button>
          </>
        }
        styles={{
          empty: {
            // flexDirection: {
            //   xs: "column",
            // },
          },
        }}
        onSelect={(action) => {
          console.log(action);
          switch (action) {
            case "play":
              return;
            default:
              break;
          }
        }}
        user={user?.id}
        path={isPlaylists ? "playlist" : "album"}
        queryMap={{
          getType: isPlaylists ? "getUserPlaylists" : "getUserAlbums",
          key: isPlaylists ? "playlist" : "album",
        }}
        streamQuery={{}}
      />
      <Dialog open={openDialog}>
        <DialogTitle>
          Create new {isPlaylists ? "playlist" : "album"}
        </DialogTitle>
        <DialogContent>
          {isPlaylists ? (
            <PlaylistForm
              onStateChange={(handlers) => (stateRef.formHandlers = handlers)}
              onSubmit={onSubmit}
            />
          ) : (
            <AlbumForm
              onStateChange={(handlers) => (stateRef.formHandlers = handlers)}
              onSubmit={onSubmit}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="radius"
            sx={{
              bgColor: "secondary-hover",
            }}
            onClick={() => setOpenDialog(false)}
          >
            Cancel
          </Button>
          <Button
            variant="radius"
            sx={{
              bgColor: "secondary-hover-bg",
            }}
            onClick={debounce_leading(() => {
              console.log(
                "create plug.. ",
                stateRef.current,
                stateRef.formHandlers.handleSubmit()
              );
            })}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Collections;
