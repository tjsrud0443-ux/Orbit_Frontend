import { useEffect } from "react";
import { connectSocket, disconnectSocket } from "./websocket";
import useUserStore from "../../store/userStore";


export default function NotificationProvider({ children }) {

    const user = useUserStore(state => state.user);

    useEffect(() => {
        if (!user?.id) return;
        connectSocket(user.id);

        return () => {
            disconnectSocket();
        };

    }, [user?.id]);

    return children;
}