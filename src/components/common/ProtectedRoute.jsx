import { Navigate, Outlet } from "react-router-dom";
import useUserStore from "../../store/userStore";

function ProtectedRoute({ allow }) {
    const user = useUserStore(state => state.user);

    if (user == null) {
        return <div>로딩 중....</div>;
    }

    const group = user.auth_group;
    const userAuthGroups = user.user_auth_group ?? [];

    const isAdmin = group === "ROLE_SUPER_ADMIN" || userAuthGroups.includes("ROLE_SUPER_ADMIN");
    if (isAdmin) {
        return <Outlet />;
    }

    const result = allow.some(item => {
        if (item.type !== "group") {
            return false;
        }

        return (
            item.value === group || userAuthGroups.includes(item.value)
        );
    });

    return result
        ? <Outlet /> : <Navigate to="/main" replace />;
}

export default ProtectedRoute;