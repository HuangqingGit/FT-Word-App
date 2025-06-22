<template>
	<div class="ft-content">
		<div class="content-left">
			<draggable v-model="list2" v-bind="dragOptions" item-key="id">
				<template #item="{ element }">
					<div class="list-group-item">
						{{ element.name }}
					</div>
				</template>
			</draggable>
		</div>

		<div class="content-right">
			<div>组件库</div>
			<el-scrollbar>
				<draggable :list="list" :group="{ name: 'people', pull: 'clone', put: false }" item-key="id" :sort="false">
					<template #item="{ element }">
						<component :is="element.type" :element="element" />
					</template>
				</draggable>
			</el-scrollbar>
		</div>
	</div>
</template>

<script>
import draggable from "vuedraggable"
import ftDragInput from "./ft-drag-input.vue"
import ftDragImige from "./ft-drag-image.vue"
import ftDragList from "./ft-drag-list.vue"
export default {
	name: "ft-content",
	components: {
		draggable,
		ftDragInput,
		ftDragImige,
		ftDragList,
	},
	data() {
		return {
			drag: false,
			dragOptions: {
				animation: 200,
				group: "people",
				disabled: false,
				ghostClass: "list-ghost-style",
			},
			list: [
				{
					id: 1,
					name: "Input输入框",
					type: "ftDragInput",
					data: [],
				},
				{
					id: 2,
					name: "Image图片",
					type: "ftDragImige",
					data: [],
				},
				{
					id: 3,
					name: "List列表",
					type: "ftDragList",
					data: [],
				},
			],
			list2: [
				{ name: "Juan6", id: 11 },
				{ name: "Juan7", id: 22 },
				{ name: "Juan8", id: 33 },
				{ name: "Juan9", id: 44 },
				{ name: "Juan10", id: 55 },
			],
		}
	},
	mounted() {},
	methods: {},
}
</script>

<style lang="less">
.ft-content {
	display: flex;
	height: 100%;
	.content-left {
		flex: 3;
	}
	.content-right {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: #f0f0f0;
		max-width: 400px;
		min-width: 200px;
		border: 1px dashed #ccc; /* 可视化边界 */
		padding: 0 15px;
	}
	.list-group-item {
		padding: 8px;
		margin: 4px;
		background: #f0f0f0;
		cursor: move;
	}
}
</style>
