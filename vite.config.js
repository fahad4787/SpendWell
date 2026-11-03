import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    // Keep spreadsheet code out of the HTML preload list.
    modulePreload: {
      resolveDependencies: (_filename, deps, { hostType }) => {
        if (hostType !== "html") return deps;
        return deps.filter((dep) => !dep.includes("xlsx-vendor"));
      },
    },
    rollupOptions: {
      output: {
        // Only isolate packages that stay off the login shell.
        // Do not split recharts/react/antd — that creates circular helper chunks
        // which pull charts into the entry and can blank the login page.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("firebase") || id.includes("@firebase")) return "firebase-vendor";
          if (id.includes("/xlsx/")) return "xlsx-vendor";
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    historyApiFallback: true,
  },
})
