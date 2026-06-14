import { useEffect } from "react";
import { connectSocket, disconnectSocket } from "./websocket";
import useUserStore from "../../store/userStore";


export default function NotificationProvider({ children }) {

    const user = useUserStore(state => state.user);

    useEffect(() => {
        console.log("NotificationProvider 실행");
        if (!user?.id) return;
        console.log("구독 시도", user.id);
        connectSocket(user.id);

        return () => {
            disconnectSocket();
        };

    }, [user?.id]);

    return children;
}