import React from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import { useQuery } from "@apollo/client";
import { getUserRecentPlaysGQL } from "../api/apollo-gql";
import { getErrMsg } from "../helpers";
import { BlockLayout, DetailedLayout } from "./Layouts";
import { Loading } from "./Animations";

function RecentPlays({ mediaCollectionType = "songs", operation }) {
  const variables = {
    operation,
    mediaCollectionType,
  };
  const { data, loading } = useQuery(getUserRecentPlaysGQL, {
    variables,
    onError(err) {
      getErrMsg(err, true);
    },
  });
  return (
    <Box>
      {loading ? (
        <Loading />
      ) : (
        <>
          {mediaCollectionType === "songs" ? (
            <DetailedLayout
              list={data.getUserRecentPlays}
              queryMap={{
                type: "getUserRecentPlays",
                variables,
              }}
            />
          ) : (
            <BlockLayout />
          )}
        </>
      )}
    </Box>
  );
}

RecentPlays.propTypes = {};

export default RecentPlays;
