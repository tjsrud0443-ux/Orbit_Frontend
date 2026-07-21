import axios from 'axios';
import Swal from 'sweetalert2';
import useLoadingStore from '../store/useLoadingStore';

export const maxios = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
});

let isHandlingSessionExpired = false;

maxios.interceptors.request.use(
    config => {
        const token = sessionStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    error => Promise.reject(error)
);

maxios.interceptors.response.use(
    response => response,

    async error => {
        const status = error.response?.status;
        const requestUrl = error.config?.url;

        if (
            status === 401 &&
            requestUrl !== '/auth/login' &&
            !isHandlingSessionExpired
        ) {
            isHandlingSessionExpired = true;

            useLoadingStore.getState().hideLoading();
            sessionStorage.removeItem('token');

            await Swal.fire({
                icon: 'warning',
                title: '세션 만료',
                html: '로그인 세션이 만료되었습니다.<br>다시 로그인해주세요.',
                confirmButtonText: '확인',
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            window.location.replace('/');

            return Promise.reject(error);
        }

        if (
            status === 403 &&
            requestUrl !== '/auth/login'
        ) {
            await Swal.fire({
                icon: 'warning',
                title: '접근 권한 없음',
                text: '해당 페이지에 접근할 수 있는 권한이 없습니다.',
                confirmButtonText: '확인'
            });

            window.location.replace('/main');
        }

        return Promise.reject(error);
    }
);