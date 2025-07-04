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
					<el-icon v-if="!library" class="del" @click="$emit('delItem', element)"><ft-ep-delete /></el-icon>
					<el-icon v-if="!library" class="move"><ft-ep-Rank /></el-icon>
				</div>
			</template>

			<div class="item-single" v-if="!element.isList"></div>

			<div class="item-list" v-if="element.isList">
				<el-scrollbar>
					<draggable v-model="element.data" v-bind="dragOptions" item-key="id">
						<template #item="{ element: item, index }">
							<div class="item">
								<img :src="item" />
							</div>
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
import { ref, watch, nextTick } from "vue"
import { ElMessageBox, ElMessage } from "element-plus"
import { useMenuStore } from "../stores/index"
import { writeText } from "@tauri-apps/plugin-clipboard-manager"

// ===================== Props =====================
const props = defineProps({
	element: Object,
	library: Boolean,
})

// ===================== 变量 =====================
const MenuStore = useMenuStore()
const isEditName = ref(false)
const nameInput = ref(null)
const dragOptions = {
	animation: 300,
	// handle: ".input_anchor",
	ghostClass: "list-ghost-style",
}

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
			ElMessageBox.confirm("切换成单项模式将清除当前列表！确认继续？", {
				title: "组件模式切换",
				confirmButtonText: "确认",
				cancelButtonText: "取消",
				showClose: false,
				type: "warning",
			})
				.then(() => {
					resolve(true)
					props.element.data = null
				})
				.catch(() => {
					reject(false)
				})
		} else {
			resolve(true)
			props.element.data = [{ id: crypto.randomUUID(), value: null }]
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
				width: 100%;
			}

			.item-list {
				max-height: 220px;

				.el-scrollbar__view {
					padding: 10px !important;

					.list-buttom-footer {
						display: flex;
						justify-content: center;
					}

					.item {
						display: flex;
						align-items: center;
						padding: 5px;
						gap: 10px;

						img {
							max-width: 100px;
						}
					}
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
