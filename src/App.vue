<template>
	<el-container style="height: 100%">
		<el-header><ft-title /></el-header>
		<el-container class="main-container">
			<el-aside width="200px">Aside</el-aside>
			<el-main>
				<el-button @click="run_py">运行Python</el-button>
			</el-main>
		</el-container>
	</el-container>
</template>

<script>
export default {
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
* {
	margin: 0;
	padding: 0;
}
#app {
	height: 100vh;
	background-color: #f2f6fc;
	.el-header {
		padding: 0 0;
		margin: 0 0;
		height: 40px;
	}

	.main-container {
		.el-aside {
			margin-top: 4px;
			margin-right: 2px;
			background-color: #ffffff;
			border-radius: 5px;
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
