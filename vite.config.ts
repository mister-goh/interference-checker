import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 빌드 산출물 2종:
//  - `vite build`                : dist/         — 정적 서버 호스팅용 (인트라넷/온라인)
//  - `vite build --mode offline` : dist-offline/ — JS/CSS 전부 인라인한 단일 index.html
//    (file:// 더블클릭 실행용 — 모듈 스크립트 CORS 제약 회피)
export default defineConfig(({ mode }) => ({
  plugins: mode === 'offline' ? [react(), viteSingleFile()] : [react()],
  base: './',
  build: mode === 'offline' ? { outDir: 'dist-offline' } : {},
  server: {
    host: true,        // WSL/Windows 브라우저·포트포워딩에서도 접근
    port: 5173,
    strictPort: true,  // 항상 5173 → Simple Browser 주소 고정 (밀리면 에러로 알려줌)
    watch: {
      usePolling: true, // WSL2 + /mnt/c(Windows FS)에서 inotify 미동작 → 폴링으로 변경 감지
      interval: 100,    // 100ms 폴링 (CPU 여유 없으면 300으로 상향)
    },
  },
  test: {
    environment: 'node',
  },
}))
