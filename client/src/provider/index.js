import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "../config";
import {
  createTheme,
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  useTheme,
} from "@mui/material";
export const StateContext = createContext();

export const useStateValue = () => {
  return useContext(StateContext);
};
export const StateProvider = ({ initState = {}, reducer, children }) => {
  initState.socket = useRef(io.connect(BACKEND_URL)).current;
  if (initState.socket.disconnected)
    initState.socket = initState.socket.connect();
  useEffect(() => {
    initState.socket.on("connect", () => {
      // clears buffered res before connection
      initState.socket.sendBuffer = [];
    });
    return () => initState.socket.disconnect();
  }, [initState.socket]);
  const mode = "light";
  const fontFamily = "'Mali', cursive;";
  const _theme = useTheme();
  const theme = createTheme({
    palette: mode
      ? {
          primary: {
            main: "#0b1320",
            dark: "#070d16",
            light: "#3b424c",
            contrastText: "#fff",
          },
          secondary: {
            main: "#5adae0",
            light: "#36e2ec",
            contrastText: "#fff",
          },
        }
      : {
          primary: {
            main: "#ffe",
            dark: "#cce",
            light: "#3ff",
          },
        },
    components: {
      MuiPopover: {
        styleOverrides: {
          paper: ({ theme: { palette } }) => ({
            backgroundColor: palette.primary.main,
            width: "80%",
            maxWidth: "250px",
          }),
        },
      },
      MuiPaper: {
        variants: [
          {
            props: { variant: "form" },
            style: ({ theme: { spacing, shadows } }) => ({
              padding: spacing(1),
              maxWidth: "567px",
              width: "95%",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              boxShadow: shadows[6],
            }),
          },
        ],
      },
      MuiDialog: {
        defaultProps: {
          PaperProps: {
            sx: {
              backgroundColor: "primary.main",
              borderRadius: "12px",
              p: 0,
              margin: "16px",
              width: "100%",
              maxWidth: "600px",
            },
          },
        },
      },
      MuiDialogTitle: {
        defaultProps: {
          sx: {
            pb: 0,
          },
        },
      },
      MuiDialogActions: {
        sx: {
          pb: 2,
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({
            ownerState,
            theme: {
              palette: {
                secondary: { main },
              },
              spacing,
            },
          }) => {
            return {
              fontFamily,
              color: `${main}`,
              textTransform: "none",
              border: `2px solid transparent`,
              minWidth: 0,
              width: "auto",
              fontSize: spacing(2),
              whiteSpace: "nowrap",
              "&>svg": {
                fontSize: "20px",
              },
              alignItems: "center",
              textAlign: "center",
              ...(ownerState.sx?.bgColor === "secondary-hover"
                ? {
                    backgroundColor: `${theme.palette.secondary.main}`,
                    color: theme.palette.primary.contrastText,
                    transition: ".3s linear",
                    "&:hover": ownerState.active
                      ? {
                          backgroundColor: `${theme.palette.secondary.main}`,
                          color: theme.palette.primary.contrastText,
                          transition: ".3s linear",
                        }
                      : {
                          border: `2px solid ${theme.palette.secondary.light}`,
                          backgroundColor: "none",
                          color: theme.palette.secondary.main,
                          transition: ".3s linear",
                        },
                  }
                : ownerState.sx?.bgColor === "secondary-hover-bg"
                ? {
                    backgroundColor: "none",
                    border: `2px solid ${theme.palette.secondary.light}`,
                    color: theme.palette.secondary.light,
                    transition: ".3s linear",
                    "&:hover": ownerState.active
                      ? {
                          backgroundColor: "none",
                          border: `2px solid ${theme.palette.secondary.light}`,
                          color: theme.palette.secondary.light,
                          transition: ".3s linear",
                        }
                      : {
                          backgroundColor: theme.palette.secondary.main,
                          color: theme.palette.secondary.contrastText,
                          transition: ".3s linear",
                        },
                  }
                : {}),
            };
          },
        },
        variants: [
          {
            props: { variant: "contained" },
            style: ({ theme: { spacing } }) => ({
              width: "100%",
              height: "45px",
              borderRadius: spacing(12),
              margin: `${spacing(2)} 0`,
            }),
          },
          {
            props: { variant: "tab" },
            style: ({
              theme: {
                palette: { primary },
                spacing,
              },
              ownerState,
            }) => {
              return {
                backgroundColor: primary.main,
                borderRadius: spacing(12),
                fontSize: "0.85em",
                marginLeft: spacing(1),
                // color:
                //   ownerState?.active === "hot" ? "primary.contrastText" : "",
                // ml: 2,
                // borderRadius: "20px",
                // width: "60px",
                // padding: 8,
                // border: "1px solid red",
                // lineHeight: 1.5,
                // display: "inline-flex",
              };
            },
          },
        ],
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({
            theme: {
              palette: { primary },
            },
          }) => ({
            color: primary.contrastText,
            width: "35px",
            minWidth: "35px",
            textTransform: "none",
            minHeight: "35px",
            height: "35px",
            backgroundColor: primary.main,
            alignItems: "center",
            justifyContent: "center",
            "&:hover": {
              backgroundColor: primary.light,
              color: primary.dark,
            },
            "& > *": {
              fontSize: "20px",
            },
          }),
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: ({
            theme: {
              palette: {
                secondary: { main },
              },
            },
          }) => ({
            minWidth: "40px",
            color: main,
          }),
        },
      },
      MuiInput: {
        defaultProps: {
          disableUnderline: true,
        },
        styleOverrides: {
          root: ({
            theme: {
              palette: {
                divider,
                primary: { main },
              },
              spacing,
            },
          }) => ({
            fontFamily,
            border: `2px solid ${divider}`,
            // width: "100%",
            borderRadius: spacing(12),
            height: "45px",
            paddingLeft: spacing(2),
            color: main,
            fontWeight: "500",
            margin: `${spacing(2)} 0`,
          }),
        },
      },
      MuiTypography: {
        defaultProps: {
          variant: "h5",
        },
        styleOverrides: {
          root: ({ ownerState, theme }) => {
            return {
              fontFamily,
              ...(ownerState.color === "secondary-hover" ||
              ownerState.sx?.color === "secondary-hover"
                ? {
                    color: theme.palette.secondary.main,
                    transition: "color .3s linear",
                    "&:hover": {
                      color: theme.palette.secondary.dark,
                      transition: "color .3s linear",
                    },
                  }
                : ownerState.color === "contrastText-hover" ||
                  ownerState.sx?.color === "contrastText-hover"
                ? {
                    color: theme.palette.primary.contrastText,
                    transition: "color .3s linear",
                    "&:hover": {
                      color: theme.palette.primary.light,
                      transition: "color .3s linear",
                    },
                  }
                : {
                    color: theme.palette.secondary.main,
                  }),
            };
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: "transparent",
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: ({
            theme: {
              palette: { primary },
            },
          }) => ({
            fontFamily,
            color: primary.contrastText,
            cursor: "pointer",
            fontSize: "10px",
          }),
        },
      },
      MuiStack: {
        defaultProps: {
          direction: "row",
          justifyContent: "center",
          alignItems: "center",
        },
        // styleOverrides: {
        //   root: ({ sx }) => {
        //     const style = {};
        //     if (sx.bg) {
        //       Object.assign(style, {
        //         width: "100%",
        //         padding: 0,
        //         textAlign: "center",
        //         height: "inherit",
        //         background: `linear-gradient(rgba(11,19,32,0.8777) 100%, rgba(11,19,32,0.8777) 100%),url(${sx.src})`,
        //         backgroundRepeat: "no-repeat",
        //         backgroundSize: "100% 100%",
        //         backgroundPosition: "center center",
        //       });
        //       delete sx.bg;
        //       delete sx.src;
        //     }
        //     return style;
        //   },
        // },
        variants: [
          {
            props: { variant: "flex-center" },
            style: {
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            },
          },
          {
            props: { variant: "brand" },
            style: ({
              theme: {
                palette: { primary, secondary },
                spacing,
              },
              sx,
            }) => {
              return {
                margin: `0 ${spacing(1)}`,
                backgroundColor: "transparent",
                "&>div": {
                  backgroundColor:
                    sx?.color === "dark" ? primary.dark : primary.main,
                  color: sx?.color === "dark" ? secondary.main : secondary.main,
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  margin: `0 ${spacing(1)}`,
                },
                "& .MuiTypography-root": {
                  color: sx?.color === "dark" ? secondary.main : primary.main,
                },
              };
            },
          },
        ],
      },
    },
    breakpoints: {
      values: {
        ..._theme.breakpoints.values,
        sm: 567,
        md: 768,
        lg: 1200,
        s1024: 1024,
        s200: 200,
        s400: 400,
        s480: 480,
        s640: 640,
        s320: 320,
        s360: 360,
        s280: 280,
        s900: 900,
      },
    },
    // secondaryHover: {
    //   color: (theme) => theme.palette.secondary.dark,
    //   "&:hover": {
    //     color: (thme) => theme.palette.secondary.main,
    //   },
    // },
  });

  return (
    <StateContext.Provider value={useReducer(reducer, initState)}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          "#root": {
            width: "100%",
            minHeight: "100vh",
            fontFamily,
          },

          "@keyframes rotation": {
            from: {
              transform: "rotate(0deg)",
            },
            to: {
              transform: "rotate(360deg)",
            },
          },
        }}
      />
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StateContext.Provider>
  );
};
