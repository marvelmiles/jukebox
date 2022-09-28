import {
  gql,
  useApolloClient,
  useMutation,
  useQuery,
  ApolloLink,
  useLazyQuery,
} from "@apollo/client";
import SearchIcon from "@mui/icons-material/Search";

import {
  Box,
  Button,
  debounce,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { COOKIE_NAME } from "../config";
import {
  debounce_leading,
  deSerializeUserFromCookie,
  getErrMsg,
  serializeUserToCookie,
  toPrettyTime,
} from "../helpers";
import { useStateValue } from "../provider";
import { SET_SELECTIONS_COLLECTION, SIGNIN } from "../provider/reducer";
import { SongsViewDialog } from "./MoreStream";
import YoutubeSearchedForIcon from "@mui/icons-material/YoutubeSearchedFor";
import { Close, Edit, Sort, Upload } from "@mui/icons-material";
import { useForm } from "../hooks/useForm";
import { getSongPrimaryDataByIdGQL } from "../api/apollo-gql";
import SongCover from "../assets/images/explore-albums-bg.jpg";
// const username =
//   "marvellous akinrinmola @ 1233333333333333333333333333333333333333333333333333333333333333333333333333333333ertyyuuiioooooooooooooooooooooooooooooooooooooooooooooooopopppppppppppppppppppppppppppppppppp";
const username = "df";
const password = "password";

export const serializeToBody = (formData, placeholders, serializer) => {
  for (let key in formData) {
    const prop = key.split("-")[1];
    if (!prop) continue;
    formData[key] &&
      formData[key] !== placeholders?.[prop] &&
      (formData[prop] =
        typeof serializer === "function"
          ? serializer(prop, formData[key])
          : formData[key]);
    delete formData[key];
  }
  return;
};

export const SigninForm = () => {
  const [_, dispatch] = useStateValue();
  const navigate = useNavigate("");
  const [signin] = useMutation(
    gql`
      mutation SigninMutation($username: String!, $password: String!) {
        signin(username: $username, password: $password) {
          id
          username
          avatar
          role
          jwtToken
        }
      }
    `,
    {
      variables: {
        password,
        username,
      },
      onCompleted({ signin }) {
        serializeUserToCookie(signin);

        // navigate("/discover");
      },
      onError(err) {
        getErrMsg(err, true);
      },
      context: {
        credentials: true,
      },
    }
  );

  return (
    <Paper variant="form">
      <Stack variant="brand">
        <Stack>J</Stack>
        <Typography>Jukebox</Typography>
      </Stack>
      <Divider />
      <Box
        sx={{
          textAlign: "center",
          maxWidth: "350px",
          mx: "auto",
          mt: 2,
        }}
      >
        <Typography variant="h4" color="primary.main" fontWeight="900">
          Hello Again!
        </Typography>
        <Typography color="primary.dark">
          Welcome back you've been missed!
        </Typography>
      </Box>
      <Input placeholder="Your Email" />
      <Input placeholder="Your Password" />
      <Typography
        component={Link}
        to=""
        variant="body1"
        sx={{ float: "right", color: "primary.main" }}
      >
        Recovery Password
      </Typography>
      <Button variant="contained">signin</Button>
      <Stack
        sx={{
          my: 3,
          "& hr": {
            flexGrow: 1,
          },
        }}
      >
        <Divider />
        <Typography
          variant="body1"
          sx={{
            mx: 2,
            color: "primary.main",
          }}
        >
          or continue with
        </Typography>
        <Divider />
      </Stack>
      <Stack
        sx={{
          my: 2,
          "& button": {
            border: ({
              palette: {
                primary: { main },
              },
            }) => `2px solid ${main}`,
          },
        }}
      >
        <Button>
          <Sort />
        </Button>
      </Stack>
      <Box
        sx={{
          textAlign: "center",
        }}
      >
        <Typography variant="body1" color="primary.main" component="span">
          Not a member?
        </Typography>
        <Typography
          variant="body1"
          component={Link}
          to=""
          sx={{ ml: 1, color: "secondary.main" }}
        >
          Register now
        </Typography>
      </Box>
    </Paper>
  );
};

export const SignupForm = () => {
  // const [] = useState();
  const [signup] = useMutation(
    gql`
      mutation SignupMutation(
        $email: String!
        $username: String!
        $password: String!
        $role: String
      ) {
        signup(
          email: $email
          username: $username
          password: $password
          role: $role
        )
      }
    `,
    {
      variables: {
        email: "marvellous@gmail.com",
        username,
        role: "fan",
        password,
      },
      onCompleted(data) {
        console.log(data);
      },
      onError(err) {
        getErrMsg(err, true);
      },
    }
  );

  return (
    <Box sx={{ color: "#fff" }}>
      <Input />
      <Input />
      <Button onClick={signup} variant="tab">
        signup
      </Button>
      <Link to="/u/signin">signin</Link>
    </Box>
  );
};

export const SearchQueryForm = ({
  onSearchQuery,
  styles = {},
  placeholder,
  searchBox,
  state,
  to,
}) => {
  // const [q, setQ] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("query") || "";
  const inputRef = useRef();
  useEffect(() => {
    typeof onSearchQuery === "function" &&
      onSearchQuery(inputRef.current.value, true);
  }, [onSearchQuery]);
  return (
    <Input
      placeholder={placeholder}
      disableUnderline
      value={q}
      onChange={(e) => {
        setSearchParams({
          query: e.target.value,
        });
        // setQ(e.target.value);
        // typeof onSearchQuery === "function" && onSearchQuery(e.target.value);
      }}
      sx={{
        backgroundColor: ({ palette: { primary } }) => primary.light,
        color: "secondary.main",
        height: "30px",
        mx: 1,
        alignItems: "center",
        ...styles.root,
      }}
      inputRef={inputRef}
      endAdornment={
        false ? null : (
          <InputAdornment
            position="end"
            state={state}
            onClick={() =>
              typeof onSearchQuery === "function" && q && onSearchQuery(q)
            }
            component={typeof onSearchQuery === "function" ? Button : Link}
            to={`/${to || "explore"}/result?query=${q}`}
          >
            <SearchIcon sx={{ color: "secondary.main" }} />
          </InputAdornment>
        )
      }
    />
  );
};

// shouldn't be used in component definition
// can be use in rare cases where hoc need to be applied dynamically
// in component lifecycle methods/construct, controlled event
// handlers that invoke once keeping component identity across renders

export const withSongs = (component) => {
  return ({ children }) => {
    return <component>{children}</component>;
  };
};

export const AlbumForm = ({
  formData: form,
  onStateChange,
  onSubmit,
  addon,
  readOnly = false,
}) => {
  const { username } = deSerializeUserFromCookie() || {};
  const fileUploadRef = useRef();
  const [selectedSongs, setSelectedSongs] = useState(null);
  const { formData, errors, isSubmitting, handleChange, handleSubmit, reset } =
    useForm(
      {
        formState: {
          "album-name": {
            value: form ? form.name : "",
            required: true,
          },
          "album-artist": {
            value: form ? form.artist : username,
          },
          "album-cover": {
            value: form ? form.cover : "",
          },
        },
      },
      useCallback(
        (data, stateChanged) => {
          data.songs = selectedSongs || [];
          onSubmit(data, stateChanged);
        },
        [onSubmit, selectedSongs]
      )
    );
  const [dialog, setDialog] = useState(null);
  const [openSongsDialog, setOpenSongsDialog] = useState(false);
  const _styles = {
    iconText: {
      display: {
        xs: "none",
        s280: "inline-flex",
      },
    },
    input: {
      sx: {
        backgroundColor: "rgba(184,184,184,.1)",
        borderRadius: "20px",
        height: "35px",
        width: "100%",
        mt: "5px",
        transition: "border .3s ease-in-out",
      },
      inputProps: {
        background: "transparent",
        width: "100%",
        px: 1,
        pl: 2,
        borderRadius: "inherit",
        color: "#4c5262",
        "&::placeholder": {
          color: "#4c5262",
        },
      },
    },
    inputBox: {
      px: 1,
      my: 1,
      maxWidth: "500px",
      mx: "atuo",
    },
  };

  useEffect(() => {
    if (typeof onStateChange === "function")
      !isSubmitting &&
        onStateChange({
          handleSubmit,
          setDialog,
          findInfo: (formData) => {
            // reset({
            //   "album-name": formData.name || "",
            //   "album-artist": formData.artist || "",
            //   "album-cover": formData.cover || "",
            // }),
          },
        });
  }, [onStateChange, isSubmitting, handleSubmit, reset]);

  const renderInputGrid = (formData, readOnly) => {
    return (
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
      >
        <Box
          sx={{
            position: "relative",
            mb: {
              xs: 3,
            },
            mx: {
              xs: 0,
              sm: 2,
            },
            width: {
              xs: "100%",
              sm: "150px",
            },
            height: "150px",
          }}
        >
          <input
            type="file"
            ref={fileUploadRef}
            style={{
              display: "none",
            }}
            name="album-cover"
            onChange={handleChange}
            accept="image/*"
          />
          <Box
            component="img"
            src={
              typeof formData["album-cover"] === "string"
                ? formData["album-cover"]
                : URL.createObjectURL(formData["album-cover"][0])
            }
            alt=""
            sx={{
              width: "100%",
              height: "100%",
            }}
          />
          {!readOnly && (
            <IconButton
              sx={{
                position: "absolute",
                left: "5px",
                bottom: "5px",

                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              }}
              name="album-fileUpload"
              onClick={() => fileUploadRef.current.click()}
            >
              {formData?.name ? <Edit /> : <Upload />}
            </IconButton>
          )}
        </Box>
        <Box
          sx={{
            border: "1px solid red",
          }}
        >
          <Button
            variant="radius"
            sx={{ mt: 2, bgColor: "secondary-hover-bg", float: "right" }}
            color="secondary-hover"
            textAlign="right"
            disabled={addon?.songsCount === -1}
            onClick={() => setOpenSongsDialog(true)}
          >
            {selectedSongs
              ? selectedSongs.length >= 1000
                ? "1k+ songs added"
                : selectedSongs.length + " added"
              : "Add songs"}
          </Button>
          <Grid
            container
            justifyContent="space-around"
            sx={{
              minWidth: "100%",
            }}
          >
            <Grid item>
              <Box sx={_styles.inputBox}>
                <Typography
                  htmlFor="album-name"
                  component="label"
                  color="contrastText-hover"
                >
                  Album name{" "}
                  {errors["album-name"] === "required" && (
                    <Typography component="span" sx={{ color: "red" }}>
                      *
                    </Typography>
                  )}
                </Typography>
                <Input
                  readOnly={readOnly}
                  name="album-name"
                  value={formData["album-name"] || ""}
                  id="album-name"
                  disableUnderline
                  sx={{
                    ..._styles.input.sx,
                    border:
                      errors["album-name"] === "required"
                        ? "2px solid red"
                        : "2px solid initial",
                  }}
                  inputProps={{
                    sx: _styles.input.inputProps,
                  }}
                  onChange={handleChange}
                />
              </Box>
            </Grid>
            <Grid item>
              <Box sx={_styles.inputBox}>
                <Typography
                  htmlFor="album-artist"
                  component="label"
                  color="contrastText-hover"
                >
                  Album Artist{" "}
                  {errors["album-artist"] === "required" && (
                    <Typography component="span" sx={{ color: "red" }}>
                      *
                    </Typography>
                  )}
                </Typography>
                <Input
                  id="album-artist"
                  name="album-artist"
                  disableUnderline
                  readOnly={readOnly}
                  value={formData["album-artist"]}
                  sx={{
                    ..._styles.input.sx,
                    border:
                      errors["album-artist"] === "required"
                        ? "2px solid red"
                        : "2px solid initial",
                  }}
                  inputProps={{
                    sx: _styles.input.inputProps,
                  }}
                  onChange={handleChange}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    );
  };

  return (
    <>
      {renderInputGrid(formData, readOnly)}
      <SongsViewDialog
        open={true}
        addonSongs={addon?.songsCount}
        onClose={(data) => {
          if (data.length) setSelectedSongs(data);
          setOpenSongsDialog(false);
        }}
      />
      <Dialog open={dialog?.open || false}>
        <DialogTitle>{dialog?.title}</DialogTitle>
        <DialogContent>{dialog?.content}</DialogContent>
        <DialogActions>{dialog?.actions}</DialogActions>
      </Dialog>
    </>
  );
};

export const PlaylistForm = ({
  formData: form,
  onStateChange,
  addonSongs = 0,
  onSubmit,
}) => {
  const [selectionList, setSelectionList] = useState(null);
  const [openSongsDialog, setOpenSongsDialog] = useState(false);
  const selectionLen = selectionList
    ? Object.keys(selectionList).length + addonSongs
    : addonSongs;
  const { formData, errors, isSubmitting, handleChange, handleSubmit } =
    useForm(
      {
        formState: {
          "playlist-name": {
            value: form ? form.name : "",
            required: true,
          },
        },
        getFormAddon() {
          return {
            selectionList,
          };
        },
      },
      onSubmit
    );
  const _styles = {
    iconText: {
      display: {
        xs: "none",
        s280: "inline-flex",
      },
    },
    input: {
      sx: {
        backgroundColor: "rgba(184,184,184,.1)",
        borderRadius: "20px",
        height: "35px",
        width: "100%",
        mt: "5px",
        transition: "border .3s ease-in-out",
      },
      inputProps: {
        background: "transparent",
        width: "100%",
        px: 1,
        pl: 2,
        borderRadius: "inherit",
        color: "#4c5262",
        "&::placeholder": {
          color: "#4c5262",
        },
      },
    },
    inputBox: {
      px: 1,
      my: 1,
      maxWidth: "500px",
      mx: "atuo",
    },
  };
  useEffect(() => {
    if (typeof onStateChange === "function")
      !isSubmitting &&
        onStateChange({
          handleSubmit,
        });
  }, [onStateChange, isSubmitting, handleSubmit]);
  return (
    <>
      <Box>
        <Button
          variant="radius"
          sx={{ mt: 2, bgColor: "secondary-hover-bg", float: "right" }}
          color="secondary-hover"
          textAlign="right"
          onClick={() => setOpenSongsDialog(true)}
        >
          {selectionLen
            ? selectionLen >= 1000
              ? "1k+ songs added"
              : selectionLen + " added"
            : "Add songs"}
        </Button>
        <Grid container>
          <Grid xs={12}>
            <Box sx={_styles.inputBox}>
              f
              <Typography
                htmlFor="playlist-name"
                component="label"
                color="contrastText-hover"
              >
                Playlist Name{" "}
                {errors["playlist-name"] === "required" && (
                  <Typography component="span" sx={{ color: "red" }}>
                    *
                  </Typography>
                )}
              </Typography>
              <Input
                id="playlist-name"
                name="playlist-name"
                disableUnderline
                sx={{
                  ..._styles.input.sx,
                  border:
                    errors["playlist-name"] === "required"
                      ? "2px solid red"
                      : "2px solid pink",
                }}
                inputProps={{
                  sx: _styles.input.inputProps,
                }}
                value={formData["playlist-name"]}
                onChange={handleChange}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
      <SongsViewDialog
        open={openSongsDialog}
        addonSongs={addonSongs}
        onClose={(data) => {
          if (data) setSelectionList(data);
          setOpenSongsDialog(false);
        }}
      />
    </>
  );
};

export const getAlbumFormDialog = (
  placeholders,
  handleAction,
  addon,
  readOnly
) => {
  let handlers;
  return {
    open: true,
    header: (
      <Stack justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Typography variant="h6" component="h6" color="secondary-hover">
          {placeholders ? "Album info" : "Edit album info"}
        </Typography>
        {addon?.id ? (
          <Button
            variant="icon-text"
            sx={{
              bgColor: "secondary-hover-bg",
              fontSize: "10px !important",
              whiteSpace: "nowrap",
            }}
            onClick={() => handlers.findInfo()}
          >
            <YoutubeSearchedForIcon />
            <Typography component="span">Find album info</Typography>
          </Button>
        ) : null}
      </Stack>
    ),
    content: (
      // learn-submit
      <AlbumForm
        addon={addon}
        onStateChange={(_handlers) => (handlers = _handlers)}
        onSubmit={(formData, stateChanged) => {
          console.log("submit once playlist...", stateChanged);
          handleAction("close");
          if (stateChanged) {
            formData["album-cover"] &&
              formData["album-cover"] !== placeholders?.cover &&
              (formData.cover = formData["album-cover"]);
            formData["album-artist"] &&
              formData["album-artist"] !== placeholders?.artist &&
              (formData.artist = formData["album-artist"]);
            formData["album-name"] &&
              formData["album-name"] !== placeholders?.name &&
              (formData.name = formData["album-name"]);
            delete formData["album-cover"];
            delete formData["album-name"];
            delete formData["album-artist"];
            handleAction(placeholders ? "update" : "save", formData);
          }
        }}
        readOnly={!addon && !handleAction}
        formData={placeholders}
      />
    ),
    actions: (
      <>
        <Button
          variant="radius"
          sx={{
            bgColor: "secondary-hover",
            flexGrow: {
              xs: 1,
              sm: 0,
            },
          }}
          onClick={() => handleAction("close")}
        >
          Cancel
        </Button>
        <Button
          variant="radius"
          sx={{
            bgColor: "secondary-hover-bg",
            flexGrow: {
              xs: 1,
              sm: 0,
            },
            mt: {
              xs: 3,
              sm: 0,
            },
          }}
          onClick={() => handlers.handleSubmit()}
        >
          Save
        </Button>
      </>
    ),
  };
};

export const SongForm = ({
  formData: form,
  onStateChange,
  onSubmit,
  readOnly = false,
  addon,
}) => {
  const renderInputGrid = (formData, readOnly) => {
    return (
      <Grid container>
        <Box
          component="img"
          src={
            formData["song-cover"].size
              ? URL.createObjectURL(formData["song-cover"])
              : formData["song-cover"]
          }
          width="100%"
          height="250px"
          sx={{
            mb: 3,
          }}
        />
        {!readOnly && (
          <input name="song-cover" type="file" onChange={handleChange} />
        )}
        <FormInput
          readOnly={readOnly}
          label="Song Title"
          name="song-title"
          onChange={handleChange}
          value={formData["song-title"]}
          error={errors["song-title"]}
        />
        <FormInput
          readOnly={readOnly}
          label="Song Artist"
          name="song-artist"
          onChange={handleChange}
          value={formData["song-artist"]}
          error={errors["song-artist"]}
        />
        <FormInput
          readOnly={readOnly}
          label="Song Album"
          name="song-album"
          onChange={handleChange}
          value={formData["song-album"]}
          error={errors["song-album"]}
        />
        <FormInput
          readOnly={readOnly}
          label="Song Track"
          name="song-track"
          onChange={handleChange}
          value={formData["song-track"]}
          error={errors["song-track"]}
        />
        <FormInput
          readOnly={readOnly}
          label="Song Genre"
          name="song-genre"
          onChange={handleChange}
          value={formData["song-genre"]}
          error={errors["song-genre"]}
        />
        <FormInput
          readOnly={readOnly}
          label="Year"
          name="song-year"
          onChange={handleChange}
          value={formData["song-year"]}
          error={errors["song-year"]}
        />
        {form ? (
          <FormInput
            readOnly
            label="Stream source"
            name="song-src"
            value={formData["song-src"]}
            sm={12}
          />
        ) : null}
      </Grid>
    );
  };

  const [dialog, setDialog] = useState(null);
  const { formData, errors, isSubmitting, reset, handleChange, handleSubmit } =
    useForm(
      {
        formState: {
          "song-title": {
            value: form ? form.title : "",
            // required: true,
          },
          "song-artist": {
            value: form ? form.artist : "",
            // required: true,
          },
          "song-album": {
            value: form ? form.album : "",
            // required: true,
          },
          "song-track": {
            value: form ? form.track : "",
            // required: true,
          },
          "song-genre": {
            value: form ? form.genre : "",
            // required: true,
          },
          "song-year": {
            value: form ? form.year : "",
            // required: true,
          },
          "song-src": {
            value: form ? form.src : "",
          },
          "song-cover": {
            value: form ? form.cover : "",
          },
        },
      },
      useCallback(
        (data, stateChanged) => {
          onSubmit(data, stateChanged);
        },
        [onSubmit]
      )
    );
  const [getPrimaryData] = useLazyQuery(getSongPrimaryDataByIdGQL, {
    onError(err) {
      getErrMsg(err, true);
    },
    onCompleted({ getSongPrimaryDataById: d }) {
      console.log("pimray data ", d);
      const formData = {
        "song-cover": d.cover,
        "song-title": d.title,
        "song-artist": d.artist,
        "song-album": d.album,
        "song-track": d.track,
        "song-genre": d.genre,
        "song-year": d.year,
        "song-src": d.src,
      };
      setDialog({
        open: true,
        header: <Typography>Set info as current placeholder?</Typography>,
        content: renderInputGrid(formData, true),
        actions: (
          <>
            <Button
              onClick={() =>
                setDialog((prev) => ({
                  ...prev,
                  open: false,
                }))
              }
            >
              Cancexxl
            </Button>
            <Button
              onClick={() => {
                reset(formData);
                setDialog((prev) => ({
                  ...prev,
                  open: false,
                }));
              }}
            >
              ok
            </Button>
          </>
        ),
      });
    },
  });
  useEffect(() => {
    if (typeof onStateChange === "function")
      !isSubmitting &&
        onStateChange({
          handleSubmit,
          findInfo: () => {
            setDialog({
              open: true,
              actions: (
                <Button
                  onClick={() =>
                    setDialog((prev) => ({ ...prev, open: false }))
                  }
                >
                  {" "}
                  close
                </Button>
              ),
              content: <div>findind info...</div>,
            });
            getPrimaryData({
              variables: {
                id: addon.id,
              },
            });
          },
        });
  }, [onStateChange, isSubmitting, handleSubmit, addon?.id, getPrimaryData]);
  // learn-song
  return (
    <>
      {renderInputGrid(formData, readOnly)}
      <Dialog open={dialog?.open || false}>
        {dialog?.content ? (
          <DialogContent>{dialog?.content}</DialogContent>
        ) : null}
        {dialog?.actions ? (
          <DialogActions>{dialog?.actions}</DialogActions>
        ) : null}
      </Dialog>
    </>
  );
};

export const getSongFormDialog = (
  placeholders,
  handleAction,
  addon,
  readOnly = false
) => {
  let handlers;
  return {
    open: true,
    header: (
      <Stack justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Typography variant="h6" component="h6" color="secondary-hover">
          {placeholders ? "Song Info" : "Edit songinfo"}
        </Typography>
        {addon?.id ? (
          <Button
            variant="icon-text"
            sx={{
              bgColor: "secondary-hover-bg",
              fontSize: "10px !important",
              whiteSpace: "nowrap",
            }}
            onClick={() => {
              handlers.findInfo();
              // handlers.setDialog({
              //   open: true,
              //   header: (
              //     <IconButton
              //       sx={{
              //         position: "absolute",
              //         right: "-5px",
              //         top: "-10px",
              //       }}
              //       onClick={() => handleAction("close-find-info", handlers)}
              //     >
              //       <Close />
              //     </IconButton>
              //   ),
              //   content: <div style={{ color: "#fff" }}>Finding song info</div>,
              // });
              // handleAction("find-album-info", handlers);
            }}
          >
            <YoutubeSearchedForIcon />
            <Typography component="span">Find song info</Typography>
          </Button>
        ) : null}
      </Stack>
    ),
    content: (
      <SongForm
        formData={placeholders}
        readOnly={readOnly}
        addon={addon}
        onStateChange={(_handlers) => (handlers = _handlers)}
        onSubmit={(formData, stateChanged) => {
          handleAction("close");
          if (stateChanged) {
            serializeToBody(formData, placeholders, (prop, value) => {
              switch (prop) {
                case "year":
                case "track":
                  return parseInt(value);
                default:
                  return value;
              }
            });
            handleAction("update", formData);
          }
        }}
      />
    ),
    actions: (
      <Stack>
        {readOnly ? (
          <Button
            variant="radius"
            sx={{
              bgColor: "secondary-hover",
            }}
            onClick={() => handleAction("close")}
          >
            Close
          </Button>
        ) : (
          <>
            <Button
              variant="radius"
              sx={{
                bgColor: "secondary-hover",
              }}
              onClick={() => handleAction("close")}
            >
              Cancel
            </Button>
            <Button
              variant="radius"
              sx={{
                bgColor: "secondary-hover",
              }}
              onClick={() => handlers.handleSubmit()}
            >
              Update
            </Button>
          </>
        )}
      </Stack>
    ),
  };
};

export const FormInput = ({
  label,
  error,
  value,
  onChange,
  name,
  readOnly,
  ...rest
}) => {
  const _styles = {
    iconText: {
      display: {
        xs: "none",
        s280: "inline-flex",
      },
    },
    input: {
      sx: {
        backgroundColor: "rgba(184,184,184,.1)",
        borderRadius: "20px",
        height: "35px",
        width: "100%",
        mt: "5px",
        transition: "border .3s ease-in-out",
      },
      inputProps: {
        background: "transparent",
        width: "100%",
        px: 1,
        pl: 2,
        borderRadius: "inherit",
        color: "#4c5262",
        "&::placeholder": {
          color: "#4c5262",
        },
      },
    },
    inputBox: {
      px: 1,
      my: 1,
      maxWidth: "500px",
      mx: "atuo",
    },
  };

  return (
    <Grid xs={12} sm={6} {...rest} item>
      <Box sx={{}}>
        <Typography
          htmlFor="playlist-name"
          component="label"
          color="primary.main"
        >
          {label}
          {error && (
            <Typography component="span" sx={{ color: "red" }}>
              *
            </Typography>
          )}
        </Typography>
        <Input
          disableUnderline
          readOnly={readOnly}
          error={true}
          name={name}
          onChange={onChange}
          placeholder={"Enter your name"}
          value={value}
        />
      </Box>
    </Grid>
  );
};
