<template>
	<div id="titlebar" class="titlebar">
		<div class="titlebar-title">
			<img class="logo-img" src="../assets/logo.svg" />
		</div>
		<div class="titlebar-controls">
			<button @click="ftWin.minimize" class="titlebar-button min">
				<svg width="1em" height="1em" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M5 24 L43 24" stroke="currentColor" stroke-width="3" stroke-linecap="butt" stroke-linejoin="miter" />
				</svg>
			</button>
			<button @click="ftWin.toggleMaximize" class="titlebar-button max">
				<svg v-if="!isMaximized" width="1em" height="1em" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M33 6 H42 V15" stroke="currentColor" stroke-width="3" stroke-linecap="butt" stroke-linejoin="miter" />
					<path d="M42 33 V42 H33" stroke="currentColor" stroke-width="3" stroke-linecap="butt" stroke-linejoin="miter" />
					<path d="M15 42 H6 V33" stroke="currentColor" stroke-width="3" stroke-linecap="butt" stroke-linejoin="miter" />
					<path d="M6 15 V6 H15" stroke="currentColor" stroke-width="3" stroke-linecap="butt" stroke-linejoin="miter" />
				</svg>
				<svg v-if="isMaximized" width="1em" height="1em" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M13 12.4316V7.8125C13 6.2592 14.2592 5 15.8125 5H40.1875C41.7408 5 43 6.2592 43 7.8125V32.1875C43 33.7408 41.7408 35 40.1875 35H35.5163"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="butt"
						stroke-linejoin="miter"
					/>
					<path
						d="M32.1875 13H7.8125C6.2592 13 5 14.2592 5 15.8125V40.1875C5 41.7408 6.2592 43 7.8125 43H32.1875C33.7408 43 35 41.7408 35 40.1875V15.8125C35 14.2592 33.7408 13 32.1875 13Z"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linejoin="miter"
					/>
				</svg>
			</button>
			<button @click="ftWin.close" class="titlebar-button close">
				<svg width="1em" height="1em" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M8 8 L40 40" stroke="currentColor" stroke-width="3" stroke-linecap="butt" stroke-linejoin="miter" />
					<path d="M8 40 L40 8" stroke="currentColor" stroke-width="3" stroke-linecap="butt" stroke-linejoin="miter" />
				</svg>
			</button>
		</div>
	</div>
</template>

<script>
import { getCurrentWindow, Window } from "@tauri-apps/api/window"
const appWindow = new Window("main")
export default {
	name: "ft-title",
	data() {
		return {
			ftWin: appWindow,
			isMaximized: false,
		}
	},
	methods: {},
	mounted() {
		getCurrentWindow().listen("tauri://resize", ({ event, payload }) => {
			setTimeout(async () => {
				this.isMaximized = await this.ftWin.isMaximized()
			}, 100)
		})
	},
}
</script>

<style lang="less">
/* 自定义标题栏样式 */
.titlebar {
	height: 100%;
	background: #ffffff;
	display: flex;
	align-items: center;
	justify-content: space-between;
	user-select: none;

	.titlebar-title {
		font-size: 12px;
		width: 100%;
		height: 100%;
		-webkit-app-region: drag;
		display: flex;
		align-items: center;
		.logo-img {
			height: 20px;
			margin: 0 10px;
		}
	}

	.titlebar-controls {
		display: flex;
		height: 100%;

		.titlebar-button {
			width: 40px;
			height: 100%;
			border: none;
			background: transparent;
			color: #1e1e1e;
			font-size: 13px;
			display: flex;
			justify-content: center;
			align-items: center;
			cursor: pointer;
		}

		.titlebar-button:hover {
			background: #f0f0f0;
		}

		.close:hover {
			background: #e81123;
			color: #ffffff;
		}
	}
}
</style>
