import { Client } from "@stomp/stompjs";
import useNotificationStore from "../../store/useNotificationStore";
import { toast } from "react-toastify";

let socket = null;

export const connectSocket = (usersId) => {
    const token = sessionStorage.getItem("token");
    console.log(usersId)
    if (!token) {
        return;
    }

    socket = new Client({
        brokerURL: "ws://localhost/web",
        connectHeaders: {
            Authorization: `Bearer ${token}`
        },
        onConnect: () => {
            console.log("웹소켓 연결 성공")

            socket.subscribe(
                `/sub/notification/${usersId}`,
                (message) => {

                    const noti = JSON.parse(message.body);
                    console.log("알림 수신", noti.content);

                    useNotificationStore
                        .getState()
                        .addNotification(noti);

                    switch (noti.noti_type) {
                        // 프로젝트 알림
                        case "PROJECT":
                            toast(noti.content, {
                                icon: () => "📅"
                            });
                            break;

                        // 결재 요청 알림
                        case "APPROVAL":
                            toast(noti.content, {
                                icon: () => "🔔"
                            });
                            break;
                        
                        // 결재 승인 알림
                        case "APPROVED":
                            toast(noti.content, {
                                icon: () => "✅"
                            });
                            break;

                        // 결재 반려 알림
                        case "REJECTED":
                            toast(noti.content, {
                                icon: () => "❌"
                            });
                            break;

                        // 미팅 참석 알림
                        case "MEETING":
                            toast(noti.content, {
                                icon: () => "📅"
                            });
                            break;

                        default:
                            toast(noti.content);
                    }

                }
            );
        },
        onDisconnect: () => {
            console.log("웹소켓 연결 종료");
        }
    });
    socket.activate();
};

export const disconnectSocket = () => {

    if (socket) {
        socket.deactivate();
    }
};