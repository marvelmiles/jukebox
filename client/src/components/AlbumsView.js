import { Box, List, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { handleSort } from "../helpers";
import Container from "./Container";
import { DetailedComp } from "./Layouts";

export default function AlbumsView(props) {
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
    <Box>
      <Stack sx={{ border: "1px solid green" }}>
        <Box sx={{ flexGrow: 1 }}>
          {Object.keys(songs).map((group, i) => {
            return (
              <Box key={i}>
                <Box sx={{ border: "1px solid pink" }}>{group}</Box>
                <List>
                  {songs[group].map((s, j) => (
                    <DetailedComp key={j} c={s} />
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
    </Box>
  );
}
