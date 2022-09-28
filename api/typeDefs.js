const { buildSchema } = require("graphql");

module.exports = buildSchema(`
scalar FileUpload
type Track {
    no:Int
    of: Int
}
type Song {
    id:ID
    title:String
    artist:String
    owner:ID
    genre:String
    src:String
    cover:String
    createdAt:String
    album:String
    albumId:String
    track: Int
    albumTracks:Int
    year:Int
    duration:Float
    uploadedAt:Float
    updatedAt:String
    isFavourite:Boolean
}
type Album {
    id:ID
    name:String
    owner:String
    cover:FileUpload
    status:String
    songs:[Song]
    count:Int
    artist:String
    isFavourite:Boolean
    createdAt:Float
    updatedAt:Float
}
type User {
    id:String
    avatar:String
    jwtToken:String
    refreshToken:String
    username:String
    isLogin:Boolean
    createdAt:String
    role:String
}
type Playlist {
    id:ID
    owner:String
    name:String
    status:String
    songs:[Song]
    count:Int
    createdAt:Float
    updatedAt:Float
    isFavourite:Boolean
}

type MediaCollectionSet {
    songs:[Song]
    playlists:[Playlist]
    albums:[Album]
    radios:[Radio]
    users:[User]
    artists:[User]
}

type Radio {
    id:ID
    cover:String
    category:String
    name: String
    url:String
    country:String
    city:String
    language:String
    homepage:String
}
type RecentPlaysSet {
    songs:[Song]
    radios:[Radio]
}

union QueryUnion = MediaCollectionSet|Song|Radio|Playlist|Album
union RecentUnion = Song|Radio|Playlist|Album
type RegionalSet {
trendingAlbums:[Album]
}
type analyticsReport {
    topSearchedSongs: resBody
    topSearchedPlaylists: resBody
    topSearchedAlbums: resBody
    topSearchedRadios: resBody
    trendingSongs: resBody
    trendingAlbums: resBody
    trendingPlaylists: resBody
}
type Pagination {
    total:Int
    hasNext: Boolean
    next:String
}
input PaginationInput {
    limit:Int
    next:String
}
type resBody {
    data: [RecentUnion]
    pagination: Pagination
    group:String
}
type QueryResult {
    songs:resBody
    albums: resBody
    playlists: resBody
}
type chartsBody {
    top100NigeriaSongs: resBody
    top100NigeriaAlbums: resBody
}
type recommendationRes {
    songs: resBody
} 
type usersChoice {
    topDownloads:resBody
    dailyTrending: resBody
}
type charts {
    topSongs: resBody
    topAlbums: resBody
}
type jukeMixResult {
usersChoice: [resBody]
freeMusics: [resBody]
nostalgic:[resBody]
charts: [resBody]
recommendation: [resBody]
}
input MixinInput {
    usersChoice: [String]
    charts:[String]
    recommendation:[String]
    nostalgic:[String]
}
type Query {
    getJukeMix(mixin:MixinInput,userId:ID,pagination:PaginationInput): jukeMixResult
    getSongPrimaryDataById(id:ID!):Song
    getAnalyticsReport(pagination:PaginationInput,report:String!,userId:ID,category:String,country:String,city:String):analyticsReport
    getQueryResult(mediaCollectionType:String,query:String,pagination:PaginationInput):QueryResult
    getTrendingSongs(category:String,limit:Int,skip:Int,country:String,city:String):resBody
    getTrendingArtists(category:String,limit:Int,skip:Int,country:String,city:String):resBody
    getTrendingAlbums(category:String,limit:Int,skip:Int,country:String,city:String):resBody
    getTrendingPlaylists(category:String,limit:Int,skip:Int,country:String,city:String):resBody
    getNewReleases(limit:Int,skip:Int,collection:String,country:String,city:String):MediaCollectionSet
    getRegionalDiscoveries(limit:Int,skip:Int):RegionalSet
    getRecentlyUpdated(limit:Int,skip:Int,collection:String):[RecentUnion]
    isUserFavourite(mediaCollection:String!,collection:ID!):Boolean
    getSongs:[Song]!
    getGenres:[String]!
    getAlbumDefaultInfoById(id:ID!):Album
    getUserSongs(pagination:PaginationInput):  resBody
    getSongById(id:ID!):Song
    getSong(id:String!):[Song]!
    getAlbums:[Album]!
    getUserAlbums: [Album]!
    getAlbumsById(id:ID!): [Album]!
    getAlbumSongsById(id:ID!): [Song]!
    getPlaylistSongsById(id:ID!):[Song]!
    getAlbumById(id:ID!):Album
    getUserRecentPlays(mediaCollectionType:String!,operation:String):[RecentUnion]
    getUserFavourites(mediaCollectionType:String!,operation:String):[RecentUnion]
    signout:String!
    getNewToken:String!
    getLastListening:[Song]!
    deleteUser:String!
    isFollowing(id:ID!):Boolean!
    getUserPlaylists(pagination:PaginationInput): resBody!
    getPlaylistById(id:ID!):Playlist

    getRadios(country:String,city:String,query:String):[Radio]
    getRadiosByMostPlayed(offset:Int,limit:Int):[Radio]
    getRadiosByTopVotes(offset:Int,limit:Int):[Radio]!
    getRadioById(id:ID!):Radio
}

input SongBody {
    size:String!
    title:String!
    duration:Float!
    src:String!
}
input AlbumBody {
    id:ID
}
input UserBody {
    id:ID
}
input PlaylistBody {
    id:ID
}
type File {
    filename: String!
    mimetype: String!
    encoding: String!
}
type SongInfo {
    data:[Song]!
    extraInfo:String
}
type collection {
    mediaCollection:String
    collection:[String]
}

input MediaCollectionInput {
    type:String!
    payload:[String]!
}

type uploadSuccess {
    success: [ID]!
    warnings: [ID]!
}

type Mutation {
    reportAnalytics(collection:String!,id:ID!,operation:String!):String
    updateSongById(id:ID!,title:String,artist:String,album:String,track:Int,genre:String,year:Int,cover:FileUpload):String
    deleteMediasFromPlaylistById(id:ID!,medias:[String]!):String!
    deleteSongsFromAlbumById(id:ID!,songs:[String]!):String!
    followUserById(id:ID!):String!
    unFollowUserById(id:ID!):String!
    addToUserFavourite(mediaCollection:MediaCollectionInput!):String!
    removeFromUserFavourite(mediaCollection:MediaCollectionInput!):String!
    uploadSongs(songs:FileUpload): SongInfo!
    uploadSongsToCollectionsById(songs:[ID]!,collections:[ID]!,type:String!):uploadSuccess!
    updateSong(id:String!,title:String, artist:String,album:String,genre:String,group:String,features:[String],cover:FileUpload): String!
    saveUserRecentPlays(mediaCollection:MediaCollectionInput!):String!
    saveAlbum(name:String!,cover:FileUpload, artist:String, status:String,songs:[String]):Album!
    updateAlbumById(id:ID!,name:String,cover:FileUpload,status:String,songs:[ID],artist:String): String!
    updatePlaylistById(id:ID!,name:String,status:String,songs:[ID]): String!
    sd(id:String):[Song]
    deleteAlbumById(id:ID!):String!
    signup(email:String!,username:String!,password:String!,role:String):String!
    signin(username: String!,password:String!):User!
     
    updateUser(body:UserBody):String!

    deleteSongs(songs:[ID]!):String!
    deletePlaylistById(id:ID!):String!
    savePlaylist(name:String,status:String,playlist:[String]):Playlist!
    renamePlaylist(id:String!,name:String!):String!
    deletePlaylistSongs(id:String!,songs:[SongBody]):String!

}
`);
