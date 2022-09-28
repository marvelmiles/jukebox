import { Box, IconButton, Stack, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import useTouchDevice from "../hooks/useTouchDevice";
import { LeadTo } from "./Navigation";
export const HorizontalScroll = ({
  gap = 100,
  maxWidth = "100%",
  styles = {},
  children,
}) => {
  let rootRef = useRef();
  let animateRef = useRef();
  let hiddenRef = useRef();
  useEffect(() => {
    const animate = animateRef.current;
    let hasLeave;
    const mouseLeave = () => (hasLeave = true);
    const animateEnd = (e) => {
      e.target.style.animationName = "";
      hiddenRef.current.style.display = "none";
      if (!hasLeave) {
        // setting a delay reset browser animation state to new props
        setTimeout(() => {
          hiddenRef.current.style.display = "inline-block";
          e.target.style.animationName = "horizontal-scroll";
        }, 0);
      }
    };
    const mouseOver = (e) => {
      if (
        animateRef.current.clientWidth / 2 >
        rootRef.current.clientWidth / 2
      ) {
        hasLeave = false;
        hiddenRef.current.style.display = "inline-block";
        e.currentTarget.style.animationName = "horizontal-scroll";
        e.currentTarget.addEventListener("animationend", animateEnd);
      }
    };
    animate.addEventListener("mouseover", mouseOver, false);
    animate.addEventListener("mouseleave", mouseLeave, false);
    return () => {
      animate.removeEventListener("mouseover", animate, false);
      animate.removeEventListener("animationend", animateEnd, false);
      animate.removeEventListener("mouseleave", mouseLeave, false);
    };
  }, []);

  return (
    <Typography
      component="span"
      sx={{
        flexGrow: 1,
        // border: "1px solid red",
        maxWidth,
        overflow: "hidden",
        ...styles.root,
      }}
      id="dd"
      ref={rootRef}
    >
      <Box
        ref={animateRef}
        id="child"
        sx={{
          whiteSpace: "nowrap",
          display: "inline-block",
          overflow: "hidden",
          animationTimingFunction: "linear",
          animationDuration: "10s",
          minWidth: "100%",
          verticalAlign: "middle",
          "& > div": {
            display: "inline-block",
            margin: 0,
            verticalAlign: "middle",
          },
          "@keyframes horizontal-scroll": {
            "0%": {
              transform: "translateX(0%)",
            },
            "100%": {
              transform: "translateX(-50%)",
            },
          },
        }}
      >
        <div>{children}</div>
        <div
          ref={hiddenRef}
          style={{
            display: "none",
            marginLeft: gap + "px",
            marginRight: gap + "px",
          }}
        >
          {children}
        </div>
      </Box>
    </Typography>
  );
};

export const CardCarousel = ({
  children,
  title,
  cardWidth = 350,
  primaryTitle,
  secondaryTitle,
  renderTabsBtn,
  renderLeadTo = true,
  activeTab,
  variant = "h5",
  handleAction,
  renderArrowBtnOnly,
  leadsToProps,
  onScroll,
  emitScrollEndSentinel = 150 * 4,
  component,
}) => {
  const { isTouchDevice } = useTouchDevice();
  const listRef = useRef();
  const stateRef = useRef({}).current;
  return (
    <>
      <Box
        justifyContent="space-between"
        alignItems="center"
        sx={{ my: 2, position: "relative", p: 1 }}
      >
        {!renderArrowBtnOnly && <LeadTo {...leadsToProps} />}
        <Box
          sx={{
            position: "absolute",
            right: 0,
            bottom: "-10px",
          }}
        >
          <IconButton
            sx={{ mr: 1 }}
            onClick={() => {
              listRef.current.scrollLeft -= cardWidth;
            }}
          >
            <KeyboardBackspaceIcon sx={{ mx: 1 }} />
          </IconButton>
          <IconButton
            onClick={() => {
              listRef.current.scrollLeft += cardWidth;
            }}
          >
            <ArrowRightAltIcon sx={{ mx: 1 }} />
          </IconButton>
        </Box>
      </Box>
      <Stack
        onScroll={(e) => {
          // console.log(
          //   e.target.scrollWidth,
          //   e.target.scrollLeft,
          //   e.target.clientWidth,
          //   "ss"
          // );
          if (!onScroll) return;

          onScroll(
            Math.floor(
              (e.target.scrollLeft + e.target.clientWidth) / cardWidth
            ),
            e.target.scrollLeft > stateRef.prevScrollPos &&
              e.target.scrollLeft + emitScrollEndSentinel >=
                e.target.scrollWidth - e.target.clientWidth
          );
          stateRef.prevScrollPos = e.target.scrollLeft;
        }}
        sx={{
          overflow: isTouchDevice ? "auto" : "hidden",
          scrollBehavior: "smooth",
          maxWidth: "100%",
        }}
        ref={listRef}
      >
        {children}
      </Stack>
    </>
  );
};

export const Wave = ({ isPaused = false, unset, sx }) => {
  const _styles = {
    wave: {
      width: "3px",
      height: "10px",
      marginRight: "3px",
      borderRadius: "10px 10px 0 0",
      background: "#36e2ec",
      animation: unset ? "unset" : "wave .5s linear infinite",
      animationPlayState: isPaused ? "paused" : "running",
      "@keyframes wave": {
        "0%": {
          height: "10px",
        },
        "50%": {
          height: "15px",
        },
        "100%": {
          height: "10px",
        },
      },
    },
  };

  return (
    <>
      <Stack
        direction="row"
        sx={{
          width: "30px",
          height: "35px",
          border: "1px solid #fff",
          pb: "5px",
          mx: 1,
          ...sx,
        }}
        alignItems="flex-end"
        justifyContent="center"
      >
        <Box
          sx={{
            ..._styles.wave,
          }}
        ></Box>
        <Box
          sx={{
            ..._styles.wave,
            height: "15px",
            animationDelay: ".4s",
          }}
        ></Box>
        <Box
          sx={{
            ..._styles.wave,
            height: "8px",
            animationDelay: ".8s",
          }}
        ></Box>
      </Stack>
    </>
  );
};

export const Loading = () => <div>loading....</div>;
