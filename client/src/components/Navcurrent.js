import {
  AppBar,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  Avatar,
  Drawer,
  Button,
  Tabs,
  Tab,
  Popover,
  useMediaQuery,
} from "@mui/material";
import {
  Add,
  Apps,
  ArrowForward,
  KeyboardArrowLeft,
  LibraryMusic,
  LockClock,
  Login,
  MoreHoriz,
  MusicNote,
  Radio,
  Search,
  Shuffle,
  ShuffleOn,
  ShuffleOnOutlined,
  Sort,
  ThumbUpSharp,
  UploadFile,
} from "@mui/icons-material";
// import PlaylistsView from "./PlaylistsView";
import { useStateValue } from "../provider";
import { deSerializeUserFromCookie, getScrollbarWidth } from "../helpers";
import { gql, useMutation } from "@apollo/client";
import Upload from "@mui/icons-material/UploadFile";
import { LAYOUT, ROLE } from "../config";
import { SearchQueryForm } from "./Forms";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import AlbumIcon from "@mui/icons-material/Album";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import { HorizontalScroll } from "./Animations";
import { useTheme } from "@emotion/react";
import { SET_POPOVER, SET_SETTINGS } from "../provider/reducer";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

export const LinkWithQuery = ({
  children,
  to,
  search: s,
  replace = false,
  ...props
}) => {
  const { search } = useLocation();

  return (
    <Link
      to={
        replace
          ? to
          : to +
            (search.endsWith("&")
              ? search + s || ""
              : search + (s ? "&" + s : ""))
      }
      {...props}
      style={{ color: "#fff", ...props.style }}
    >
      {children}
    </Link>
  );
};

export const Sidebar = ({ width, height, navMinHeight = "" }) => {
  const user = deSerializeUserFromCookie();
  const list = [
    {
      text: "Playlist",
      to: "/u/playlists",
      icon: MusicNote,
    },
    {
      text: "Recent plays",
      icon: LockClock,
      to: "/u/recent-plays",
    },
    {
      text: "Recommended",
      icon: ThumbUpSharp,
      onClick: () => {},
    },
  ];
  const _styles = {
    btn: {
      color: "secondary.contrastText",
      "&:hover": {
        backgroundColor: "primary.dark",
      },
    },
  };
  const barRef = useRef();
  if (user.role === ROLE.ARTIST)
    list.splice(1, 0, {
      text: "Albums",
      to: "/u/albums",
      style: {
        display: user ? "inline" : "none",
      },
      icon: AlbumIcon,
    });
  return (
    <>
      <Box
        sx={{
          width: "200px",
          height: "calc(100% - 80px)",
          position: "fixed",
          top: 0,
          left: 0,
          display: {
            xs: "none",
            sm: "block",
          },
        }}
      >
        <Stack
          ref={barRef}
          variant="flex-center"
          justifyContent="space-around"
          sx={{
            backgroundColor: "primary.main",
            width: `100%`,
            height: "46px",
          }}
        >
          <LinkWithQuery to="/discover">
            <Avatar
              sx={{
                mx: 1,
                boxShadow: "0px 0px 5px #070d16",
                width: "25px",
                height: "25px",
              }}
            />
          </LinkWithQuery>
          <IconButton sx={_styles.btn} onClick={() => {}}>
            <NotificationsIcon
              sx={
                {
                  // color: settings?.bgControl ? "secondary.main" : "inherit",
                }
              }
            />
          </IconButton>
          <LinkWithQuery
            sx={{
              ..._styles.btn,
            }}
            to="/settings"
          >
            <SettingsIcon
              sx={
                {
                  // color: settings?.backgroundPlay ? "secondary.main" : "inherit",
                }
              }
            />
          </LinkWithQuery>
          <IconButton sx={_styles.btn}>
            <Login />
          </IconButton>
        </Stack>
        <Box
          id="gh"
          sx={{
            overflow: "auto",
            height: "calc(100% - 46px)",
            zIndex: 1500,
            backgroundColor: "primary.main",
            "&::-webkit-scrollbar": {
              width: "25px",
            },
          }}
        >
          <List disablePadding>
            {list.map((li, index) => (
              <LinkWithQuery
                key={index}
                to={li.to || "#"}
                sx={{
                  display: "block",
                  width: "100%",
                  color: "#fff",
                  px: 1,
                  transition: ".3s linear",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                    transition: ".3s linear",
                  },
                }}
              >
                <ListItem
                  key={index}
                  disableGutters
                  onClick={li.onClick || (() => {})}
                >
                  <ListItemIcon
                    sx={{ color: "primary.contrastText", minWidth: "25px" }}
                  >
                    <li.icon sx={{ fontSize: "20px" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={li.text}
                    sx={{
                      mx: 3,
                    }}
                    primaryTypographyProps={{
                      variant: "caption",
                    }}
                  />
                </ListItem>
              </LinkWithQuery>
            ))}
          </List>
        </Box>
      </Box>
    </>
  );
};

export const SecondaryBar = ({
  handleAction,
  actionsMap = {},
  styles = {},
  hideDivider,
  noArtist,
  noAdd,
}) => {
  const [{ selectionLen }] = useStateValue();
  const [openPopover, setOpenPopover] = useState(false);
  const [popperGroup, setPopperGroup] = useState({});
  const [sortBy, setSortBy] = useState("Date Added");
  const [genre, setGenre] = useState(
    actionsMap.genres ? actionsMap.genres[0] || "" : ""
  );
  const hide = useMediaQuery((theme) =>
    theme.breakpoints.up(actionsMap.hideMore)
  );

  const moreBtnRef = useRef();
  useEffect(() => {
    if (hide) setOpenPopover(false);
  }, [hide]);

  // using overflow to avoid content overlap.
  // if it occurs in some screen improving ux
  // tested on popular browsers and screen
  // resolution position is ok.
  const _styles = {
    iconTextBox: {
      backgroundColor: "primary.main",
      ml: 1,
      borderRadius: "20px",
      p: 1,
      "&:hover > *": {
        color: "secondary.light",
      },
      "& > button": {
        p: 0,
      },
      "&>span": {
        marginRight: "8px",
      },
      "& > div": {
        maxWidth: {
          xs: actionsMap.moreBtn === "s280" ? "70px" : "40px",
          md: "60px",
        },
      },
    },
  };
  let handleGenre, handleShuffle;
  const handleSortBy = ({ currentTarget, sortBy }) => {
    if (currentTarget)
      setPopperGroup({
        anchorEl: currentTarget,
        openFor: "sortBy",
        open: true,
      });
    else {
      setSortBy(sortBy);
      handleAction("sort-by", sortBy);
      setPopperGroup((prev) => ({
        ...prev,
        open: false,
      }));
    }
  };

  const popperList = [
    {
      icon: selectionLen >= 0 ? Add : Add,
      element: false ? (
        <>
          <Typography component="span">Selected: </Typography>
          <HorizontalScroll>{actionsMap.sortBy || "1"}</HorizontalScroll>
        </>
      ) : (
        <>
          <Typography component="span">Add</Typography>
        </>
      ),
      onClick: selectionLen ? () => {} : () => handleAction("addTo"),
      sx: {
        display: {
          xs: "flex",
          s200: "none",
        },
      },
    },
    {
      icon: Sort,
      onClick: handleSortBy,
      element: (
        <>
          <Typography component="span">Sort By: </Typography>
          <HorizontalScroll>{sortBy}</HorizontalScroll>
        </>
      ),
      sx: {
        display: {
          xs: noAdd ? "none" : "flex",
          s280: "none",
        },
      },
    },
  ];

  if (actionsMap.listLen) {
    handleShuffle = () => {
      setOpenPopover(false);
      handleAction("shuffle");
    };
    popperList.splice(2, 0, {
      icon: Shuffle,
      element: (
        <>
          {false ? (
            <Typography component="span">Cancel</Typography>
          ) : (
            <>
              <Typography component="span">Shuffle: </Typography>
              <HorizontalScroll>
                <Typography component="span" color="secondary-hover">
                  ({actionsMap.listLen})
                </Typography>
              </HorizontalScroll>
            </>
          )}
        </>
      ),
      sx: {
        display: {
          xs: "flex",
          [noAdd ? "s320" : "md"]: "none",
        },
      },
    });
  }
  if (actionsMap.genres?.length) {
    handleGenre = ({ currentTarget }) => {
      setPopperGroup({
        anchorEl: currentTarget,
        openFor: "genre",
        open: true,
      });
    };
    popperList.splice(3, 0, {
      icon: QueueMusicIcon,
      onClick: handleGenre,
      element: (
        <>
          <Typography component="span">Genre: </Typography>
          <HorizontalScroll>
            <Typography component="span" color="secondary-hover">
              {genre || (actionsMap.genres ? actionsMap.genres[0] || "" : "")}
            </Typography>
          </HorizontalScroll>
        </>
      ),
      sx: {
        display: {
          xs: "flex",
          [noAdd
            ? actionsMap.listLen === undefined
              ? "s320"
              : "s640"
            : "s1024"]: "none",
        },
      },
    });
  }

  const renderPopperGroup = () => {
    switch (popperGroup.openFor) {
      case "genre":
        return actionsMap.genres;
      case "sortBy":
        return [
          {
            element: "Date Added",
            onClick: () => handleSortBy({ sortBy: "Date Added" }),
          },
          {
            element: "A-Z",
            onClick: () => handleSortBy({ sortBy: "A-Z" }),
          },
          {
            element: "Release Year",
            onClick: () => handleSortBy({ sortBy: "Release Year" }),
          },
          {
            nullify: noArtist,
            element: "Artist",
            onClick: () => handleSortBy({ sortBy: "Artist" }),
          },
        ];
      default:
        return [];
    }
  };
  return (
    <>
      <Box
        sx={{
          height: "50px",
          maxHeight: "50px",
          overflow: "auto",
          p: 1,
          [`borderTop`]: (theme) =>
            `1px solid ${
              hideDivider ? "transparent" : theme.palette.primary.light
            }`,
        }}
      >
        <Stack
          sx={{
            height: "100%",
            width: "100%",
          }}
        >
          <Stack
            sx={{
              height: "100%",
              flexGrow: 1,
            }}
            justifyContent="normal"
          >
            {selectionLen >= 0 ? (
              <Button
                sx={{
                  ..._styles.iconTextBox,
                  display: {
                    xs: "none",
                    s200: "flex",
                  },
                }}
                onClick={() => {}}
              >
                <Sort />
                <Typography component="span">Selected:</Typography>
                <HorizontalScroll>{selectionLen}</HorizontalScroll>
              </Button>
            ) : noAdd ? null : (
              <Button
                sx={{
                  ..._styles.iconTextBox,
                  display: {
                    xs: "none",
                    s200: "inline-flex",
                  },
                }}
                onClick={() => handleAction("addTo")}
              >
                <Sort />
                <Typography component="span">Add</Typography>
              </Button>
            )}
            <Button
              sx={{
                ..._styles.iconTextBox,
                display: {
                  xs: noAdd ? "inline-flex" : "none",
                  s280: "inline-flex",
                },
              }}
              onClick={handleSortBy}
            >
              <Sort />
              <Typography component="span">Sort by:</Typography>
              <HorizontalScroll>{sortBy}</HorizontalScroll>
            </Button>
            {actionsMap.listLen ? (
              <Button
                sx={{
                  ..._styles.iconTextBox,
                  display: {
                    xs: "none",
                    [noAdd ? "s640" : "md"]: "inline-flex",
                  },
                }}
                onClick={handleShuffle}
              >
                <Sort />
                <Typography component="span">Shuffle:</Typography>
                <HorizontalScroll>
                  ({actionsMap.listLen || "Date Addedddddddddddddddddddddddddd"}
                  )
                </HorizontalScroll>
              </Button>
            ) : null}

            {actionsMap.genres?.length ? (
              <Button
                sx={{
                  ..._styles.iconTextBox,
                  display: {
                    xs: "none",
                    [noAdd
                      ? actionsMap.listLen === undefined
                        ? "s320"
                        : "sm"
                      : "md"]: "inline-flex",
                  },
                }}
                onClick={handleSortBy}
              >
                <Sort />
                <Typography component="span">Genre:</Typography>
                <HorizontalScroll>
                  {genre ||
                    (actionsMap.genres ? actionsMap.genres[0] || "" : "")}
                </HorizontalScroll>
              </Button>
            ) : null}
          </Stack>

          <Button
            ref={moreBtnRef}
            sx={{
              display: {
                [actionsMap.hideMore || "s280"]: "none",
              },
              ...styles.moreBtn,
            }}
            onClick={() => {
              setOpenPopover(true);
            }}
          >
            <MoreHoriz />
          </Button>
        </Stack>
      </Box>
      <Popover
        open={popperGroup.open || false}
        PaperProps={{
          sx: {
            backgroundColor: "primary.main",
            width: "80%",
            maxWidth: "250px",
          },
        }}
        onClose={() => {
          setOpenPopover(false);
          setPopperGroup((prev) => ({
            ...prev,
            open: false,
          }));
        }}
        anchorEl={popperGroup.anchorEl}
      >
        <List disablePadding>
          {renderPopperGroup().map((l, i) =>
            l.nullify ? null : (
              <ListItem
                key={i}
                sx={{
                  cursor: "pointer",
                  color: "secondary.main",
                  "&:hover": {
                    backgroundColor: "primary.light",
                  },
                }}
                onClick={
                  l.onClick ||
                  (() => {
                    setGenre(l);
                    setOpenPopover(false);
                    setPopperGroup((prev) => ({
                      ...prev,
                      open: false,
                    }));
                    handleAction("genre", l);
                  })
                }
              >
                {l.element || l}
              </ListItem>
            )
          )}
        </List>
      </Popover>
      <Popover
        open={openPopover}
        anchorEl={moreBtnRef.current}
        PaperProps={{
          sx: {
            backgroundColor: "primary.main",
            width: "80%",
            maxWidth: "250px",
          },
        }}
        onClose={() => {
          setOpenPopover({});
          setOpenPopover(false);
        }}
      >
        <List disablePadding>
          {popperList.map((item, i) => (
            <ListItem
              key={i}
              sx={{
                cursor: "pointer",
                ...item.sx,
                "&:hover": {
                  backgroundColor: "primary.light",
                },
                p: 0,
              }}
              onClick={item.onClick}
            >
              <ListItemButton
                alignItems="center"
                sx={{
                  width: "inherit",
                  overflow: "hidden",
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "secondary.main",
                    minWidth: "0px",
                  }}
                >
                  <item.icon sx={{ fontSize: "20px" }} />
                </ListItemIcon>
                <ListItemText
                  typo
                  primary={item.element}
                  sx={{
                    overflow: "hidden",
                    width: "100%",
                    whiteSpace: "nowrap",
                    ml: 1,
                  }}
                  primaryTypographyProps={{
                    component: "div",
                    sx: {
                      display: "flex",
                      alignItems: "center",
                      "&>span": {
                        mr: 1,
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Popover>
    </>
  );
};

export const Header = ({
  secondaryBar,
  activeTab = "Discover",
  navs,
  styles = {},
  secondaryBarProps = null,
  mountCategoryBar,
  categoryBarProps,
  categoryBar,
  searchQueryProps,
}) => {
  activeTab = activeTab.toLowerCase();
  const [tab, setTab] = useState(activeTab);
  navs = navs || [
    {
      label: "Discover",
      to: "/discover",
      icon: Apps,
    },
    {
      label: "Library",
      to: "/u/library",
      icon: LibraryMusic,
    },
    {
      label: "Explore",
      to: "/explore",
      icon: Search,
    },
    {
      label: "Radios",
      to: "/radios",
      icon: Radio,
    },
  ];

  secondaryBar =
    secondaryBar === undefined ? (
      <SecondaryBar {...secondaryBarProps} />
    ) : (
      secondaryBar
    );
  return (
    <AppBar
      id="fff"
      position="fixed"
      sx={{
        backgroundColor: "inherit",
        boxShadow: "none",
        p: 0,
        width: {
          xs: "100%",
          sm: "calc(100% - 200px)",
        },
        top: 0,
        right: 0,
        "& + main": {
          mt: secondaryBar ? "80px" : "44px",
        },
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          justifyContent: "normal",
          minHeight: "50px !important",
          maxHeight: "50px !important",
          overflow: "auto",
        }}
      >
        <IconButton>
          <KeyboardArrowLeft />
        </IconButton>
        <Box component="nav" sx={{ border: "1px solid red", flexGrow: 1 }}>
          <Tabs
            onChange={(_, value) => {
              setTab(value);
            }}
            value={tab}
            textColor="secondary"
            indicatorColor="secondary"
          >
            {navs.map((l, i) => (
              <Tab
                onClick={
                  l.label.toLowerCase() === activeTab
                    ? () => {}
                    : l.onClick || (() => {})
                }
                key={i}
                sx={{
                  color: "white",
                }}
                LinkComponent={LinkWithQuery}
                to={l.to}
                label={l.label}
                value={l.label.toLowerCase()}
                onMouseOver={() => setTab(l.label.toLowerCase())}
                onMouseLeave={() => setTab(activeTab)}
                // icon={<l.icon />}
              />
            ))}
          </Tabs>
        </Box>

        <SearchQueryForm {...searchQueryProps} styles={{}} />
        {/* <LinkWithQuery to={`/u/profile/${user?.id}`}> */}
        {/* <Avatar /> */}
        {/* </LinkWithQuery> */}
      </Toolbar>
      <Box>{secondaryBar}</Box>
      {mountCategoryBar && (
        <Box>
          {categoryBar || (
            <>
              <Button
                variant="tab"
                onClick={() => categoryBarProps.onChange("hot")}
              >
                Hot
              </Button>
              <Button
                variant="tab"
                onClick={() => categoryBarProps.onChange("new")}
              >
                New
              </Button>
            </>
          )}
        </Box>
      )}
      {/* <Typography>Updated Hourly moost trending songs in the region</Typography> */}
    </AppBar>
  );
};

export const LeadTo = ({
  primaryTitle,
  secondaryTitle,
  gap = 1,
  activeTab,
  handleAction,
  renderTabsBtn,
  variant,
  to = "",
}) => (
  <Box sx={{ p: gap, pb: 0 }}>
    <Stack alignItems="center" justifyContent="space-between">
      <Typography variant={"h4"}>{primaryTitle}</Typography>
      <LinkWithQuery
        sx={{
          p: 0,
        }}
        to={to}
      >
        More
        <ArrowForward />
      </LinkWithQuery>
    </Stack>
    {renderTabsBtn && (
      <Stack sx={{ my: 1 }}>
        <Button
          variant="tab"
          active={activeTab === "hot"}
          onClick={() => handleAction("tabs", "hot")}
        >
          Hot
        </Button>
        <Button
          variant="tab"
          active={activeTab === "new"}
          onClick={() => handleAction("tabs", "new")}
        >
          New
        </Button>
      </Stack>
    )}
    <Typography variant="caption" sx={{ display: "inline-block", mb: 1 }}>
      {secondaryTitle}
    </Typography>
  </Box>
);
