<template>
	<div class="darg-image">
		<el-card shadow="hover" body-class="body-style" header-class="header-style" footer-class="footer-style">
			<template #header>
				<div class="he-left">
					<div class="card-name" v-if="!isEditName" @dblclick="!library ? (isEditName = true) : ''">{{ element.name }}</div>
					<el-input
						class="nameInput"
						ref="nameInput"
						v-model="element.name"
						v-if="isEditName"
						placeholder="当前数据项的名称"
						@keyup.enter="$refs.nameInput.blur()"
						@blur="isEditName = false"
					/>
				</div>
				<div class="he-Edit">
					<el-switch v-model="element.isList" inline-prompt active-text="列表" inactive-text="单项" :before-change="switchBefore" />
					<el-icon v-if="!library" class="del" @click="$emit('delItem', element, 'ponent')"><ft-ep-delete /></el-icon>
					<el-icon v-if="!library" class="move"><ft-ep-Rank /></el-icon>
				</div>
			</template>
			<!-- 单项 -->
			<div class="item-single" v-if="!element.isList">
				<ft-single-image-preview :src="element.data" :library="library" @addItem="$emit('addItem', element, 'image')" @delItem="$emit('delItem', element, 'image')" />
			</div>
			<!-- 列表 -->
			<div class="item-list" v-if="element.isList">
				<el-scrollbar>
					<draggable class="darg-image-item" v-model="element.data" v-bind="{ animation: 300, handle: '.darg-handle' }" item-key="id" :move="onMove">
						<template #item="{ element: item, index }">
							<ft-image-preview :src="item" :list="imgList" :index="index" :library="library" @addItem="$emit('addItem', element, 'images')" @delItem="$emit('delItem', element, item)" />
						</template>
					</draggable>
				</el-scrollbar>
			</div>

			<template #footer>
				<div class="add_footer">
					<div class="attr-id" @click="copyAttrID(element.isList, MenuStore.uuidToAttrID(element.id))">
						<span>AttrID：{{ MenuStore.uuidToAttrID(element.id) }} </span>
						<el-icon><ft-ep-DocumentCopy /></el-icon>
					</div>
				</div>
			</template>
		</el-card>
	</div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from "vue"
import { ElMessageBox, ElMessage } from "element-plus"
import { useMenuStore } from "../stores/index"
import { writeText } from "@tauri-apps/plugin-clipboard-manager"
import ftImagePreview from "./ft-image-preview.vue"
import ftSingleImagePreview from "./ft-single-image-preview.vue"

// ===================== Props =====================
const props = defineProps({
	element: Object,
	library: Boolean,
})

// ===================== 变量 =====================
const MenuStore = useMenuStore() // Vue pinia 共享数据
const isEditName = ref(false) // 组件名编辑状态
const nameInput = ref(null) // 组件名Value值
// 计算属性：组件预览图列表
const imgList = computed(() => {
	if (!props.element.isList) return [] // data数据不是列表
	return props.element.data.filter((i) => i.value !== "add-image").map((i) => i.value)
})

// ===================== 监听 =====================
// 监听名称编辑事件
watch(isEditName, (newVal) => {
	if (newVal) {
		nextTick(() => {
			nameInput.value && nameInput.value.select()
		})
	}
})

// ===================== 方法 =====================

/**
 * 图片拖拽排序钩子函数，用于处理不可拖拽函数的排序操作
 * @param evt 拖拽事件
 * @returns {Boolean}
 */
function onMove(evt) {
	if (evt.draggedContext.element.value === "add-image") return false
	const relatedIndex = evt.relatedContext.index
	const arr = props.element.data
	if (relatedIndex >= arr.length - 1) return false
	return true
}

/**
 * 向剪贴板写入数据
 * @param {Boolean} isList
 * @param {String} copyValue
 */
function copyAttrID(isList, copyValue) {
	writeText(isList ? `{%for item in ${copyValue}%}{{item}}{%if not loop.last%}\n{%endif%}{%endfor%}` : `{{${copyValue}}}`)
	ElMessage({ type: "success", message: `AttrID：${copyValue} 组件数据编码已复制`, plain: true, offset: 85, grouping: true })
}

/**
 * 切换组件模式前确认
 * @returns {Promise}
 */
function switchBefore() {
	return new Promise((resolve, reject) => {
		if (props.element.isList) {
			if (props.element.data.length <= 1) {
				resolve(true)
				props.element.data = ""
			} else {
				ElMessageBox.confirm("切换成单项模式将清除当前列表！确认继续？", {
					title: "组件模式切换",
					confirmButtonText: "确认",
					cancelButtonText: "取消",
					showClose: false,
					type: "warning",
				})
					.then(() => {
						resolve(true)
						props.element.data = ""
					})
					.catch(() => {
						reject(false)
					})
			}
		} else {
			resolve(true)
			props.element.data = [{ id: crypto.randomUUID(), value: "add-image" }]
		}
	})
}
</script>

<style lang="less">
.darg-image {
	user-select: none;

	.el-card {
		height: 100%;
		display: flex;
		flex-direction: column;

		.header-style {
			padding: 10px !important;
			height: 55px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			background-color: #f6f8fa;

			.he-left {
				.card-name {
					padding: 5px;
					border: 1px solid transparent;
					border-radius: 5px;
				}

				.card-name:hover {
					border: 1px solid var(--el-border-color);
					cursor: pointer;
				}

				.nameInput {
					max-width: 180px;
				}
			}

			.he-Edit {
				display: flex;
				align-items: center;
				gap: 10px;

				.el-switch {
					--el-switch-off-color: #666666;
				}

				.el-icon {
					padding: 5px;
					border: 1px solid #d1d9e0;
					border-radius: 5px;
				}

				.del:hover {
					background-color: #f56c6c;
					color: #ffffff;
					cursor: pointer;
				}

				.move:hover {
					background-color: #818b981a;
					color: #333333;
					cursor: move;
				}
			}
		}

		.body-style {
			flex: 1;
			display: grid;
			grid-template-rows: 1fr;
			padding: 10px !important;

			.item-single {
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.item-list {
				max-height: 220px;

				.darg-image-item {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
					gap: 8px;
					padding: 10px;
				}
			}
		}

		.footer-style {
			padding: 10px !important;

			.add_footer {
				display: flex;
				align-items: center;
				justify-content: center;

				.attr-id {
					font-size: 11px;
					color: #dcdfe6;
					display: flex;
					align-items: center;
					gap: 5px;
				}

				.attr-id:hover {
					cursor: pointer;
					color: #cdd0d6;
				}
			}
		}
	}
}
</style>
