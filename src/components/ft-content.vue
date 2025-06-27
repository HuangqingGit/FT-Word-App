<template>
	<div class="ft-content">
		<div class="content-left">
			<el-breadcrumb :separator-icon="ArrowRight">
				<el-breadcrumb-item>{{ MenuStore.activaLevel.name }}</el-breadcrumb-item>
				<el-breadcrumb-item>{{ activaData.name }}</el-breadcrumb-item>
			</el-breadcrumb>
			<el-scrollbar>
				<draggable class="main-drag-body" v-model="activaData.datas" v-bind="{ animation: 300, group: 'people', handle: '.move' }" item-key="id">
					<template #item="{ element }">
						<component :is="componentMap[element.type]" :element="element" @addItem="addItem" @delItem="delItem" />
					</template>
				</draggable>
			</el-scrollbar>
		</div>

		<div class="content-right">
			<div>组件库</div>
			<el-scrollbar>
				<draggable class="component-library" :list="moduleList" :group="{ name: 'people', pull: 'clone', put: false }" :clone="customClone" item-key="id" :sort="false">
					<template #item="{ element }">
						<component :is="componentMap[element.type]" :element="element" :library="true" />
					</template>
				</draggable>
			</el-scrollbar>
		</div>
	</div>
</template>

<script setup>
import { ref } from "vue"
import ftDragInput from "./ft-drag-input.vue"
import ftDragImige from "./ft-drag-image.vue"
import { ArrowRight } from "@element-plus/icons-vue"
import { useMenuStore } from "../stores/index"

// ======================= 变量 =======================
const MenuStore = useMenuStore() // Vue Pinia
// 组件映射表
const componentMap = {
	ftDragInput,
	ftDragImige,
}
// 组件库
const moduleList = ref([
	{ id: 1, name: "富文本框", type: "ftDragInput", data: null },
	{ id: 2, name: "图片组件", type: "ftDragImige", data: null },
])

const activaData = ref("") // 当前选中菜单数据

// ================== Pinia 状态监听 ==================
MenuStore.$subscribe((state) => {
	// 菜单切换事件
	if (state.events.key === "activaMenu" || state.events.key === "activaLevel") activaData.value = MenuStore.activaMenu // 监听页面数据变化
	// 触发key不是转换当前项目数据后的响应事件
	if (state.events.key !== "activaToData") MenuStore.activaToPrefix()
	console.log(MenuStore.activaToData)
})

/**
 * 添加Item
 * @param {Object} item
 * @returns {Null}
 */
function addItem(item) {
	item.data.push({ id: crypto.randomUUID(), value: null })
}

/**
 * 删除组件/列表Item
 * @param {Object} element
 * @param {Object|undefined} item
 * @returns {Null}
 */
function delItem(element, item) {
	// item为undefined时删除单个组件，不为undefined时删除一个列表项
	item === undefined ? (MenuStore.activaMenu.datas = activaData.value.datas.filter((i) => !(i.id === element.id))) : (element.data = element.data.filter((i) => !(i.id === item.id)))
}

/**
 * 克隆组件
 * @param {Objcet} cloneItem 当前被克隆的组件对象
 * @returns {Objcet}
 */
function customClone(cloneItem) {
	// 深度克隆组件
	const item = JSON.parse(JSON.stringify(cloneItem))
	// 修改组件唯一ID
	item.id = crypto.randomUUID()
	// 返回克隆的组件对象
	return item
}
</script>

<style lang="less">
.ft-content {
	display: flex;
	height: 100%;

	.content-left {
		flex: 3;
		display: flex;
		flex-direction: column;

		.el-breadcrumb {
			padding: 10px 10px;
			height: 25px;
			display: flex;
			align-items: center;
		}

		.main-drag-body {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
			gap: 10px;
			padding: 10px;

			.cs {
				border: 1px solid #d1d9e0;
				padding: 10px;
				border-radius: 5px;
			}
		}
	}

	.content-right {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 10px;
		max-width: 400px;
		min-width: 200px;
		padding: 0 10px;
		border-left: 2px dashed var(--el-border-color);

		.component-library {
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
	}

	.list-group-item {
		padding: 8px;
		margin: 4px;
		background: #f0f0f0;
		cursor: move;
	}
}
</style>
