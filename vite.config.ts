/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // App und Server teilen im Dev-Server einen Ursprung (server-auth, design.md D9)
  server: {
    proxy: { '/api': process.env.DRUMSTUFF_API ?? 'http://localhost:8787' },
    // Vites eigene Sperren plus die Daten des Servers (Datenbank, Geheimnis), design.md D9
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/server-data/**'] },
  },
  test: {
    globals: true,
    // Zwei Projekte: die App in jsdom, der Server in Node (server-auth, design.md D2)
    projects: [
      {
        extends: true,
        test: { name: 'app', include: ['src/**/*.test.{ts,tsx}'], environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] },
      },
      { extends: true, test: { name: 'server', include: ['server/**/*.test.ts'], environment: 'node' } },
    ],
  },
});
