import { create } from "zustand";

const useNotificationStore = create((set) => ({

    notifications: [],

    // notifications DB 데이터 set
    setNotifications: (notifications) =>
        set({
            notifications
        }),

    // websocket 데이터 set
    addNotification: (noti) =>
        set((state) => ({
            notifications: [noti, ...state.notifications]
        })),

    // 알림 읽음 처리
    readNoti: (notiSeq) =>
        set((state) => ({
            notifications:
                state.notifications.filter(
                    noti => noti.noti_seq !== notiSeq
                )
        })),

    // notifications 데이터 비우기
    clearNotifications: () =>
        set({
            notifications: []
        })
}));

export default useNotificationStore;