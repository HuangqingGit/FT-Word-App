<template>
	<el-container style="height: 100%">
		<el-header><ft-title /></el-header>
		<el-container class="main-container">
			<!-- 目录Menu-Start -->
			<el-aside width="200px">
				<ft-menu />
			</el-aside>
			<el-main>
				<el-button @click="run_py">Python</el-button>
			</el-main>
		</el-container>
	</el-container>
</template>

<script>
import "element-plus/dist/index.css"
import ftMenu from "./components/ft-menu.vue"
export default {
	components: { ftMenu },
	name: "App",
	data() {
		return {
			params: {
				template_path: "C:/Users/Github/Desktop/cs.docx",
				data: {
					name: "ft",
					age: 18,
					num: 100,
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
					console.log(JSON.parse(result))
				})
				.catch((error) => {
					console.error(error)
				})
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
			background-color: #ffffff;
			border-radius: 5px;
		}
	}
}
</style>
