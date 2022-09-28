import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import Container from "../../components/Container";
import {
  Box,
  Button,
  IconButton,
  List,
  Stack,
  Typography,
} from "@mui/material";
import { Sort } from "@mui/icons-material";
import { handleSort } from "../../helpers";
import { BlockComp, DetailedComp } from "../../components/Layouts";
import { useQuery } from "@apollo/client";
import { getQueryResultGQL } from "../../api/apollo-gql";

function AlbumsResult({ reportOne }) {
  const stateRef = useRef({
    orderBy: "alphabetical",
  }).current;
  let [songs, setSongs] = useState({});

  useEffect(() => {
    let t = 0;
    let _songs = [{ title: "Alph" }, { title: "Bcedd" }, { title: "Ceddddd" }];
    for (let i = 0; i < 50; i++) {
      t++;
      if (t >= 3) t = 0;
      _songs = _songs.concat(_songs[t]);
    }
    handleSort(_songs, "Alphabetical", (data) => {
      console.log(data);
      setSongs(data);
    });
  }, []);
  return (
    <Container
      headerProps={{
        secondaryBarProps: {
          orderOnly: true,
          actionsMap: {
            hideMore: "s200",
          },
        },
        secondaryBar: null,
        mountCategoryBar: true,
        categoryBar: (
          <>
            <Stack>
              <Stack
                sx={{ flexGrow: 1, border: "1px solid red", overflow: "auto" }}
              >
                <Button variant="tab">Hot</Button>
                <Button variant="tab">New</Button>
              </Stack>
              <IconButton>
                <Sort />
              </IconButton>
            </Stack>
          </>
        ),
      }}
    >
      <Stack sx={{ border: "1px solid green" }}>
        <Box sx={{ flexGrow: 1 }}>
          {Object.keys(songs).map((group, i) => {
            return (
              <Box key={i}>
                <Box sx={{ border: "1px solid pink" }}>{group}</Box>
                <List>
                  {songs[group].map((s, j) => (
                     <BlockComp key={j}  />
                  ))}
                </List>
              </Box>
            );
          })}
        </Box>
        <Box sx={{ border: "1px solid red" }}>
          {Object.keys(songs).map((group, i) => {
            return <Typography key={i}>{group}</Typography>;
          })}
        </Box>
      </Stack>
    </Container>
  );
}

AlbumsResult.propTypes = {};

export default AlbumsResult;
