<template>
	<el-container style="height: 100%" @dragenter="menuDragEvent" @dragover="menuDragEvent" @dragleave="menuDragEvent" @drop="menuDragEvent">
		<el-header><ft-title /></el-header>
		<el-container class="main-container">
			<!-- 目录Menu-Start -->
			<el-aside width="200px">
				<ft-menu />
			</el-aside>
			<el-main>
				<ft-content />
			</el-main>
		</el-container>
	</el-container>
</template>

<script setup>
import { ref } from "vue"
import "element-plus/dist/index.css"
import { Command } from "@tauri-apps/plugin-shell"

// 响应式数据
const text = ref({})
const params = ref({
	template_path: "C:/Users/F-tone/Desktop/新建文件夹/ces.docx",
	data: {
		name: "ft",
		age: 18,
		num: 100,
		img: "C:/Users/F-tone/Pictures/61d7678dgy1hvt194v9kqj20p00uuape.jpg",
	},
})

// 调用后台Rust服务运行Python
function run_py() {
	// 注意：setup中没有this，直接用params.value
	// 这里假设有全局$invoke方法，否则需要引入
	window
		.$invoke("run_python", { params: params.value })
		.then((result) => {
			console.log(result)
		})
		.catch((error) => {
			console.error(error)
		})
}
// 调用后台Rust服务运行Shell命令
// 注意：这里使用了@tauri-apps/plugin-shell插件来执行命令
async function run_shell() {
	try {
		const command = Command.sidecar("bin/email", [JSON.stringify(params.value.data), params.value.template_path])
		const output = await command.execute()
		text.value = output
	} catch (err) {
		console.error("❌ Sidecar spawn failed:", err)
	}
}
// 监听拖拽事件，阻止默认行为
// 这样可以防止拖拽文件到页面时触发浏览器默认行为
function menuDragEvent(e) {
	e.preventDefault() // 阻止默认事件
	e.stopPropagation() // 阻止冒泡事件
}
</script>

<style lang="less">
body {
	overflow: hidden;
	.el-message__content {
		user-select: none;
	}
}

* {
	margin: 0;
	padding: 0;
	font-family: Inter, "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}

// App样式
#app {
	height: 100vh;
	background-color: #f2f6fc;

	.el-header {
		padding: 0 0;
		margin: 0 0;
		height: 40px;
	}

	.main-container {
		height: calc(100% - 40px);

		.el-aside {
			margin-top: 4px;
			margin-right: 2px;
			background-color: #ffffff;
			border-radius: 5px;
			display: flex;
			flex-direction: column;
			user-select: none;
		}

		.el-main {
			margin-top: 4px;
			margin-left: 2px;
			padding: 0;
		}
	}

	/* 优化后的 textarea 滚动条样式 */
	::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	::-webkit-scrollbar-thumb {
		width: 6px;
		background-color: transparent;
		border-radius: 3px;
		transition: all 0.2s ease-in-out;
		cursor: pointer;
		border-right: 2px solid transparent;
	}

	:hover::-webkit-scrollbar-thumb {
		background-color: #0002;
	}

	::-webkit-scrollbar-thumb:hover {
		background-color: #0003; /* 悬停时显示 */
	}

	::-webkit-scrollbar-track {
		background: transparent;
		border-radius: 3px;
		margin: 10px;
	}

	::-webkit-scrollbar-button {
		width: 0;
		height: 0;
		display: none;
	}
}
</style>
