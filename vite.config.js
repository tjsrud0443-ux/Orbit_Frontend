import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/*브라우저에서 공공API를 직접 호출하면
 CORS 오류남. Vite 개발서버의 프록시를 설정해서 
 우회해야 함. 우회 코드  */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/holiday-api': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/holiday-api/, ''),
      },
    },
  },
})
