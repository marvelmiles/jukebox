import React, { useState } from "react";
import PropTypes from "prop-types";
import { useApolloClient, useQuery } from "@apollo/client";
import { getUserFavouritesGQL } from "../../api/apollo-gql";
import { getErrMsg } from "../../helpers";
import Container from "../../components/Container";
import { Button } from "@mui/material";
import { DetailedLayout } from "../../components/Layouts";
import { Loading } from "../../components/Animations";

function Favourites({ defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const variables = {
    mediaCollectionType: activeTab,
  };
  const [songs, setSongs] = useState([]);
  const { loading } = useQuery(getUserFavouritesGQL, {
    variables,
    onError(err) {
      getErrMsg(err, true);
    },
    onCompleted({ getUserFavourites }) {
      console.log(getUserFavourites, "fff");
      setSongs(getUserFavourites);
    },
  });
  return (
    <Container
      headerProps={{
        activeTab: "library",
        mountCategoryBar: true,
        categoryBar: (
          <>
            {[
              {
                element: "Songs",
                tab: "songs",
              },
              {
                element: "Albums",
                tab: "albums",
              },
              {
                element: "Playlists",
                tab: "playlists",
              },
              {
                element: "Radios",
                tab: "radios",
              },
            ].map((t, i) => (
              <Button key={i} onClick={() => setActiveTab(t.tab)}>
                {t.element}
              </Button>
            ))}
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
            variables,
            type: "getUserFavourites",
          }}
        />
      )}
    </Container>
  );
}

Favourites.propTypes = {};

export default Favourites;
