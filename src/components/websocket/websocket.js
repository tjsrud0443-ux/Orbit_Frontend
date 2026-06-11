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

                toast.info(noti.content);
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