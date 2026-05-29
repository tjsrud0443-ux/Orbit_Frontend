import { Navigate, Outlet } from "react-router-dom";
import useUserStore from "../../store/userStore";

function ProtectedRoute({ allow }) {
    const user = useUserStore(state => state.user);

    if (user == null) { 
        return <div>로딩 중....</div>; 
    }

    const group = user.auth_group;
    const rank = user.rank_name;
    const role = user.role;

    const isAdmin = role === "ADMIN" || group === "ROLE_SUPER_ADMIN";
    if (isAdmin) {
        return <Outlet />;
    }

    const result = allow.some(item => {
        if (item.type === "group") {
            return item.value === group;
        }

        if (item.type === "rank") {
            return item.value === rank;
        }

        return false;
    });

    return result
        ? <Outlet /> : <Navigate to="/main" replace />;
}

export default ProtectedRoute;