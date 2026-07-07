import axios from 'axios';

export const maxios = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
});

maxios.interceptors.request.use(config => {
    const token = sessionStorage.getItem("token")
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

maxios.interceptors.response.use((resp) => {
    return resp;
},
    error => {
        if (error.response) {
            if (error.response.status === 403 && error.config.url !== '/auth/login') {
                alert("해당 페이지에 접근할 수 있는 권한이 없습니다.")
                window.location.href = "/main";
            }
        }
        return Promise.reject(error);
    }
)