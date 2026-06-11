import { useEffect } from "react";
import { connectSocket, disconnectSocket } from "./websocket";
import useUserStore from "../../store/useUserStore";

export default function NotificationProvider({ children }) {

    const user = useUserStore((state) => state.user);

    useEffect(() => {

        if (!user?.users_id) return;

        connectSocket(user.users_id);

        return () => {
            disconnectSocket();
        };

    }, [user]);

    return children;
}