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
		<div class="content-right" v-if="Object.keys(activaData).length">
			<el-tabs v-model="activeName" stretch>
				<el-tab-pane label="组件库" name="library">
					<el-alert v-if="!tpsAlert" title="请放置组件后再进行数据编辑(此处编辑无效)" type="warning" show-icon @close="closeAlert" />
					<el-scrollbar class="library-scrollbar">
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
			<div class="control-area">
				<div class="area-main">
					<div class="main-item">
						<span class="area-name">模板文件</span>
						<el-scrollbar class="template-path" view-class="template-view">
							<el-tag @close="handleClose(file)" v-for="(file, index) in templatePath" :key="index" closable type="primary">{{ getFileName(file) }}</el-tag>
							<el-icon class="close-all-item" v-if="templatePath.length" @click="templatePath = []"><ft-ep-Close /></el-icon>
						</el-scrollbar>
						<el-button @click="SelectFolder(true)" :icon="FolderOpened" />
					</div>
					<div class="template-count" v-if="templatePath.length">已选择 {{ templatePath.length }} 个文件</div>
					<div class="main-item">
						<span class="area-name">输出路径</span>
						<div class="output-path">{{ outputPath }}</div>
						<el-button @click="SelectFolder(false)" :icon="FolderOpened" />
					</div>
				</div>
				<div class="area-footer">
					<el-button type="primary" @click="SelectFolder(false)">保存</el-button>
					<el-button type="primary" @click="SelectFolder(false)">输出</el-button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from "vue"
import ftDragInput from "./ft-drag-input.vue"
import ftDragImige from "./ft-drag-image.vue"
import { ArrowRight } from "@element-plus/icons-vue"
import { useMenuStore } from "../stores/index"
import { FolderOpened } from "@element-plus/icons-vue"

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
const templatePath = ref([]) // 模板路径
const outputPath = ref("") // 输出路径

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

// 选择文件路径
async function SelectFolder(isFiles) {
	// 调用 Tauri API 让用户选择文件或文件夹
	const folder = await MenuStore.openFileSelect(isFiles, !isFiles, [{ name: "文件类型", extensions: ["docx"] }])
	// 根据 isFiles 判断是选择文件还是文件夹
	if (isFiles) {
		if (folder) templatePath.value = [...new Set([...templatePath.value, ...folder])] // 追加文件到模板路径，同时去重
	} else {
		if (folder) outputPath.value = folder // 设置输出路径
	}
}

function handleClose(tag) {
	// 从模板路径中移除指定的文件
	templatePath.value = templatePath.value.filter((item) => item !== tag)
}

/**
 * 获取一个路径的文件名
 * @param path
 */
function getFileName(path) {
	const parts = path.split("\\")
	return parts[parts.length - 1]
}

// tps 提示元素已读方法
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

// 调用Tauri API 让用户选择保存路径
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
		display: flex;
		flex-direction: column;

		.el-tabs {
			flex: 1;

			.el-alert {
				margin: 0 10px;
				margin-bottom: 10px;
			}

			.el-tabs__header {
				user-select: none;
			}

			.el-tab-pane {
				height: 100%;

				.library-scrollbar {
					padding: 0 10px;
					height: calc(100vh - 360px);

					.component-library {
						display: flex;
						flex-direction: column;
						gap: 10px;
					}
				}
			}
		}

		.control-area {
			height: 240px;
			border-top: 1px solid #dcdfe6;
			margin-top: 10px;
			padding: 5px;
			display: flex;
			flex-direction: column;

			.area-main {
				flex: 1;
				overflow: hidden;

				.main-item {
					display: flex;
					padding: 5px;
					align-items: center;
					gap: 10px;
					font-size: 14px;
					color: #606266;
					user-select: none;

					.template-path,
					.output-path {
						flex: 1;
						padding: 5px;
						border-radius: 5px;
						border: 1px solid #dcdfe6;
						min-height: 20px;

						.el-scrollbar__wrap {
							max-height: 120px;
							height: 100%;

							.template-view {
								display: flex;
								flex-wrap: wrap;
								gap: 5px;
							}
						}
					}

					.template-path {
						position: relative;

						.close-all-item {
							position: absolute;
							right: 5px;
							top: calc(50% - 8px);
							border-radius: 50%;
							padding: 2px;
							cursor: pointer;
							color: #909399;
							&:hover {
								background-color: #d4d7de;
								color: #ffffff;
							}
						}
					}

					.output-path {
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						background-color: #f5f7fa;
					}
				}

				.template-count {
					margin-left: 75px;
					font-size: 12px;
					color: #606266;
					user-select: none;
				}
			}

			.area-footer {
				height: 40px;
				padding: 0 5px;
				display: flex;
				align-items: center;
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
