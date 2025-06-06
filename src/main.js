import { createApp } from "vue";
import { invoke } from "@tauri-apps/api/core";
import App from "./App.vue";


const app = createApp(App);

app.config.globalProperties.$invoke = invoke;

app.mount("#app");
