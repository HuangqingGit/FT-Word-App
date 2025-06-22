<template>
	<div class="drag-item">
		<el-card style="max-width: 480px" shadow="hover">
			<template #header>{{ element.name }}</template>
			<el-input disabled placeholder="文本输入框" />
		</el-card>
	</div>
</template>

<script>
export default {
	props: {
		element: Object,
	},
}
</script>

<style lang="less">
.drag-item {
	padding: 10px 0;
}
</style>
