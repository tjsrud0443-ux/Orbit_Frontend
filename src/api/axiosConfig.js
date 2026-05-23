import axios from 'axios';

export const maxios = axios.create({
    baseURL: "http://localhost"
});

maxios.interceptors.request.use(config => {
    const token = sessionStorage.getItem("token")
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});