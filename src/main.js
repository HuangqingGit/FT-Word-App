import { createApp } from "vue";
import { invoke } from "@tauri-apps/api/core";
import {
    mkdir,
    exists,
    remove,
    rename,
    readDir,
    readFile,
    writeFile,
    writeTextFile,
    BaseDirectory
} from '@tauri-apps/plugin-fs';
import App from "./App.vue";


const app = createApp(App);

app.config.globalProperties.$invoke = invoke;
app.config.globalProperties.$mkdir = mkdir;
app.config.globalProperties.$exists = exists;
app.config.globalProperties.$remove = remove;
app.config.globalProperties.$rename = rename;
app.config.globalProperties.$readDir = readDir;
app.config.globalProperties.$readFile = readFile;
app.config.globalProperties.$writeFile = writeFile;
app.config.globalProperties.$writeTextFile = writeTextFile;
app.config.globalProperties.$BaseDirectory = BaseDirectory;


app.mount("#app");

// 禁用右键
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});