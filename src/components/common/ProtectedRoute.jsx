import { Navigate, Outlet } from "react-router-dom";
import useUserStore from "../../store/userStore";

function ProtectedRoute({ allow }) {
    const user = useUserStore(state => state.user);

    if (user == null) { 
        return <div>로딩 중....</div>; 
    }

    const dept_name = user.dept_name;
    const rank_name = user.rank_name;
    const role = user.role;

    const isAdmin = role === "ADMIN" || dept_name === "운영총괄본부" ||
        dept_name === "운영총괄팀";

    if (isAdmin) {
        return <Outlet />;
    }

    const result = allow.some(item => {
        if (item.type === "dept") {
            return item.value === dept_name;
        }

        if (item.type === "rank") {
            return item.value === rank_name;
        }

        return false;
    });

    return result
        ? <Outlet /> : <Navigate to="/main" replace />;
}

export default ProtectedRoute;