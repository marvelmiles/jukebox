import React, { forwardRef, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useStateValue } from "../provider";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Popover from "@mui/material/Popover";
import { Sidebar, Header } from "./Navigation";
import { SET_DIALOG, SET_POPOVER } from "../provider/reducer";
import { Typography, useScrollTrigger } from "@mui/material";
import { HeightSharp } from "@mui/icons-material";
import { MUSIC_PLAYER, RADIO_PLAYER, SELECTION_MODE } from "../config";
import SelectionToolBox from "./SelectionToolBox";
import JukeBox from "./JukeBox";
const Container = React.forwardRef(
  (
    {
      mountHeader = true,
      headerProps,
      bgCover,
      sx,
      children,
      onScroll,
      emitScrollEndSentinel,
    },
    ref
  ) => {
    const [{ popover, dialog, currentFooter }, dispatch] = useStateValue();

    const stateRef = useRef({}).current;
    const mainRef = useRef();
    useEffect(() => {
      window.addEventListener("scroll", (e) => {
        if (window.scrollY < window.innerHeight / 4)
          mainRef.current.style.marginBottom = "0px";
        else if (
          window.innerHeight + window.scrollY + window.innerHeight / 4 >=
          Math.max(
            document.body.offsetHeight,
            document.body.scrollHeight,
            document.body.clientHeight
          )
        )
          mainRef.current.style.marginBottom = "80px";
      });
    }, []);
    const _renderFooter = () => {
      if (!currentFooter) return null;
      return Object.keys(currentFooter).map((footer, i) => {
        switch (footer) {
          case SELECTION_MODE:
            // currentFooter.active === SELECTION_MODE &&
            // console.log("dispatching SELECTION...", currentFooter);
            return (
              <div
                key={i}
                style={{
                  transform: `translateY(${
                    currentFooter.active === SELECTION_MODE ? 0 : 100
                  }px)`,
                }}
              >
                <SelectionToolBox layout="flex" />
              </div>
            );
          case MUSIC_PLAYER:
            // currentFooter.active === MUSIC_PLAYER &&
            // console.log("dispatchisng player...", currentFooter);
            return (
              <div
                key={i}
                style={{
                  transform: `translateY(${
                    currentFooter.active === MUSIC_PLAYER ? 0 : 100
                  }px)`,
                }}
              >
                <JukeBox isActive={currentFooter.active === MUSIC_PLAYER} />
              </div>
            );
          case RADIO_PLAYER:
            return (
              <div
                key={i}
                style={{
                  transform: `translateY(${
                    currentFooter.active === RADIO_PLAYER ? 0 : 100
                  }px)`,
                }}
              >
                <JukeBox isActive={currentFooter.active === RADIO_PLAYER} />
              </div>
            );
          default:
            return null;
        }
      });
    };

    return (
      <>
        <Box
          sx={{
            width: "100%",
            backgroundColor: "#070d16",
            position: "relative",
          }}
        >
          <Sidebar />
          {mountHeader && <Header {...headerProps} />}
          <Box
            ref={mainRef}
            component="main"
            id="main"
            sx={{
              position: "relative",
              mt: "80px !important",
              color: "#fff",
              py: mountHeader ? 2 : 0,
              // border: "1px solid blue",
              width: {
                xs: "100%",
                sm: `calc(100% - 200px)`,
              },
              ml: {
                xs: "0px",
                sm: "200px",
              },
              // height: "calc(100vh - 150px)",
              // marginTop: "130px !important",
              border: "1px solid red",
              overflow: "auto",
              ...(bgCover && {
                background: `linear-gradient(rgba(11,19,32,0.8777) 100%, rgba(11,19,32,0.8777) 100%),url(${bgCover})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 100%",
                backgroundPosition: "center center",
              }),
              ...sx,
            }}
          >
            <Typography>first mmeber</Typography>
            {children}
            <Typography>last memebr</Typography>
          </Box>
          <Box
            sx={{
              position: "fixed",
              width: "100%",
              height: "80px",
              backgroundColor: "transparent", //"#111727",
              bottom: 0,
              // overflow: "hidden",
              zIndex: currentFooter ? "modal" : -1,
              padding: 0,
              border: "1px solid red",
              "& > *": {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "1px solid orange",
                backgroundColor: "primary.dark",
                transition: ".3s linear",
              },
            }}
          >
            {_renderFooter()}
          </Box>
        </Box>
        <Dialog
          open={dialog?.open || false}
          onClose={
            dialog?.autoClose
              ? () =>
                  dispatch({
                    type: SET_DIALOG,
                    payload: {
                      open: false,
                    },
                  })
              : () => {}
          }
        >
          {dialog?.header && <DialogTitle>{dialog.header}</DialogTitle>}
          <DialogContent
            sx={{
              p: 0,
            }}
          >
            {dialog?.content}
          </DialogContent>
          {dialog?.actions && <DialogActions>{dialog.actions}</DialogActions>}
        </Dialog>

        <Popover
          open={popover ? popover.open : false}
          anchorEl={popover ? popover.anchorEl : null}
          PaperProps={{
            sx: {
              backgroundColor: "primary.main",
              width: "80%",
              maxWidth: "250px",
            },
          }}
          onClose={() =>
            dispatch({
              type: SET_POPOVER,
              payload: {
                open: false,
              },
            })
          }
        >
          {popover?.content}
        </Popover>
      </>
    );
  }
);

Container.propTypes = {};

export default Container;
