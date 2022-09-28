import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { useApolloClient, useQuery } from "@apollo/client";
import {
  getGQL,
  getTrendingSongsGQL,
  getUserSongsGQL,
} from "../api/apollo-gql";
import {
  deSerializeUserFromCookie,
  getErrMsg,
  getIdsFromList,
  handleFilter,
  handleSort,
} from "../helpers";
import Container from "./Container";
import { LAYOUT } from "../config";
import { BlockLayout, DetailedLayout } from "./Layouts";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { SearchQueryForm } from "./Forms";
import { SET_DIALOG } from "../provider/reducer";
import { useStateValue } from "../provider";
import { Loading } from "./Animations";
import SongsView from "./SongsView";
export function MoreSongView({ country, reportOne }) {
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [category, setCategory] = useState("hot");
  const { cache } = useApolloClient();
  const stateRef = useRef({
    songs: {
      data: [],
    },
  }).current;
  const variables = {
    report: reportOne,
    pagination: {
      limit: 100,
    },
    country,
    category,
  };
  let { loading, refetch: refetchSongs } = useQuery(getGQL(reportOne), {
    variables: variables,
    onError(err) {
      getErrMsg(err, true);
    },
    onCompleted({ getAnalyticsReport }) {
      console.log(getAnalyticsReport);
      if (stateRef.isPaginating) {
        console.log("refecth completed.... ");
        stateRef.songs = {
          pagination: getAnalyticsReport[reportOne].pagination,
          data: stateRef.songs.data.concat(getAnalyticsReport[reportOne].data),
          __typename: getAnalyticsReport[reportOne].__typename,
        };
        stateRef.isPaginating = false;
        this.client.cache.writeQuery({
          query: getGQL(reportOne),
          variables,
          data: {
            getAnalyticsReport: {
              [reportOne]: stateRef.songs,
              __typename: getAnalyticsReport.__typename,
            },
          },
          broadcast: false,
        });
      } else stateRef.songs = getAnalyticsReport[reportOne];
    },
  });
  console.log(stateRef.songs.data);
  const onScroll = (hasEnded) => {
    if (hasEnded && !stateRef.isPaginating) {
      console.log("has end ", stateRef.songs.pagination.next);
      stateRef.isPaginating = true;
      variables.pagination.next = stateRef.songs.pagination.next;
      refetchSongs(variables);
    }
  };
  return (
    <Container
      onScroll={onScroll}
      mountHeader
      headerProps={{
        secondaryBarProps: {
          noAdd: true,
          actionsMap: {
            genres: ["Afro pop"],
            listLen: 2,
            hideMore: "s640",
          },
          handleAction(action, info) {
            setIsPerformingAction(true);
            switch (action) {
              case "sort-by":
                return handleSort(songs, info, (data) => {
                  setIsPerformingAction(false);
                  setSongs(data);
                });
              case "genre":
                return handleFilter(songs, info, (data) => {
                  setIsPerformingAction(false);
                  setSongs(data);
                });
              default:
                break;
            }
          },
        },
        mountCategoryBar: true,
        categoryBarProps: {
          active: category,
          onChange(category) {
            setCategory(category);
          },
        },
      }}
    >
      {loading || isPerformingAction ? (
        <div>loaidng...</div>
      ) : (
        <DetailedLayout
          list={stateRef.songs.data}
          queryMap={{
            variables,
            type: "trendingSongs",
          }}
          onScroll={onScroll}
        />
      )}
    </Container>
  );
}

export function MoreCollectionView({ country, reportOne, queryMapKey }) {
  const [category, setCategory] = useState("hot");
  const variables = {
    report: reportOne,
    country,
    limit: 100,
    category,
  };

  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [collections, setCollections] = useState([]);
  let { loading } = useQuery(getGQL(reportOne), {
    variables: variables,
    onError(err) {
      getErrMsg(err, true);
    },
    onCompleted({
      getAnalyticsReport: {
        trendingPlaylists,
        trendingAlbums,
        topSearchedAlbums,
        topSearchedPlaylists,
      },
    }) {
      if (trendingAlbums) setCollections(trendingAlbums);
      else if (trendingPlaylists) setCollections(trendingPlaylists);
      else if (topSearchedAlbums) setCollections(topSearchedAlbums);
      else if (topSearchedPlaylists) setCollections(topSearchedPlaylists);
    },
  });
  return (
    <Container
      mountHeader
      headerProps={{
        secondaryBarProps: {
          noAdd: true,
          noArtist: true,
          actionsMap: {
            genres: ["Afro pop"],
            hideMore: "s320",
          },
          handleAction(action, info) {
            setIsPerformingAction(true);
            switch (action) {
              case "sort-by":
                return handleSort(collections, info, (data) => {
                  setIsPerformingAction(false);
                  setCollections(data);
                });
              case "genre":
                return handleFilter(collections, info, (data) => {
                  setIsPerformingAction(false);
                  setCollections(data);
                });
              default:
                break;
            }
          },
        },
        mountCategoryBar: true,
        categoryBarProps: {
          active: category,
          onChange(category) {
            console.log(category, "category....");
            setCategory(category);
          },
        },
      }}
    >
      {loading || isPerformingAction ? (
        <div>loaidng...</div>
      ) : (
        <BlockLayout
          list={collections}
          queryMap={{
            variables,
            key: queryMapKey,
            type: "trendingSongs",
          }}
        />
      )}
    </Container>
  );
}

MoreSongView.propTypes = {};

export const CollectionViewDialog = ({
  open,
  queryName,
  handleAction = () => {},
  actionLabel = "Save",
  text = "collection(s)",
}) => {
  const [selectionList, setSelectionList] = useState({});
  let { loading, data } = useQuery(getGQL(queryName), {
    skip: !open,
    onError(err) {
      getErrMsg(err, true);
    },
  });
  data = data?.[queryName];
  console.log(data, "collectin view dialog..");
  if (!data) return;
  return (
    <Dialog open={open} onClose={() => handleAction()}>
      <DialogTitle component="div">
        <SearchQueryForm
          placeholder="Search Music"
          styles={{
            root: {
              mx: 0,
            },
          }}
          onSearchQuery={() => {
            console.log("in dialog");
          }}
          queryParam="froo"
        />
        <Typography>
          Selected {Object.keys(selectionList).length} {text}
        </Typography>
      </DialogTitle>
      {loading || !open ? (
        <div>loading....</div>
      ) : (
        <Stack
          flexWrap="wrap"
          justifyContent="space-between"
          px={{
            xs: 0,
            sm: 3,
          }}
          pt={3}
        >
          {data.map((c, i) => (
            <div key={i}>car</div>
          ))}
        </Stack>
      )}
      <DialogActions>
        <Button onClick={() => handleAction()} variant="radius">
          Cancel
        </Button>
        <Button variant="radius" onClick={() => handleAction(selectionList)}>
          {actionLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const SongsViewDialog = ({ open = false, addonSongs, onClose }) => {
  const user = deSerializeUserFromCookie();
  const [{ selectionList, selectionLen }] = useStateValue();

  return (
    <>
      <Dialog open={open}>
        <DialogTitle component="div">
          <SearchQueryForm
            placeholder="Search Music"
            styles={{
              root: {
                mx: 0,
              },
            }}
            onSearchQuery={() => {
              console.log("in dialog");
            }}
            queryParam="froo"
          />
          <Typography
            sx={{
              mt: 1,
              mb: 0,
            }}
          >
            selected {selectionLen || 0 - (addonSongs || 0)} song(s){" "}
            {addonSongs > 0 && ` - includes ${addonSongs} addon songs`}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <SongsView
            getType="getUserSongs"
            keyword="songs"
            isSelectionMode={true}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="radius"
            sx={{
              bgColor: "secondary-hover",
            }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="radius"
            sx={{
              bgColor: "secondary-hover-bg",
            }}
            onClick={() => {
              onClose(selectionList, !!selectionLen);
            }}
          >
            Add songs
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
