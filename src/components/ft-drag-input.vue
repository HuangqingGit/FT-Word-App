<template>
	<div class="darg-input">
		<el-card shadow="hover" body-class="body-style" header-class="header-style" footer-class="footer-style">
			<!-- 卡片页眉 -->
			<template #header>
				<div class="he-left">
					<div class="card-name" v-if="!isEditName" @dblclick="!library ? (isEditName = true) : ''">{{ itemData.name }}</div>
					<el-input
						class="nameInput"
						ref="nameInput"
						v-model="itemData.name"
						v-if="isEditName"
						placeholder="当前数据项的名称"
						@keyup.enter="$refs.nameInput.blur()"
						@blur="isEditName = false"
					/>
				</div>
				<div class="he-Edit">
					<el-switch v-model="itemData.isList" inline-prompt active-text="列表" inactive-text="单项" :before-change="switchBefore" />
					<el-icon v-if="!library" class="del" @click="$emit('delItem', itemData)"><ft-ep-delete /></el-icon>
					<el-icon v-if="!library" class="move"><ft-ep-Rank /></el-icon>
				</div>
			</template>

			<!-- 单项组件 -->
			<div class="item-single" v-if="!itemData.isList">
				<el-input
					v-model="curInputVal"
					type="textarea"
					resize="none"
					placeholder="Enter current item data"
					:autosize="{ minRows: 4, maxRows: 10 }"
					@blur="$emit('update-data', JSON.parse(JSON.stringify(curInputVal)))"
				/>
			</div>
			<!-- 列表组件 -->
			<div class="item-list" v-if="itemData.isList">
				<el-scrollbar>
					<draggable v-model="curInputList" v-bind="dragOptions" item-key="id">
						<template #item="{ element: item, index }">
							<div class="item">
								<el-icon class="input_anchor"><ft-ep-DCaret /></el-icon>
								<el-input v-model="item.value" placeholder="Enter current item data" @blur="$emit('update-data', JSON.parse(JSON.stringify(curInputList)))">
									<template #prepend>{{ index + 1 }}</template>
								</el-input>
								<el-icon class="input_delete" @click="onDelete(item)" v-if="curInputList.length > 1"><ft-ep-delete /></el-icon>
							</div>
						</template>
					</draggable>
					<div class="list-buttom-footer">
						<el-button v-if="itemData.isList" @click="onAddItem">
							<el-icon class="el-icon--left"><ft-ep-plus /></el-icon>添加项
						</el-button>
					</div>
				</el-scrollbar>
			</div>

			<!-- 卡片页脚 -->
			<template #footer>
				<div class="add_footer">
					<!-- 复制参数（数据区生效） -->
					<div v-if="!library" class="attr-id" @click="copyAttrID(itemData.isList, MenuStore.uuidToAttrID(itemData.id))">
						<span>ATTRID：{{ MenuStore.uuidToAttrID(itemData.id) }} </span>
						<el-icon><ft-ep-DocumentCopy /></el-icon>
					</div>
					<!-- 组件区提示信息 -->
					<div v-if="library" class="prompt-msg">
						<el-icon> <ft-ep-Document /></el-icon>
						<span>向文档中插入一段文本或一个文本列表</span>
					</div>
				</div>
			</template>
		</el-card>
	</div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from "vue"
import { useMenuStore } from "../stores/index"
import { writeText } from "@tauri-apps/plugin-clipboard-manager"

// ===================== Props =====================
const props = defineProps({
	itemData: Object,
	library: Boolean,
})

// ===================== 变量 =====================
const MenuStore = useMenuStore()
const isEditName = ref(false)
const nameInput = ref(null)
const curInputVal = ref("")
const curInputList = ref([])
const dragOptions = {
	animation: 300,
	handle: ".input_anchor",
	ghostClass: "list-ghost-style",
}
const emits = defineEmits(["update-data", "addItem", "delItem"])

// ===================== 监听 =====================
// 卡片名称编辑事件
watch(isEditName, (newVal) => {
	if (newVal) nextTick(() => nameInput.value && nameInput.value.select())
})

// ===================== 启动 =====================
onMounted(() => {
	// 组件加载时深度克隆一份父组件的数据
	if (props.itemData.isList) curInputList.value = JSON.parse(JSON.stringify(props.itemData.data))
	if (!props.itemData.isList) curInputVal.value = JSON.parse(JSON.stringify(props.itemData.data))
})

// ===================== 方法 =====================
// 删除列表项
function onDelete(item) {
	curInputList.value = curInputList.value.filter((i) => !(i.id === item.id))
	emits("update-data", JSON.parse(JSON.stringify(curInputList.value)))
}
// 添加列表项
function onAddItem() {
	curInputList.value.push({ id: crypto.randomUUID(), value: "" })
}

/**
 * 向剪贴板写入数据
 * @param {Boolean} isList
 * @param {String} copyValue
 */
function copyAttrID(isList, copyValue) {
	writeText(isList ? `{%for item in ${copyValue}%}{{item}}{%if not loop.last%}\n{%endif%}{%endfor%}` : `{{${copyValue}}}`)
	ElMessage({ type: "success", message: `ATTRID：${copyValue} 组件数据编码已复制`, plain: true, offset: 85, grouping: true })
}

/**
 * 切换组件模式前确认
 * @returns {Promise}
 */
function switchBefore() {
	return new Promise((resolve, reject) => {
		if (props.itemData.isList) {
			if (props.itemData.data.length <= 1) {
				resolve(true)
				curInputVal.value = "" // 清空输入框
				nextTick(() => emits("update-data", JSON.parse(JSON.stringify(curInputVal.value))))
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
						curInputVal.value = "" // 清空输入框
						emits("update-data", JSON.parse(JSON.stringify(curInputVal.value)))
					})
					.catch(() => {
						reject(false)
					})
			}
		} else {
			resolve(true)
			curInputList.value = [{ id: crypto.randomUUID(), value: null }]
			nextTick(() => emits("update-data", JSON.parse(JSON.stringify(curInputList.value))))
		}
	})
}
</script>

<style lang="less">
.darg-input {
	user-select: none;

	.el-card {
		height: 100%;
		max-height: 333px;
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

						.input_anchor,
						.input_delete {
							padding: 5px;
							border-radius: 5px;
							border: 1px solid #d1d9e0;
							color: #59636e;
						}

						.input_anchor:hover {
							background-color: #818b981a;
							cursor: move;
						}

						.input_delete:hover {
							background-color: #f56c6c;
							color: #ffffff;
							cursor: pointer;
						}

						.el-input {
							.el-input-group__prepend {
								padding: 0px !important;
								width: 40px;
							}
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
					color: #c0c4cc;
					display: flex;
					align-items: center;
					gap: 5px;
					&:hover {
						cursor: pointer;
						color: #409eff;
					}
				}

				.prompt-msg {
					display: flex;
					align-items: center;
					width: 100%;
					font-size: 12px;
					color: #606266;

					.el-icon {
						font-size: 15px;
						margin-right: 5px;
					}
				}
			}
		}
	}
}
</style>
