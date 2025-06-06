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
		return {}
	},
	mounted() {},
	methods: {
		async run_py() {
			const result = await this.$invoke("greet", { data: JSON.stringify({ a: 666, b: "aaa", c: [6,5,4,3,"555"] }) })
			console.log(JSON.parse(result))
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
