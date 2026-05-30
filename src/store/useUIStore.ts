import { create } from "zustand";
import { persist } from "zustand/middleware";

type ModalName = "resetDemoData" | "eSignature" | "sourceImport" | "exportMenu";

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
}

interface UIStore {
  isNovaChatOpen: boolean;
  activeCitationId?: string;
  isCitationPanelOpen: boolean;
  isExportMenuOpen: boolean;
  modals: Partial<Record<ModalName, boolean>>;
  toastMessages: ToastMessage[];
  openNovaChat: () => void;
  closeNovaChat: () => void;
  openCitationPanel: (citationId: string) => void;
  closeCitationPanel: () => void;
  setExportMenuOpen: (isOpen: boolean) => void;
  openModal: (modalName: ModalName) => void;
  closeModal: (modalName: ModalName) => void;
  pushToastMessage: (message: Omit<ToastMessage, "id"> & { id?: string }) => void;
  clearToastMessages: () => void;
  resetUI: () => void;
}

const initialUIState = {
  isNovaChatOpen: false,
  activeCitationId: undefined,
  isCitationPanelOpen: false,
  isExportMenuOpen: false,
  modals: {},
  toastMessages: [],
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialUIState,
      openNovaChat: () => set({ isNovaChatOpen: true }),
      closeNovaChat: () => set({ isNovaChatOpen: false }),
      openCitationPanel: (citationId) =>
        set({
          activeCitationId: citationId,
          isCitationPanelOpen: true,
        }),
      closeCitationPanel: () =>
        set({
          activeCitationId: undefined,
          isCitationPanelOpen: false,
        }),
      setExportMenuOpen: (isExportMenuOpen) => set({ isExportMenuOpen }),
      openModal: (modalName) =>
        set((state) => ({
          modals: {
            ...state.modals,
            [modalName]: true,
          },
        })),
      closeModal: (modalName) =>
        set((state) => ({
          modals: {
            ...state.modals,
            [modalName]: false,
          },
        })),
      pushToastMessage: (message) =>
        set((state) => ({
          toastMessages: [
            ...state.toastMessages,
            {
              ...message,
              id: message.id ?? `TOAST-${Date.now()}`,
            },
          ],
        })),
      clearToastMessages: () => set({ toastMessages: [] }),
      resetUI: () => set(initialUIState),
    }),
    {
      name: "ai-coach-nova-ui",
      partialize: (state) => ({
        isNovaChatOpen: state.isNovaChatOpen,
        activeCitationId: state.activeCitationId,
        isCitationPanelOpen: state.isCitationPanelOpen,
        isExportMenuOpen: state.isExportMenuOpen,
        modals: state.modals,
      }),
    },
  ),
);

