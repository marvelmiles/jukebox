// All state are set has Null || Object
export const initState = {
  dialog: null,
  popover: null,
  recentPlays: null,
  currentFooter: null,
  selections: null, // {selectionList:{index,id},collection:{}}
  collection: null,
  settings: {
    playback: {
      enableInterfaceControl: true,
      closePlayer: false,
      autoplay: true,
    },
    bgPlay: {
      prioritizeOnPause: true,
    },
  },
  audioPlaying: {},
};

// {
//   backgroundPlay: true,
//   bgControl: true,
//   autoplay: true,
// }
