// // vite.config.js
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   root: "src",
//   base: "./",
  
//   build: {
//     outDir: "../dist",
//     emptyOutDir: true,
    
//   },
//   plugins: [react()],
//   css: {
//     postcss: "./postcss.config.js", // 指定 PostCSS 配置
//     includePaths: ['./node_modules']
//   },
// });

// vite.config.js
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import path from "path";

// export default defineConfig({
//   root: "src",
//   base: "./",
//   build: {
//     outDir: "../dist",
//     emptyOutDir: true,
//   },
//   plugins: [react()],
//   css: {
//     postcss: "./postcss.config.js", // 指定 PostCSS 配置
//     includePaths: ["./node_modules"],
//   },
//   resolve: {
//     alias: {
//       // 為 @livekit/components-react 提供別名，解決路徑問題
//       "@livekit/components-react": path.resolve(
//         __dirname,
//         "node_modules/@livekit/components-react"
//       ),
//     },
//   },
// });


// vite.config.js
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import path from "path";

// export default defineConfig({
//   root: "src",
//   base: "./",
//   build: {
//     outDir: "../dist",
//     emptyOutDir: true,
//   },
//   plugins: [react()],
//   css: {
//     postcss: "./postcss.config.js", // 指定 PostCSS 配置
//     includePaths: ["./node_modules"],
//   },
//   resolve: {
//     alias: {
//       // 为 @livekit/components-react 提供别名，确保所有引用都指向 node_modules 中的版本
//       "@livekit/components-react": path.resolve(
//         __dirname,
//         "node_modules/@livekit/components-react"
//       ),
//     },
//   },
// });
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: "src",
  base: "./",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  plugins: [react()],
  css: {
    postcss: "./postcss.config.js", // 指定 PostCSS 配置
    includePaths: ["./node_modules"],
  },
  resolve: {
    alias: {
      // 设置别名，确保引用的是模块的源代码部分
      "@livekit/components-react": path.resolve(
        __dirname,
        "node_modules/@livekit/components-react/dist"
      ),
      "@livekit/components-core": path.resolve(
        __dirname,
        "node_modules/@livekit/components-core/dist"
      ),
    },
  },
});
