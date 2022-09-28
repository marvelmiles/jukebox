import React, { useState } from "react";
import PropTypes from "prop-types";
import Container from "../../components/Container";
import { Button } from "@mui/material";
import { DetailedLayout } from "../../components/Layouts";
import { useQuery } from "@apollo/client";
import { getUserSongsGQL } from "../../api/apollo-gql";
import { getErrMsg } from "../../helpers";
import { Loading } from "../../components/Animations";

function Songs(props) {
  const [category, setCategory] = useState("all");
  const [songs, setSongs] = useState([]);
  const { loading } = useQuery(getUserSongsGQL, {
    variables: {
      category,
    },
    onError(err) {
      getErrMsg(err, true);
    },
    onCompleted({ getUserSongs }) {
      setSongs(getUserSongs);
    },
  });

  return (
    <Container
      headerProps={{
        mountCategoryBar: true,
        categoryBar: (
          <>
            <Button onClick={() => setCategory("all")}>All</Button>
            <Button onClick={() => setCategory("my-musics")}>My Music</Button>
            <Button onClick={() => setCategory("downloads")}>Downloads</Button>
            <Button onClick={() => setCategory("locals")}>locals</Button>
          </>
        ),
      }}
    >
      {loading ? (
        <Loading />
      ) : (
        <DetailedLayout
          list={songs}
          queryMap={{
            type: "user-songs",
            variables: { category },
          }}
        />
      )}
    </Container>
  );
}

Songs.propTypes = {};

export default Songs;
