import { MUSIC_PLAYER, SELECTION_MODE } from "../config";
export const SET_AUDIO_PLAYING = "SET_AUDIO_PLAYIING";
export const SET_DIALOG = "SET_DIALOG";
export const SET_POPOVER = "SET_POPOVER";
export const SET_SELECTIONS = "SET_SELECTIONS";
export const REMOVE_SELECTIONS = "REMOVE_SELECTIONS";
export const SET_CURRENT_FOOTER = "SET_CURRENT_FOOTER";
// eslint-disable-next-line
export default (state = {}, { type, payload }) => {
  switch (type) {
    case SET_AUDIO_PLAYING:
      if (state.audioPlaying && payload.queue) {
        state.audioPlaying.queue = payload.queue.length
          ? payload.queue
          : undefined;
        return {
          ...state,
        };
      }
      if (!state.currentFooter) state.currentFooter = {};
      const _setProp = () => {
        payload.type = payload.type || MUSIC_PLAYER;
        payload.index = payload.index || 0;
        if (state.bgAudioPlaying || payload.playState !== "stoped") {
          if (state.audioPlaying) {
            payload.reset =
              state.audioPlaying.type !== payload.type ||
              (payload.collectionId &&
                state.audioPlaying.collectionId !== payload.collectionId)
                ? true
                : state.audioPlaying.type === payload?.type &&
                  state.audioPlaying.index !== payload.index
                ? true
                : payload.playState !== "play"
                ? false
                : !state.settings?.playback?.enableInterfaceControl;
          } else {
            payload.reset = !state.settings?.playback?.enableInterfaceControl;
          }

          payload.playState = state.settings?.playback?.enableInterfaceControl
            ? state.audioPlaying?.playState === "paused" &&
              payload.playState === "play"
              ? "playing"
              : payload.playState
            : payload.playState;
        } else {
          console.log("no reset");
        }
      };
      const resetPayload = () => {
        if (state.settings?.playback.closePlayer || !payload) {
          payload = null;
          delete state.currentFooter[state.currentFooter.active];
          delete state.currentFooter.active;
        } else {
          payload && (payload.currentTime = 0);
        }
        !Object.keys(state.currentFooter).length &&
          (state.currentFooter = null);
      };
      if (!payload) {
        if (state.bgAudioPlaying) {
          payload = state.audioPlaying;
          payload.playState = "stoped";
        } else {
          resetPayload();
          return {
            ...state,
            audioPlaying: null,
          };
        }
      }
      if (state.settings?.bgPlay) {
        // if (payload.playState === "paused") {
        //   state.audioPlaying =
        //   payload = state.audioPlaying;
        //   payload.playState = "paused";
        // }
        _setProp();
        if (payload.playState === "play") {
          if (
            state.audioPlaying.type &&
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
          }
        } else if (
          state.settings.bgPlay.prioritizeOnPause &&
          state.bgAudioPlaying &&
          (payload.playState === "paused" || payload.playState === "stoped")
        ) {
          if (state.bgAudioPlaying.type !== payload.type) {
            state.audioPlaying = payload;
            payload = state.bgAudioPlaying;
            payload.playState = state.settings?.playback?.autoplay
              ? "play"
              : "paused";
            if (state.audioPlaying.playState === "paused") {
              state.audioPlaying.playState = state.settings?.playback?.autoplay
                ? "play"
                : "paused";
              state.bgAudioPlaying = state.audioPlaying;
            } else state.bgAudioPlaying = null;
          }
        } else {
          state.activeAudioId = payload.activeAudioId;
          state.activeAudioIdCollectionId = payload.collectionId;
        }
        if (payload.playState === "stoped" && !state.bgAudioPlaying)
          resetPayload();
        else {
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
        }
      } else {
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
      console.log(payload, state.currentFooter);
      return {
        ...state,
        audioPlaying: payload,
      };
    case SET_DIALOG:
      return {
        ...state,
        dialog: {
          ...state.dialog,
          ...payload,
        },
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
    case SET_SELECTIONS:
      if (payload.selection) {
        if (!state.settings?.bgPlay) {
          console.log("in reducer.......................................");
          state.playing = false;
          state.songPlaying = null;
          state.currentFooter = {};
        }
      } else {
        payload.selection = {};
      }

      if (payload.queryMap) {
        state.queryMap = {
          ...state.queryMap,
          ...payload.queryMap,
        };
        if (payload.queryMap.song) {
          if (!state.queryMap.songs)
            state.queryMap.songs = [payload.queryMap.song];
          else state.queryMap.songs.push(payload.queryMap.song);
          delete state.queryMap.song;
        }
        if (payload.queryMap.action && !payload.selection) {
          state.selectionList = {};
          state.selectionLen = 0;
          delete state.currentFooter[SELECTION_MODE];
          delete state.currentFooter.active;
          if (!Object.keys(state.currentFooter).length)
            state.currentFooter = undefined;
        }
        payload.queryMap.action && (state.hasQueryMapAction = true);
      }
      if (!state.selectionList) state.selectionList = {};
      payload.selection.id &&
        (state.selectionList[payload.selection.id] = payload.selection);
      state.selectionLen = Object.keys(state.selectionList).length;
      state.keyword = payload.keyword;
      if (state.keyword) {
        if (state.currentFooter) {
          state.currentFooter.active = SELECTION_MODE;
          state.currentFooter[SELECTION_MODE] = SELECTION_MODE;
        } else
          state.currentFooter = {
            [SELECTION_MODE]: SELECTION_MODE,
            active: SELECTION_MODE,
          };
      }

      return {
        ...state,
        ...payload,
      };
    case REMOVE_SELECTIONS:
      if (!payload || payload === -1) {
        if (!payload) {
          state.queryMap = undefined;
          state.hasQueryMapAction = undefined;
        }
        state.selectionLen = undefined;
        state.selectionList = undefined;
        if (state.currentFooter) {
          delete state.currentFooter[SELECTION_MODE];
          delete state.currentFooter.active;
        }
      } else {
        if (state.queryMap?.songs)
          state.queryMap.songs.splice(state.selectionList[payload], 1);
        delete state.selectionList[payload];
        state.selectionLen = Object.keys(state.selectionList).length;
      }

      state.currentFooter &&
        Object.keys(state.currentFooter).length === 0 &&
        (state.currentFooter = null);
      return {
        ...state,
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

    default: // set_query
      return {
        ...state,
        query: payload,
      };
  }
};
