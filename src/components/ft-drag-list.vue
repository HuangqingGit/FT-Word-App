<template>
	<div class="drag-item">
		<el-input v-model="input" style="width: 240px" placeholder="Please input" />
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