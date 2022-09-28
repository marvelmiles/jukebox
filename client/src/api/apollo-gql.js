import { gql } from "@apollo/client";

// contains reusabe gql only
export const songFields = `id
genre
src
title
album
artist
owner
album
duration
year
cover
albumId
uploadedAt
track
isFavourite
`;

export const userFields = `
id
          username
          avatar
          role
          jwtToken
`;

export const radioFields = `
id
cover
category
name
url
country
city
`;

const albumFields = `
id
name
          cover
          count
          artist
          isFavourite
`;

const playlistFields = `
      id
      name
      count
      isFavourite
`;

export const getUserSongsGQL = gql`
  query getUserSongsQuery($pagination:PaginationInput) {
    getUserSongs(pagination:$pagination) {
    pagination{
      hasNext
      next
    }
      data { 
        ... on Song {${songFields}}
      }
    }
  }
`;

export const analyticsFields = `
data
pagination{
  hasNext
  next
}
`;

export const isUserFavGQL = gql`
  query isUserFavourite($mediaCollection: String!, $collection: ID!) {
    isUserFavourite(mediaCollection: $mediaCollection, collection: $collection)
  }
`;

export const addToUserFavGQL = gql`
  mutation addToUserFavouriteMutation($mediaCollection: MediaCollectionInput!) {
    addToUserFavourite(mediaCollection: $mediaCollection)
  }
`;

export const removeFromUserFavGQL = gql`
  mutation removeFromUserFavouriteMutation(
    $mediaCollection: MediaCollectionInput!
  ) {
    removeFromUserFavourite(mediaCollection: $mediaCollection)
  }
`;

export const getUserPlaylistsGQL = gql`
  query getUserPlaylistsQuery($pagination:PaginationInput) {
    getUserPlaylists(pagination:$pagination) {
 data {
   ... on Playlist{${playlistFields}}
 }
 pagination {
   hasNext
   next
 }
    }
  }
`;

export const getUserAlbumsGQL = gql`
  query getUserAlbumsMutation {
    getUserAlbums {
       ${albumFields}
    }
  }
`;

export const getSongPrimaryDataByIdGQL = gql`
query getSongPrimaryDataById($id:ID!){
  getSongPrimaryDataById(id:$id){${songFields}}
}
`;

export const updatePlaylistByIdGQL = gql`
  mutation updatePlaylistByIdMutation(
    $id: ID!
    $name: String
    $songs: [ID]!
    $status: String
  ) {
    updatePlaylistById(id: $id, name: $name, songs: $songs, status: $status)
  }
`;

export const updateAlbumByIdGQL = gql`
  mutation updateAlbumByIdMutation(
    $id: ID!
    $name: String
    $cover: FileUpload
    $artist: String
    $songs: [ID]
  ) {
    updateAlbumById(
      id: $id
      name: $name
      cover: $cover
      artist: $artist
      songs: $songs
    )
  }
`;

export const getPlaylistByIdGQL = gql`
  query getPlaylistByIdQuery($id: ID!) {
    getPlaylistById(id: $id) {
      id
      name
      owner
      isFavourite
      songs {
        ${songFields}
      }
    }
  }
`;

export const getAlbumByIdGQL = gql`
  query getAlbumByIdQuery($id: ID!) {
    getAlbumById(id: $id) {
      id
      name
      cover
      isFavourite
      songs {
         ${songFields}
      }
      owner
      artist
    }
  }
`;

export const deletePlaylistById = gql`
  mutation deletePlaylistById($id: ID!) {
    deletePlaylistById(id: $id)
  }
`;

export const deleteSongsFromPlaylistByIdGQL = gql`
  mutation deleteSongsFromPlaylistById($id: ID!, $medias: [String]!) {
    deleteSongsFromPlaylistById(id: $id, medias: $medias)
  }
`;

export const deleteSongsFromAlbumByIdGQL = gql`
  mutation deleteSongsFromAlbumById($id: ID!, $songs: [String]!) {
    deleteSongsFromAlbumById(id: $id, songs: $songs)
  }
`;

export const savePlaylistByIdGQL = gql`
  mutation savePlaylistMutation($name: String!, $playlist: [String]) {
    savePlaylist(name: $name, playlist: $playlist) {
       ${playlistFields}
    }
  }
`;

export const saveAlbumByIdGQL = gql`
  mutation saveAlbumMutation(
    $name: String!
    $cover: FileUpload
    $artist: String
    $songs: [String]
  ) {
    saveAlbum(name: $name, cover: $cover, artist: $artist, songs: $songs) {
      id
      name
      cover
      artist
      owner
      status
      count
    }
  }
`;
// missing uploaded-at
export const getUserRecentPlaysGQL = gql`
  query getUserRecentPlaysQuery($mediaCollectionType: String!,$operation:String) {
    getUserRecentPlays(mediaCollectionType: $mediaCollectionType,operation:$operation) {
    ... on Song {${songFields}}
    ... on Radio {${radioFields}}
    }
  }
`;

export const getUserFavouritesGQL = gql`
query getUserRecentPlaysQuery($mediaCollectionType: String!) {
  getUserFavourites(mediaCollectionType: $mediaCollectionType) {
    ... on Song {${songFields}}
    ... on Radio {${radioFields}}
  }
}
`;

export const getUserRecentPlayedSongsGQL = gql`
  query getUserRecentPlaysQuery($mediaCollectionType: String!,$operation:String) {
    getUserRecentPlays(mediaCollectionType: $mediaCollectionType,operation:$operation) {
      songs{${songFields}}
    }
  }
`;

export const getUserRecentPlayedRadioGQL = gql`
  query getUserRecentPlaysQuery($mediaCollectionType: String!,$operation:String) {
    getUserRecentPlays(mediaCollectionType: $mediaCollectionType,operation:$operation) {
      songs{${songFields}}
    }
  }
`;

export const getSongByIdGQL = gql`
  query getSongByIdQuery($id: ID!) {
    getSongById(id: $id) {
       ${songFields}
    }
  }
`;

export const getRadioByIdGQL = gql`
  query getRadioByIdQuery($id: ID!) {
    getRadioById(id: $id) {
      id
      cover
      category
      name
      url
      country
      city
      language
      homepage
    }
  }
`;

export const updateSongByIdGQL = gql`
  mutation updateSongByIdMutation(
    $id: ID!
    $title: String
    $artist: String
    $album: String
    $track: Int
    $genre: String
    $year: Int
    $cover: FileUpload
  ) {
    updateSongById(
      id: $id
      title: $title
      artist: $artist
      album: $album
      track: $track
      genre: $genre
      year: $year
      cover: $cover
    )
  }
`;

export const getRadiosGQL = gql`
  query getRadiosQuery($country: String, $city: String, $query: String) {
    getRadios(country: $country, city: $city, query: $query) {
      ${radioFields}
    }
  }
`;

export const getQueryResultGQL = gql`
  query getQueryResultQuery($mediaCollectionType: String, $query: String,$pagination:PaginationInput) {
    getQueryResult(mediaCollectionType: $mediaCollectionType, query: $query,pagination:$pagination) {
      hasSorted @client
      songs{
        data{
          ... on Song {
            ${songFields}
          }
        }
        pagination{
          hasNext
          next
        }
      }

      albums{
        data{
          ... on Album {
            ${albumFields}
          }
        }
        pagination{
          hasNext
          next
        }
      }

      playlists{
        data{
          ... on Playlist {
            ${playlistFields}
          }
        }
        pagination{
          hasNext
          next
        }
      }

    }
  }
`;

export const reportAnalyticsGQL = gql`
  mutation reportAnalyticsMutation(
    $collection: String!
    $id: ID!
    $operation: String!
  ) {
    reportAnalytics(collection: $collection, id: $id, operation: $operation)
  }
`;

export const getTrendingSongsGQL = gql`
  query getTrendingSongsQuery(
    $userId:ID
    $report: String!
    $category: String
    $country: String
    $city: String
     $pagination:PaginationInput
  ) {
    getAnalyticsReport(
      userId:$userId
      report: $report
      category: $category
      country: $country
      city: $city
      pagination:$pagination
    ) {
      trendingSongs {
        pagination {
          hasNext
          next
        }
        data { 
          ... on Song {
            ${songFields}
          }
        }
      }
    }
  }
`;

export const getTrendingArtistsGQL = gql`
  query getTrendingArtistsQuery(
    $report: String!
    $limit: Int
    $category: String
  ) {
    getAnalyticsReport(report: $report, limit: $limit, category: $category) {
    trendingArtists{${userFields}}
    }
  }
`;
export const getTopSearchedSongsGQL = gql`
query getTopSearchedSongsQuery($offset:Int,  $limit: Int,   $category: String,$country:String,$city:String,$report:String!) {
  getAnalyticsReport(offset:$offset  limit: $limit,  category: $category,country:$country,city:$city,report:$report) {
    topSearchedSongs{  ${songFields}}
  }
}
`;

export const getAnalyticsReportGQL = gql`
  query getAnalyticsReportQuery($limit: Int,  $report: String!,$country:String,$city:String) {
    getAnalyticsReport(limit: $limit,  report: $report,country:$country,city:$city) {
      topSearchedSongs{${songFields}}
      topSearchedArtists{${userFields}}
      topSearchedPlaylists{${playlistFields}}
      topSearchedAlbums{${albumFields}}
    }
  }
`;
export const getTopSearchedArtistsGQL = gql`
query getTopSearchedArtists($limit: Int, $skip: Int, $category: String) {
  getTopSearchedArtists(limit: $limit, skip: $skip, category: $category) {
     ${userFields}
  }
}
`;
export const getTopSearchedAlbumsGQL = gql`
query getTopSearchedAlbums($report:String!,$limit: Int, $category: String) {
  getAnalyticsReport(report:$report,limit: $limit, category: $category) {
   topSearchedAlbums{${albumFields}}
  }
}
`;
export const getTopSearchedPlaylistsGQL = gql`
query getTopSearchedPlaylists($report:String!,$limit: Int, $category: String) {
  getAnalyticsReport(report:$report,limit: $limit,  category: $category) {
    topSearchedPlaylists{${playlistFields}}
  }
}
`;

export const getNewReleasesGQL = gql`
  query getNewReleasesQuery($limit: Int, $skip: Int, $collection: String) {
    getNewReleases(limit: $limit, skip: $skip, collection: $collection) {
      albums{${albumFields}}
    }
  }
`;

export const getRegionalDiscoveries = gql`
  query getRegionalDiscoveries($limit: Int, $skip: Int) {
    getRegionalDiscoveries(limit: $limit, skip: $skip) {
      trendingAlbums
    }
  }
`;

export const getTrendingAlbumsGQL = gql`
  query getTrendingAlbumsQuery(
    $report: String!
    $userId:ID
    $category: String
    $country: String
    $city: String
    $pagination: PaginationInput
  ) {
    getAnalyticsReport(
      report: $report
      userId:$userId
      category: $category
      country: $country
      city: $city
      pagination: $pagination
    ) {
      trendingAlbums{
        pagination{
          hasNext
          next
        }
        data {
          ... on Album {${albumFields}}
        }
      }
    }
  }
`;

export const getTrendingPlaylistsGQL = gql`
query getTrendingPlaylistsQuery(   
  $report: String!
  $userId:ID
  $category: String
  $country: String
  $city: String
  $pagination:PaginationInput
) {
  getAnalyticsReport(
    report: $report
    userId: $userId
    category: $category
    country: $country
    city: $city
    pagination:$pagination
    ){
    trendingPlaylists{
      pagination {
        hasNext
        next
      }
      data {
        ... on Playlist {${playlistFields}}
      }
    }
  }
}
`;

export const getRecentlyUpdatedGQL = gql`
query getRecentlyUpdatedQuery($limit:Int,$skip:Int,$collection:String){
  getRecentlyUpdated(limit:$limit,skip:$skip,collection:$collection){
    ... on Album {
    ${albumFields}
    }
    ... on Playlist {
      ${playlistFields}
    }
  }
}
`;

export const getRadiosByMostPlayedGQL = gql`
  query getRadiosByMostPlayedQuery($limit: Int, $offset: Int) {
    getRadiosByMostPlayed(limit: $limit, offset: $offset) {
      id
      cover
      category
      name
      url
      country
      city
    }
  }
`;

export const getRadiosByTopVotesGQL = gql`
  query getRadiosByTopVotesQuery($limit: Int, $offset: Int) {
    getRadiosByTopVotes(limit: $limit, offset: $offset) {
      id
      cover
      category
      name
      url
      country
      city
    }
  }
`;

export const deleteSongsByIdGQL = gql`
  mutation deleteSongsByIdMutation($songs: [ID]!) {
    deleteSongs(songs: $songs)
  }
`;

export const getAlbumSongsByIdGQL = gql`
query getAlbumSongsQuery($id:ID!){
  getAlbumSongsById(id:$id) {
    ${songFields}
  }
}
`;

export const getPlaylistSongsByIdGQL = gql`
query getPlaylistSongsQuery($id:ID!){
  getPlaylistSongsById(id:$id) {
    ${songFields}
  }
}
`;

export const getNullMutationGQL = gql`
  mutation getNullMutation {
    getNull
  }
`;

export const getNullQueryGQL = gql`
  query getNullQuery {
    getNull
  }
`;

export const uploadSongsGQL = gql`
mutation uploadSongsMutation($songs: FileUpload) {
  uploadSongs(songs: $songs) {
    data {
   ${songFields}
    }
    extraInfo
  }
}
`;

export const uploadSongsToCollectionsByIdGQL = gql`
  mutation uploadSongsToCollectionsByIdMutation(
    $songs: [ID]!
    $collections: [ID]!
    $type: String!
  ) {
    uploadSongsToCollectionsById(
      songs: $songs
      collections: $collections
      type: $type
    ) {
      success
      warnings
    }
  }
`;

export const getJukeMixGQL = gql`
query getJukeMixQuery($mixin:MixinInput,$pagination:PaginationInput,$userId:ID) {
 getJukeMix(mixin:$mixin,pagination:$pagination,userId:$userId){
   
  usersChoice{
     group
    data{
       ... on Song {${songFields}}
     }
   }

 }
}
`;

export const getGQL = (reportName, applyDefault = false) => {
  switch (reportName) {
    case "getUserSongs":
      return getUserSongsGQL;
    case "getQueryResult":
      return getQueryResultGQL;
    case "getAnalyticsReport":
      return getAnalyticsReportGQL;
    case "trendingSongs":
      return getTrendingSongsGQL;
    case "trendingAlbums":
      return getTrendingAlbumsGQL;
    case "trendingPlaylists":
      return getTrendingPlaylistsGQL;
    case "trendingArtists":
      return getTrendingArtistsGQL;
    case "topSearchedSongs":
      return getTopSearchedSongsGQL;
    case "topSearchedAlbums":
      return getTopSearchedAlbumsGQL;
    case "topSearchedPlaylists":
      return getTopSearchedPlaylistsGQL;
    case "getUserPlaylists":
      return getUserPlaylistsGQL;
    case "getUserAlbums":
      return getUserAlbumsGQL;
    case "updatePlaylistById":
      return updatePlaylistByIdGQL;
    case "getPlaylistById":
      return getPlaylistByIdGQL;
    case "getAlbumById":
      return getAlbumByIdGQL;
    case "updateAlbumById":
      return updateAlbumByIdGQL;
    case "deleteSongsFromAlbumById":
      return deleteSongsFromAlbumByIdGQL;
    case "deleteSongsFromPlaylistById":
      return deleteSongsFromPlaylistByIdGQL;
    case "deleteSongsById":
      return deleteSongsByIdGQL;
    default:
      return typeof applyDefault === "string"
        ? applyDefault
        : gql`
        ${applyDefault ? "mutation" : "query"} getNullQuery {
          getNull
        }
      `;
  }
};

// usersChoice {

//   topDownloads {
//   data {
//     ... on Song {${songFields}}
//   }
//  }

//  dailyTrending {
//    data {
//      ... on Song {${songFields}}
//    }
//  }
// }
// freeMusics {
//   data {
//     ... on Song {${songFields}}
//   }
// }
// nostalgic {
//   data {
//     ... on Song {${songFields}}
//   }
//   group
// }
// charts {
// topSongs {
//  data{
//    ... on Song {${songFields}}
//  }
// }
// topAlbums {
//  data{
//    ... on Album {${albumFields}}
//  }
// }
// }
// recommendation {
//   topSongs{
//     data {
//       ... on Song {${songFields}}
//     }
//   }
//   topAlbums {
//     data {
//       ... on Album {${albumFields}}
//     }
//   }
// }
