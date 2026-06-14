import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

    const setIconColor = (color, borderOpacity = 1) => () => {
        const icon = document.querySelector('.swal2-icon');
        if (icon) {
            icon.style.borderColor = `${color}${Math.round(borderOpacity * 255).toString(16).padStart(2, '0')}`;
            icon.style.color = color;
        }
    };

    const baseStyle = {
        width: '360px',
        customClass: {
            popup: 'swal-custom-popup',
            icon: 'swal-custom-icon',
            title: 'swal-custom-title',
            htmlContainer: 'swal-custom-text',
            confirmButton: 'swal-custom-confirm',
        }
    };

export const alertWarning = (title, text) =>
  Swal.fire({
    ...baseStyle,
    icon: 'warning',
    title, html: text,
    confirmButtonColor: '#b0b0b4',
    didOpen: setIconColor('#ffb941', 0.5),
  });

export const alertSuccess = (title, text) =>
  Swal.fire({
    ...baseStyle,
    icon: 'success',
    title, html: text,
    confirmButtonColor: '#b0b0b4',
    didOpen: setIconColor('#10B981'),   // 초록색
  });

export const alertError = (title, text) =>
  Swal.fire({
    ...baseStyle,
    icon: 'error',
    title, html: text,
    confirmButtonColor: '#b0b0b4',
    didOpen: setIconColor('#FF4D4F', 0.5),   // 빨간색
  });

export const alertConfirm = (title, text) =>
  Swal.fire({
    ...baseStyle,
    icon: 'question',
    title, html: text,
    confirmButtonColor: '#b0b0b4',
    cancelButtonColor: '#ffffff',
    showCancelButton: true,
    confirmButtonText: '확인',
    cancelButtonText: '취소',
    didOpen: setIconColor('#8aafff', 0.5),   // 브랜드 컬러
    customClass: {
      ...baseStyle.customClass,
      cancelButton: 'swal-custom-cancel',  // ← 추가
    }
  });