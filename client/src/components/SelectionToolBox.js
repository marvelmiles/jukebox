import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Popper,
  Stack,
  Tabs,
  Typography,
} from "@mui/material";
import {
  Add,
  Album,
  Delete,
  Edit,
  Favorite,
  HeartBroken,
  MoreHoriz,
  PlayArrow,
  Propane,
  Sort,
} from "@mui/icons-material";
import { useApolloClient, useMutation } from "@apollo/client";
import {
  addToUserFavGQL,
  deleteSongsByIdGQL,
  deleteSongsFromAlbumByIdGQL,
  deleteSongsFromPlaylistByIdGQL,
  getAlbumByIdGQL,
  getAlbumSongsByIdGQL,
  getGQL,
  getNullMutationGQL,
  getNullQueryGQL,
  getPlaylistByIdGQL,
  getPlaylistSongsByIdGQL,
  getUserSongsGQL,
  removeFromUserFavGQL,
  updateSongByIdGQL,
  uploadSongsToCollectionsByIdGQL,
} from "../api/apollo-gql";
import {
  deSerializeUserFromCookie,
  getCachedData,
  getErrMsg,
  getIdsFromList,
  isTouchDevice,
} from "../helpers";
import { Link, useNavigate } from "react-router-dom";
import { useStateValue } from "../provider";
import { REMOVE_SELECTIONS, SET_AUDIO_PLAYING, SET_SELECTIONS } from "../provider/reducer";
import { LAYOUT } from "../config";
import { serializeToBody, SongForm } from "./Forms";

function SelectionToolBox({ layout, onClose }) {
  const { cache } = useApolloClient();
  const user = deSerializeUserFromCookie();
  const [{ selectionLen, queryMap, selectionList, keyword }, dispatch] =
    useStateValue();
  const [dialogGroup, setDialogGroup] = useState({});
  const stateRef = useRef({
    isTouchDevice: isTouchDevice(),
  }).current;

  const selection = (() => {
    let songs = queryMap?.getType
      ? cache.readQuery({
          query: getGQL(queryMap?.getType),
          variables: queryMap,
        })[queryMap.getType]
      : [];
    songs = songs.songs || songs;
    if (selectionList) {
      if (selectionLen >= 2) return null;
      for (let s in selectionList) {
        return selectionList[s];
      }
    } else if (queryMap) {
      return songs[0];
    }
    return null;
  })();
  const [isFav, setIsFav] = useState(selection?.isFavourite);
  const [deleteStreams] = useMutation(
    {
      album: deleteSongsFromAlbumByIdGQL,
      playlist: deleteSongsFromPlaylistByIdGQL,
      song: deleteSongsByIdGQL,
    }[queryMap?.key] || getNullMutationGQL
  );
  const [addToUserFav] = useMutation(addToUserFavGQL, {
    variables: {
      mediaCollection: {
        type: "songs",
        payload: [selection?.id],
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
  const [removeFromUserFav] = useMutation(removeFromUserFavGQL, {
    variables: {
      mediaCollection: {
        type: "songs",
        payload: [selection?.id],
      },
    },
    onError(err) {
      getErrMsg(err, true);
    },
    onCompleted() {
      setIsFav(false);
    },
  });
  const [uploadSongsToCollections] = useMutation(
    uploadSongsToCollectionsByIdGQL,
    {
      onError(err) {
        getErrMsg(err, true);
      },
      onCompleted({ uploadSongsToCollectionsById: { success } }) {
        console.log("updated col with song succ..  query map ", queryMap.key);
        dispatch({
          type: REMOVE_SELECTIONS,
        });
        // const songs = cache
        //   .readQuery({
        //     query: getAlbumByIdGQL,
        //     variables: queryMap,
        //   })
        //   ?.getAlbumById?.songs.filter(({ id }) => {
        //     console.log(id, queryMap.songs, "iiiiii");
        //     return queryMap.songs.includes();
        //   });
        // success.forEach((id) => {
        //   cache.writeQuery({
        //     query: {
        //       playlist: getPlaylistSongsByIdGQL,
        //       album: getAlbumSongsByIdGQL,
        //     }[queryMap.key],
        //     variables: {
        //       id,
        //     },
        //     data: {
        //       [{
        //         playlist: "getPlaylistSongsById",
        //         album: "getAlbumSongsById",
        //       }[queryMap.key]]: queryMap.songs,
        //     },
        //   });
        // });
        // console.log(songs, " querynmaa ");
      },
    }
  );
  const [updateSongById] = useMutation(updateSongByIdGQL, {
    context: {
      headers: {
        authorization: `Bearer ${user.jwtToken}`,
      },
    },
    onError(err) {
      getErrMsg(err, true);
    },
  });
  const [popperGroup, setPopperGroup] = useState({});

  const onSubmit = useCallback(
    (data, stateChanged) => {
      setDialogGroup((prev) => ({
        ...prev,
        open: false,
      }));
      if (stateChanged) {
        serializeToBody(data, selection || {}, (prop, value) => {
          switch (prop) {
            case "year":
            case "track":
              return parseInt(value);
            default:
              return value;
          }
        });
        for (let key in data) {
          cache.modify({
            id: cache.identify(selection),
            fields: {
              [key]() {
                return data[key];
              },
            },
          });
        }
        data.id = selection.id;
        updateSongById({
          variables: data,
        });
      }
    },
    [selection, updateSongById, cache]
  );
  const renderDialogGroup = () => {
    switch (dialogGroup.openFor) {
      case "prop":
        return <SongForm formData={selection} readOnly />;
      default:
        return (
          <SongForm
            formData={selection}
            onStateChange={(handlers) => (stateRef.formHandlers = handlers)}
            onSubmit={onSubmit}
          />
        );
    }
  };

  const handleCancel = () => {
    onClose && onClose();
    dispatch({ type: REMOVE_SELECTIONS, payload: -1 });
  };
  // first time querymap is used... adding songs to pla
  const handleAddTo = ({ currentTarget }) => {
    if (queryMap) {
      console.log("adding songs...");
      switch (queryMap.action) {
        default:
          return uploadSongsToCollections({
            variables: {
              collections: getIdsFromList(selectionList),
              songs: queryMap.data,
              type: {
                playlists: "playlists",
                albums: "albums",
              }[keyword],
            },
            onCompleted({
              uploadSongsToCollectionsById: { success, warnings },
            }) {},
          });
      }
    } else
      dispatch({
        type: SET_SELECTIONS,
        payload: {
          queryMap: {
            action: `Upload to `,
            keyword,
            data: getIdsFromList(selectionList),
          },
        },
      });
    return;
    if (queryMap) {
      if (queryMap.action) {
        switch (queryMap.action) {
          default:
            console.log(queryMap);
            return uploadSongsToCollections({
              variables: {
                collections: getIdsFromList(selectionList),
                songs: queryMap.songs,
                type: {
                  playlist: "playlists",
                  album: "albums",
                }[queryMap.key],
              },
              onCompleted({
                uploadSongsToCollectionsById: { success, warnings },
              }) {},
            });
        }
      } else if (queryMap.key) {
        queryMap.action = "addTo";
        queryMap.songs = getIdsFromList(selectionList);
        dispatch({
          type: SET_SELECTIONS,
          payload: {
            queryMap,
          },
        });
      } else
        setPopperGroup({
          anchorEl: currentTarget,
          openFor: "addTo",
          open: true,
        });
    }
  };

  const handleDelete = () => {
    cache.modify({
      id: cache.identify(
        cache.readQuery({
          query: getGQL(queryMap.getType),
          variables: queryMap,
        })[queryMap.getType]
      ),
      fields: {
        songs(songs, { readField }) {
          return songs.filter((ref) => selection.id !== readField("id", ref));
        },
      },
    });
    deleteStreams({
      variables: queryMap,
      onError(err) {
        getErrMsg(err, true);
      },
      onCompleted() {
        console.log("deleted suc successfully...");
      },
    });
  };

  const toggleFav = () => {
    if (isFav) removeFromUserFav();
    else addToUserFav();
  };

  const handleEdit = () =>
    setDialogGroup({
      open: true,
      openFor: "edit",
    });

  const handleProp = () => {
    setDialogGroup({
      open: true,
      openFor: "prop",
    });
  };

  const handleAddToQueue = () => {
    // dispatch({
    //   type:SET_AUDIO_PLAYING,
    //   payload:{
    //     queue:{}
    //   }
    // })
  };

  const getPopoverList = () => {
    switch (popperGroup.openFor) {
      case "addTo":
        return [
          {
            icon: Sort,
            element: "Album",
            to: `/u/albums`,
            hide: "'0",
            onClick: () => console.log(queryMap),
          },
          {
            icon: Sort,
            element: "Playlists",
            to: `/u/playlists`,
            hide: "'0",
            onClick: () => console.log(queryMap),
          },
        ];
      default:
        return;
    }
  };

  const getSelectionTools = (hide) =>
    queryMap
      ? [
          {
            nullify: !selectionList,
            icon: Add,
            element: "Cancel",
            onClick: handleCancel,
            [hide ? "hide" : "show"]: "s200",
          },
          {
            nullify: !selectionList,
            icon: Add,
            element: `${queryMap.action} ${queryMap.keyword}`,
            onClick: handleAddTo,
            [hide ? "hide" : "show"]: "s280",
          },
          {
            nullify: !selectionList,
            icon: Add,
            element: "Select All",
            onClick: () => {},
            [hide ? "hide" : "show"]: "s320",
          },
          {
            nullify: hide || !selectionList,
            icon: Add,
            element: "More",
            onClick: ({ currentTarget }) =>
              setPopperGroup({
                open: true,
                openFor: "more",
                anchorEl: currentTarget,
              }),
            show: "xs",
            hide: "s320",
          },
        ]
      : [
          {
            nullify: !selectionList || keyword === "playlists",
            icon: Add,
            element: "Add to playlist",
            onClick: handleAddTo,
            to: "/u/library/playlists",
            [hide ? "hide" : "show"]: "s200",
          },
          {
            icon: Add,
            element: "Favourite",
            [hide ? "hide" : "show"]: "s200",
          },
          {
            icon: Add,
            element: "Download",
            [hide ? "hide" : "show"]: "s280",
          },
          {
            icon: Sort,
            element: "play next",
            onClick: handleAddToQueue,
            [hide ? "hide" : "show"]: "s480",
          },
          {
            icon: isFav ? Favorite : HeartBroken,
            element: "Favourite",
            disable: selectionLen >= 2,
            onClick: toggleFav,
            [hide ? "hide" : "show"]: "s480",
          },
          {
            icon: Add,
            element: `Delete from playlist`,
            onClick: handleDelete,
            [hide ? "hide" : "show"]: "s640",
          },
          {
            icon: Add,
            element: "Edit",
            disable: selectionLen >= 2,
            onClick: handleEdit,
            [hide ? "hide" : "show"]: "md",
          },
          {
            icon: Add,
            element: "Properties",
            disable: selectionLen >= 2,
            onClick: handleProp,
            [hide ? "hide" : "show"]: "s900",
          },
          {
            icon: Add,
            element: "Album",
            disable: selectionLen >= 2,
            to: `/album/${selection?.albumId}`,
            [hide ? "hide" : "show"]: "s900",
          },
          {
            icon: Add,
            element: "Play",
            disable: selectionLen >= 2,
            // onClick: handleEdit,
            [hide ? "hide" : "show"]: "s1024",
          },
          {
            nullify: !selectionList,
            icon: Add,
            element: "Select all",
            [hide ? "hide" : "show"]: "s1024",
          },
          {
            nullify: hide || !selectionList,
            show: "xs",
            hide: "xs",
            icon: MoreHoriz,
            element: "More",
            onClick: ({ currentTarget }) =>
              setPopperGroup({
                open: true,
                openFor: "more",
                anchorEl: currentTarget,
              }),
          },
        ];
  stateRef.isTouchDevice = false;
  return (
    <>
      <Stack
        direction="column"
        sx={{
          height: "100%",
          justifyContent: "center",
          zIndex: 1700,
        }}
      >
        <List
          component={"nav"}
          sx={{
            display: "flex",
            flexDirection: stateRef.isTouchDevice ? "column" : "row",
            justifyContent: stateRef.isTouchDevice ? "normal" : "space-evenly",
            minWidth: "100%",
          }}
        >
          {getSelectionTools().map((l, i) =>
            l.nullify ? null : (
              <Button
                onClick={l.onClick}
                component={l.to ? Link : "li"}
                key={i}
                startIcon={
                  <l.icon
                    sx={{
                      fontSize: "24px !important",
                    }}
                  />
                }
                sx={{
                  flexDirection: stateRef.isTouchDevice ? "row" : "column",
                  justifyContent: "normal",
                  width: stateRef.isTouchDevice ? "100%" : "auto",
                  lineHeight: "1.2",
                  //   border: "1px solid red",
                  display: {
                    [l.show || "xs"]: "inline-flex",
                    [l.hide || "xs"]: stateRef.isTouchDevice
                      ? "inline-flex"
                      : "none",
                  },
                  "&> .MuiButton-startIcon": {
                    mx: 0,
                    mr: stateRef.isTouchDevice ? 2 : 0,
                  },
                  whiteSpace: "normal",
                }}
                to={l.to}
              >
                {l.element}
              </Button>
            )
          )}
        </List>
      </Stack>
      <Popover
        open={popperGroup.open || false}
        anchorEl={popperGroup.anchorEl}
        onClose={() =>
          setPopperGroup((prev) => ({
            ...prev,
            open: false,
          }))
        }
      >
        <List
          sx={{
            boxShadow: 24,
            zIndex: 1700,
          }}
        >
          {(getPopoverList() || getSelectionTools(true)).map((l, i) => {
            return l.nullify ? null : (
              <ListItem
                key={i}
                component={l.to ? Link : "li"}
                onClick={l.onClick || (() => {})}
                sx={{
                  border: "1px solid red",
                  display: {
                    [l.show || "xs"]: "flex",
                    [l.hide || "xs"]: selectionList ? "none" : "flex",
                  },
                  p: 0,
                }}
                to={l.to}
              >
                <ListItemButton
                  sx={{
                    p: popperGroup?.openFor === "addTo" ? 1 : 2,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      width: "auto",
                      mr: 1,
                      "&>*": {
                        fontSize: "24px",
                      },
                    }}
                  >
                    <l.icon />
                  </ListItemIcon>
                  <ListItemText primary={l.element} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Popover>
      <Dialog
        open={dialogGroup.open || false}
        // onClose={() => {
        //   setDialogGroup((prev) => ({
        //     ...prev,
        //     open: false,
        //   }));
        // }}
      >
        <DialogTitle>Edit title</DialogTitle>
        <DialogContent>{renderDialogGroup()}</DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogGroup((prev) => ({
                ...prev,
                open: false,
              }));
            }}
          >
            Close
          </Button>
          <Button onClick={() => stateRef.formHandlers.handleSubmit()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

SelectionToolBox.propTypes = {};

export default SelectionToolBox;
