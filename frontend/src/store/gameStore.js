import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DECK_MAP, ROOM_STATUS } from '../lib/constants';

const initialState = {
  roomInfo: {
    id: null,
    room_code: '',
    status: ROOM_STATUS.VOTING,
    current_task: 'Initial Task',
    mediator_id: null,
    deck_type: 'fibonacci',
  },
  userId: null,
  userName: '',
  isMediator: false,
  mediatorVoting: false,
  participants: {},
  localVote: null,
  votes: [],
  tasks: [],
  groups: [],
  participantGroupMap: {},
  error: null,
};

const persistConfig = {
  name: 'planning-poker-session',
  partialize: (state) => ({
    roomInfo: state.roomInfo,
    userId: state.userId,
    userName: state.userName,
    isMediator: state.isMediator,
    mediatorVoting: state.mediatorVoting,
  }),
};

export const useGameStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      setRoomInfo: (roomInfo) =>
        set((state) => ({
          roomInfo: { ...state.roomInfo, ...roomInfo },
        })),

      setUserId: (userId) => set({ userId }),
      setUserName: (userName) => set({ userName }),

      setIsMediator: (isMediator) => set({ isMediator }),

      setMediatorVoting: (voting) => set({ mediatorVoting: voting }),

      toggleMediatorVoting: () => set((state) => ({ mediatorVoting: !state.mediatorVoting })),

      setParticipants: (participants) => set({ participants }),

      setLocalVote: (vote) => set({ localVote: vote }),

      setVotes: (votes) => set({ votes }),

      setTasks: (tasks) => set({ tasks }),

      setGroups: (groups) => set({ groups }),

      setParticipantGroupMap: (participantGroupMap) => set({ participantGroupMap }),

      setError: (error) => set({ error }),

      setDeckType: (deckType) =>
        set((state) => ({
          roomInfo: { ...state.roomInfo, deck_type: deckType },
        })),

      getDeck: () => DECK_MAP[get().roomInfo.deck_type] || DECK_MAP.fibonacci,

      clearTable: () => set({ votes: [], localVote: null }),

      reset: () => set(initialState),
    }),
    persistConfig,
  ),
);
