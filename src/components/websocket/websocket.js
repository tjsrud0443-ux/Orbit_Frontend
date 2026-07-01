import { Client } from "@stomp/stompjs";
import useNotificationStore from "../../store/useNotificationStore";
import { toast } from "react-toastify";

let socket = null;

export const connectSocket = (usersId) => {
    const token = sessionStorage.getItem("token");

    if (!token) {
        return;
    }

    socket = new Client({
        brokerURL: "wss://api.sukong.shop/web",
        connectHeaders: {
            Authorization: `Bearer ${token}`
        },
        onConnect: () => {

            socket.subscribe(
                `/sub/notification/${usersId}`,
                (message) => {

                    const noti = JSON.parse(message.body);

                    if(noti.eventType === "DELETE") {
                        useNotificationStore
                            .getState()
                            .removeNotification(noti.noti_seq);

                        return;
                    }

                    useNotificationStore
                        .getState()
                        .addNotification(noti);

                    const showToast = (content, icon) => {
                        const isMobile = window.matchMedia("(max-width:768px)").matches;
                        
                        if(isMobile){
                            toast.dismiss();
                        }

                        toast(content, {
                            icon: () => icon
                        });
                    }

                    switch (noti.noti_type) {
                        // 프로젝트 알림
                        case "PROJECT":
                            showToast(noti.content, "📅");
                            break;

                        // 결재 요청 알림
                        case "APPROVAL":
                            showToast(noti.content, "🔔");
                            break;
                        
                        // 결재 승인 알림
                        case "APPROVED":
                            showToast(noti.content, "✅");
                            break;

                        // 결재 반려 알림
                        case "REJECTED":
                            showToast(noti.content, "❌");
                            break;

                        // 미팅 참석 알림
                        case "MEETING":
                            showToast(noti.content, "📅");
                            break;
                        
                        // 칸반 담당자 지정 알림
                        case "TASK":
                            showToast(noti.content, "📌");
                            break;
                            
                        default:
                            showToast(noti.content);
                    }

                }
            );
        },
        onDisconnect: () => {}
    });
    socket.activate();
};

export const disconnectSocket = () => {

    if (socket) {
        socket.deactivate();
    }
};