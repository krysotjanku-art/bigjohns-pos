import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Android 7.1 POS tablets use a Chrome 56-era WebView. Keep a modern
    // desktop bundle and emit a SystemJS/polyfilled fallback for the tablet.
    legacy({
      targets: ['Chrome >= 56', 'ChromeAndroid >= 56', 'Android >= 7'],
      polyfills: [
        'es.array.flat-map',
        'es.array.iterator',
        'es.object.from-entries',
        'es.promise',
        'es.promise.finally',
        'es.string.pad-start',
      ],
    }),
  ],
  build: {
    // JavaScript browser targeting is owned by plugin-legacy above; Vite 8
    // deliberately overrides build.target when it emits the paired bundles.
    cssTarget: 'chrome56',
  },
})
