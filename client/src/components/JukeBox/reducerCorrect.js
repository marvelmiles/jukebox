import { MUSIC_PLAYER, RADIO_PLAYER, SELECTION_MODE } from "../config";
import { isObject } from "../helpers";

export const SET_PLAYING_SONG = "SET_PLAYING_SONG";
export const SET_PLAYLISTS = "SET_PLAYLISTS";
export const SET_PLAYLIST = "SET_PLAYLIST";
export const SET_ALL_SONGS = "SET_ALL_SONGS";
export const SET_SONG = "SET_SONG";
export const FIFO_PUSH_HISTORY = "PUSH_HISTORY";
export const SIGNIN = "SIGNIN";
export const SET_DIALOG = "OPEN_DIALOG";
export const FIFO_STACK_ALBUM = "FIFO_STACK_ALBUM";
export const SET_ALL_ALBUMS = "SET_ALL_ALBUMS";
export const SET_CURRENT_FOOTER = "SET_CURRENT_FOOTER";
export const SET_SONGS = "SET_SONGS";
export const SET_SELECTIONS = "SET_SELECTED_SONGS";
export const REMOVE_SELECTIONS = "REMOVE_SELECTED_SONGS";
export const FILTER_SELECTIONS = "FILTER_SELECTED_SONGS";
export const UPDATE_SONG_AT = "UPDATE_SONG_AT";
export const SET_ALL_PLAYLISTS = "SET_ALL_PLAYLISTS";
export const SET_CACHE = "STACK_HISTORY";
export const FLUSH_CACHE = "FLUSH_CACHE";
export const SET_SELECTIONS_COLLECTION = "SET_SELECTIONS_COLLECTION";
export const SET_AUDIO_PLAYING = "SET_AUDIO_PLAYIING";
// export const SET_USER_RECENT_PLAYS = "SET_USER_RECENT_PLAYS";
export const SET_POPOVER = "SET_POPOVER";
export const REMOVE_SELECTIONS_COLLECTION = "REMOVE_SELECTIONS_COLLECTION";
export const SET_PLAYING = "SET_PLAYING";
export const SET_SETTINGS = "SET_SETTINGS";
export const SET_RADIO_PLAYING = "SET_RADIO_PLAYING";

// eslint-disable-next-line
export default (state = {}, { type, payload }) => {
  switch (type) {
    case SET_AUDIO_PLAYING:
      if (!state.currentFooter) state.currentFooter = {};
      const _setProp = () => {
        if (payload) {
          payload.reset =
            state.audioPlaying?.type !== payload?.type
              ? true
              : state.audioPlaying?.type === payload?.type &&
                state.audioPlaying.index !== payload.index
              ? true
              : payload.playState !== "play"
              ? false
              : !state.settings?.playback?.enableInterfaceControl;

          payload.playState = state.settings?.playback?.enableInterfaceControl
            ? state.audioPlaying?.playState === "paused" &&
              payload.playState === "play"
              ? "playing"
              : payload.playState
            : payload.playState;
        } else {
          delete state.currentFooter[state.currentFooter.active];
          delete state.currentFooter.active;
        }
      };
      if (state.settings?.bgPlay) {
        _setProp();
        if (payload) {
          if (payload.playState === "play") {
            if (
              state.audioPlaying &&
              state.audioPlaying.type !== payload.type
            ) {
              payload =
                state.bgAudioPlaying &&
                state.bgAudioPlaying.type === payload.type &&
                state.bgAudioPlaying.index === payload.index
                  ? state.bgAudioPlaying
                  : payload;
              state.audioPlaying.playState = state.settings?.playback?.autoplay
                ? "play"
                : "paused";
              state.bgAudioPlaying = state.audioPlaying;
            } else {
              console.log("else play", state?.audioPlaying?.type);
            }
          } else if (
            state.settings.bgPlay.prioritizeOnPause &&
            (payload.playState === "paused" || payload.playState === "stoped")
          ) {
            if (
              state.bgAudioPlaying &&
              state.bgAudioPlaying.type !== payload.type
            ) {
              state.audioPlaying = payload;
              payload = state.bgAudioPlaying;
              payload.playState = state.settings?.playback?.autoplay
                ? "play"
                : "paused";
              if (state.audioPlaying.playState === "paused") {
                state.audioPlaying.playState = state.settings?.playback
                  ?.autoplay
                  ? "play"
                  : "paused";
                state.bgAudioPlaying = state.audioPlaying;
              } else {
                state.bgAudioPlaying = null;
              }
            } else {
              console.log("else pause", state?.bgAudioPlaying?.type);
            }
          } else if (payload.playState === "playing") {
          }
          if (state.bgAudioPlaying?.type === payload?.type) {
            console.log(
              "final setting = ",
              payload?.type,
              state?.audioPlaying?.type,
              state?.bgAudioPlaying?.type
            );
            state.bgAudioPlaying = state.audioPlaying;
          }
          state.currentFooter = {
            // ...state.currentFooter,
            active: payload.type,
            [payload.type]: payload.type,
          };
        } else {
          console.log("closing player...");
          state.bgAudioPlaying = null;
        }
      } else {
        console.log("bg play not");
        _setProp();
        state.selections = null;
        state.collection = null;
        state.bgAudioPlaying = null;
        state.currentFooter = {
          // ...state.currentFooter,
          active: payload.type,
          [payload.type]: payload.type,
        };
      }
      !Object.keys(state.currentFooter).length && (state.currentFooter = null);
      return {
        ...state,
        audioPlaying: payload,
      };
    case SIGNIN:
      return {
        ...state,
        user: payload,
      };
    case SET_PLAYING_SONG:
      return {
        ...state,
        playingSong: payload,
      };
    case SET_PLAYLISTS:
      return {
        ...state,
        playlists: payload,
      };
    case SET_PLAYLIST:
      return {
        ...state,
        playlist: payload,
      };
    case SET_ALL_SONGS:
      return {
        ...state,
        songs: payload,
      };
    case SET_ALL_PLAYLISTS:
      return {
        ...state,
        playlists: payload,
      };
    case UPDATE_SONG_AT:
      return {
        ...state,
        songs: state.songs.map((s) =>
          s.id === payload.data.id ? { ...s, ...payload.data } : s
        ),
      };
    case SET_SELECTIONS:
      if (!state.settings?.backgroundPlay) {
        state.playing = false;
        state.songPlaying = null;
        state.currentFooter = {
          [SELECTION_MODE]: SELECTION_MODE,
        };
      }
      if (state.currentFooter) state.currentFooter.active = SELECTION_MODE;
      else
        state.currentFooter = {
          [SELECTION_MODE]: SELECTION_MODE,
          active: SELECTION_MODE,
        };
      if (!state.selections)
        state.selections = {
          selectionList: {},
        };
      if (payload.selectionList) state.selections = payload;
      else
        state.selections.selectionList[payload.selection.index] =
          payload.selection;
      if (payload.collection && !state.selections.collection)
        state.selections.collection = payload.collection;

      return {
        ...state,
      };
    case FILTER_SELECTIONS:
      // review
      payload = payload !== undefined ? payload : state.selections;
      state.songs = state.songs.filter(
        (s) =>
          !payload.some((x) => {
            delete state.selections[x];
            return state.songs[x].id === s.id;
          })
      );
      delete state.currentFooter[SELECTION_MODE];
      state.active = null;
      return {
        ...state,
        currentFooter: state.currentFooter,
      };
    case REMOVE_SELECTIONS:
      if (payload >= 0) delete state.selections.selectionList[payload];
      else {
        state.selections = null;
        delete state.currentFooter.active;
        delete state.currentFooter[SELECTION_MODE];
        Object.keys(state.currentFooter).length === 0 &&
          (state.currentFooter = null);
      }
      return {
        ...state,
      };
    case SET_SONG:
      return {
        ...state,
        song: payload,
      };
    case FIFO_PUSH_HISTORY:
      return {
        ...state,
        history: [{ ...payload }, ...state.history],
      };
    case SET_DIALOG:
      return {
        ...state,
        dialog: {
          ...state.dialog,
          ...payload,
        },
      };
    case FIFO_STACK_ALBUM:
      return {
        ...state,
        albums: [payload, ...state.albums],
      };
    case SET_ALL_ALBUMS:
      return {
        ...state,
        albums: payload,
      };
    case SET_CURRENT_FOOTER:
      if (payload) {
        payload = {
          ...state.currentFooter,
          ...payload,
        };
      }
      return {
        ...state,
        currentFooter: payload,
      };
    case SET_CACHE:
      return {
        ...state,
        cache: {
          ...state.cache,
          ...payload,
        },
      };
    case SET_SELECTIONS_COLLECTION:
      if (!payload) {
        if (state.currentFooter) {
          state.currentFooter.active = null;
          delete state.currentFooter[SELECTION_MODE];
        }
        state.collection = null;
        state.selections = undefined;
      } else {
        if (state.currentFooter) {
          state.currentFooter.active = SELECTION_MODE;
          state.currentFooter[SELECTION_MODE] = SELECTION_MODE;
        }
        // else {
        //   state.currentFooter = {
        //     active: SELECTION_MODE,
        //     [SELECTION_MODE]: SELECTION_MODE,
        //   };
        // }
      }
      return {
        ...state,
        selections: {},
        collection: payload,
      };
    case SET_POPOVER:
      return {
        ...state,
        popover: payload
          ? {
              ...state.popover,
              ...payload,
            }
          : null,
      };
    case REMOVE_SELECTIONS_COLLECTION:
      delete state.currentFooter[SELECTION_MODE];
      state.currentFooter.active = null;
      return {
        ...state,
        collection: null,
        selections: {},
      };
    case SET_PLAYING:
      return {
        ...state,
        playing: payload,
      };
    case SET_SETTINGS:
      // if (payload.backgroundPlay !== undefined) {
      //   state.songPlaying = null;
      //   state.playing = false;
      // }
      return {
        ...state,
        settings: payload,
      };
    default:
      break;
  }
};
