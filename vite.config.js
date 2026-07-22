import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'SLOPE RIDER',
                short_name: 'SLOPE RIDER',
                description: 'A Quantum Path grid puzzle',
                display: 'standalone',
                orientation: 'portrait',
                theme_color: '#060A13',
                background_color: '#060A13',
                icons: [
                    { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
                    { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
                ],
            },
        }),
    ],
});
