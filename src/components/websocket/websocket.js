import { Client } from "@stomp/stompjs";
import useNotificationStore from "../../store/useNotificationStore";

let socket = null;

export const connectSocket = (usersId) => {
    const addNotification = useNotificationStore(state => state.addNotification);
    const token = sessionStorage.getItem("token");

    if (!token || !usersId) {
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
                    console.log("알림 수신", noti);

                    addNotification(noti);
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