<template>
	<div class="ft-content">
		<!-- 空元素占位符 -->
		<el-empty class="empty-element" description="选择一个项目开始编辑" v-if="!Object.keys(activaData).length" />

		<!-- Main数据区 -->
		<div class="content-left" v-if="Object.keys(activaData).length">
			<el-breadcrumb v-if="Object.keys(activaData).length" :separator-icon="ArrowRight">
				<el-breadcrumb-item>{{ MenuStore.activaLevel.name }}</el-breadcrumb-item>
				<el-breadcrumb-item>{{ activaData.name }}</el-breadcrumb-item>
			</el-breadcrumb>
			<el-scrollbar>
				<draggable :class="listLength ? 'main-drag-body' : 'empty-drag-body'" :list="activaData.datas" v-bind="{ animation: 300, group: 'people', handle: '.move' }" item-key="id">
					<template #item="{ element }">
						<component :is="componentMap[element.type]" :itemData="element" @delItem="onDelItem" @update-data="element.data = $event" />
					</template>

					<!-- 空列表占位 -->
					<template #footer>
						<div v-if="!listLength" class="empty-placeholder">
							<div class="empty-msg" v-if="isDragOverB">
								<el-icon><ft-ep-FolderAdd /></el-icon>
								<div>松开鼠标完成添加</div>
							</div>
							<div class="empty-msg" v-if="!isDragOverB">
								<el-icon><ft-ep-Guide /></el-icon>
								<div>从右侧组件库中拖拽组件到此处</div>
							</div>
							<div class="drag-overlay" @dragenter="isDragOverB = true" @dragleave="isDragOverB = false" @drop="isDragOverB = false"></div>
						</div>
					</template>
				</draggable>
			</el-scrollbar>
		</div>

		<!-- 组件/大纲/操作区 -->
		<el-tabs class="content-right" v-model="activeName" stretch v-if="Object.keys(activaData).length">
			<el-tab-pane label="组件库" name="library">
				<el-alert v-if="!tpsAlert" title="请放置组件后再进行数据编辑(此处编辑无效)" type="warning" show-icon @close="closeAlert" />
				<el-scrollbar>
					<draggable class="component-library" :list="moduleList" :group="{ name: 'people', pull: 'clone', put: false }" :clone="customClone" item-key="id" :sort="false">
						<template #item="{ element }">
							<component :is="componentMap[element.type]" :itemData="element" @addItem="onLibrary" :library="true" />
						</template>
					</draggable>
				</el-scrollbar>
			</el-tab-pane>
			<el-tab-pane label="大纲" name="outline">
				<el-scrollbar>待开发···</el-scrollbar>
			</el-tab-pane>
		</el-tabs>
	</div>
</template>

<script setup>
import { ref } from "vue"
import ftDragInput from "./ft-drag-input.vue"
import ftDragImige from "./ft-drag-image.vue"
import { ArrowRight } from "@element-plus/icons-vue"
import { useMenuStore } from "../stores/index"
import { ElMessage } from "element-plus"

// ======================= 变量 =======================
const MenuStore = useMenuStore() // Vue Pinia
const activeName = ref("library")
const isDragOverB = ref(false)
const tpsAlert = ref(window.localStorage.getItem("tpsAlert"))
// 组件映射表
const componentMap = { ftDragInput, ftDragImige }
// 组件库
const moduleList = ref([
	{ id: 1, name: "富文本框", type: "ftDragInput", data: "" },
	{ id: 2, name: "表单组件", type: "ftDragForm", data: "" },
	{ id: 3, name: "图片组件", type: "ftDragImige", data: "" },
])

const activaData = ref([]) // 当前选中菜单数据
const listLength = ref(true)

// ================== Pinia 状态监听 ==================
MenuStore.$subscribe((state) => {
	// 预设触发key
	const keyName = ["activaMenu", "datas", "isList", "data"]
	const key = state.events.key // 获取 key
	const type = state.events.type // 获取 type

	// 判断触发的key是否在预设队列中
	if (keyName.includes(state.events.key) || (type === "add" && typeof Number(key) === "number") || key === "datas") {
		// 加载当前选中的菜单数据
		activaData.value = MenuStore.activaMenu
		// 监听 tpye&key 触发事件，判断 datas 长度用于更新拖拽范围样式
		listLength.value = activaData.value.datas?.length
		// 处理当前编辑中的数据为Py可转换结构
		MenuStore.activaToPrefix()
	}

	// 监听数据编辑事件输出Py数据结构
	if (state.events.key === "activaToData") {
		// console.log(MenuStore.activaToData)
	}
})

// ====================== 方法 ======================
function closeAlert() {
	window.localStorage.setItem("tpsAlert", true)
}

// 组件库的事件
function onLibrary() {
	ElMessage({ type: "warning", message: "请添加组件至列表中进行数据编辑", plain: true, offset: 85, grouping: true })
}

/**
 * 删除组件
 * @param {Object} element
 * @returns {Null}
 */
function onDelItem(element) {
	MenuStore.activaMenu.datas = activaData.value.datas.filter((i) => !(i.id === element.id))
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
	if (item.type === "ftDragInput") item.data = item.isList ? [{ id: crypto.randomUUID(), value: "" }] : ""
	if (item.type === "ftDragImige") item.data = item.isList ? [{ id: crypto.randomUUID(), value: "add-image" }] : ""
	// 返回克隆的组件对象
	return item
}
</script>

<style lang="less">
.ft-content {
	display: flex;
	height: 100%;

	.empty-element {
		flex: 1;
		background-color: #ffffff;
		border-radius: 5px;
		user-select: none;
	}

	.content-left {
		flex: 3;
		display: flex;
		flex-direction: column;
		background-color: #ffffff;
		border-radius: 5px;

		.el-breadcrumb {
			padding: 10px 10px;
			height: 25px;
			display: flex;
			align-items: center;
		}

		.main-drag-body {
			display: grid;
			min-height: calc(100vh - 100px);
			grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
			grid-auto-rows: minmax(0px, 333px);
			gap: 10px;
			padding: 0 10px;
			padding-bottom: 10px;
		}

		.empty-drag-body {
			height: calc(100vh - 100px);
			padding: 0 10px;
			position: relative;

			.empty-placeholder {
				display: flex;
				justify-content: center;
				z-index: 1;
				position: absolute;
				user-select: none;
				width: 100%;
				height: 100%;
				color: #dcdfe6;

				.empty-msg {
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
				}

				.drag-overlay {
					position: absolute;
					width: 95%;
					height: 100%;
				}

				.el-icon {
					font-size: 100px;
				}
			}
		}
	}

	.content-right {
		flex: 1;
		max-width: 400px;
		min-width: 200px;
		background-color: #ffffff;
		margin-left: 5px;
		border-radius: 5px;

		.el-alert {
			margin: 0 10px;
			margin-bottom: 10px;
		}

		.el-tabs__header {
			user-select: none;
		}

		.el-tab-pane {
			height: 100%;

			.el-scrollbar {
				padding: 0 10px;

				.component-library {
					display: flex;
					flex-direction: column;
					min-height: calc(100vh - 100px);
					gap: 10px;
				}
			}
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
