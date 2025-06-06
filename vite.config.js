import path from 'path'
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// Tauri 开发环境配置
// 读取环境变量中的 TAURI_DEV_HOST
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
    // 解析别名配置
    // 允许在代码中使用 '@' 来引用 'src' 目录
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src') // 关键配置
        }
    },

    //为Tauri开发量身定制的Vite选项，仅适用于“Tauri开发”或“Tauri构建”`
    // 1.防止vite掩盖生锈错误
    clearScreen: false,
    // 2.tauri需要一个固定端口，如果该端口不可用，则失败
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                protocol: "ws",
                host,
                port: 1421,
            }
            : undefined,
        watch: {
            // 3.告诉vite不要看src tauri`
            ignored: ["**/src-tauri/**"],
        },
    },

    // Vue 插件配置项
    plugins: [
        vue(),
        // 自动导入 Element Plus 组件和相关 API
        AutoImport({
            // 自动导入 Vue 相关函数和API，如 ref、reactive、computed 等
            imports: ['vue'],
            // 自动导入 Element Plus 相关函数，如 ElMessage、ElNotification 等
            resolvers: [ElementPlusResolver()],
        }),
        Components({
            resolvers: [
                // 自动导入 Element Plus 组件
                ElementPlusResolver(),
                // 自动导入 Icon 组件
                IconsResolver({
                    enabledCollections: ['ep'],
                    prefix: 'ft'
                }),
            ],
            dirs: [
                'src/components', // 默认会扫描的目录
                'src/views',      // 添加 views 目录
            ]
        }),

        // 图标插件配置
        Icons({
            autoInstall: true, // 自动安装图标
        }),
    ],


}));
