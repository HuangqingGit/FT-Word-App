<template>
	<div class="drag-item">
		<el-card style="max-width: 480px" shadow="hover">
			<template #header>{{ element.name }}</template>
			<img src="https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png" style="width: 100%" />
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
