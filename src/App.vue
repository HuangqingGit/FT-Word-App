<template>
	<el-container style="height: 100%">
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

<script>
import "element-plus/dist/index.css"
import { Command } from "@tauri-apps/plugin-shell"
export default {
	name: "App",
	data() {
		return {
			text: {},
			params: {
				template_path: "C:/Users/F-tone/Desktop/新建文件夹/ces.docx",
				data: {
					name: "ft",
					age: 18,
					num: 100,
					img: "C:/Users/F-tone/Pictures/61d7678dgy1hvt194v9kqj20p00uuape.jpg",
				},
			},
		}
	},
	mounted() {},
	methods: {
		// 调用后台Rust服务运行Python
		run_py() {
			this.$invoke("run_python", { params: this.params })
				.then((result) => {
					console.log(result)
				})
				.catch((error) => {
					console.error(error)
				})
		},
		async run_shell() {
			try {
				const command = Command.sidecar("bin/email", [JSON.stringify(this.params.data), this.params.template_path])
				const output = await command.execute()
				this.text = output
			} catch (err) {
				console.error("❌ Sidecar spawn failed:", err)
			}
		},
	},
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
