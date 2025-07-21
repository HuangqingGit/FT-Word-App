<template>
	<div class="darg-image">
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
				<ft-single-image-preview :src="curImageUrl" :library="library" @addItem="onAddItem('image')" @delItem="onDelItem('image')" />
			</div>
			<!-- 列表组件 -->
			<div class="item-list" v-if="itemData.isList">
				<el-scrollbar>
					<draggable class="darg-image-item" v-model="curImageList" v-bind="{ animation: 300, handle: '.darg-handle' }" item-key="id" :move="onMove">
						<template #item="{ element: item, index }">
							<ft-image-preview :src="item" :list="imgList" :index="index" :library="library" @addItem="onAddItem('images')" @delItem="onDelItem(index)" />
						</template>
					</draggable>
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
						<span>向文档中插入一张图片或一个图片列表</span>
					</div>
				</div>
			</template>
		</el-card>
	</div>
</template>

<script setup>
import { ref, watch, nextTick, computed, onMounted } from "vue"
import { useMenuStore } from "../stores/index"
import { writeText } from "@tauri-apps/plugin-clipboard-manager"
import ftImagePreview from "./ft-image-preview.vue"
import ftSingleImagePreview from "./ft-single-image-preview.vue"

// ===================== Props =====================
const props = defineProps({
	itemData: Object,
	library: Boolean,
})

// ===================== 变量 =====================
const MenuStore = useMenuStore() // Vue pinia 共享数据
const isEditName = ref(false) // 组件名编辑状态
const nameInput = ref(null) // 组件名Value值
const curImageUrl = ref("")
const curImageList = ref([])
// 计算属性：组件预览图列表,筛出"add-image"标记元素，用于展示预览列表
const imgList = computed(() => {
	return curImageList.value.filter((i) => i.value !== "add-image").map((i) => i.value)
})
const emits = defineEmits(["update-data", "addItem", "delItem"])

// ===================== 启动 =====================
onMounted(() => {
	// 组件加载时深度克隆一份父组件的数据
	if (props.itemData.isList) curImageList.value = JSON.parse(JSON.stringify(props.itemData.data))
	if (!props.itemData.isList) curImageUrl.value = JSON.parse(JSON.stringify(props.itemData.data))
})

// ===================== 监听 =====================
// 卡片名称编辑事件
watch(isEditName, (newVal) => {
	if (newVal) nextTick(() => nameInput.value && nameInput.value.select())
})
// 图片列表变化事件
watch(curImageList, () => {
	nextTick(() => nextTick(() => emits("update-data", JSON.parse(JSON.stringify(curImageList.value)))))
})

// ===================== 方法 =====================

/**
 * 添加Item
 * @param {Steing} type element组件类型
 * @returns {Null}
 */
async function onAddItem(type) {
	const multiple = type === "image" ? false : true // 根据条件设置是否允许多选
	const imgs = await MenuStore.openFileSelect(multiple, false, [{ name: "Image", extensions: ["png", "jpg", "jpeg", "bmp", "webp", "icon", "ico", "gif"] }])
	// 用户取消选择
	if (imgs === null) return
	// 单项选择
	if (type === "image") {
		curImageUrl.value = MenuStore.uint8ArrayToBase64(await MenuStore.readFile(imgs))
		emits("update-data", JSON.parse(JSON.stringify(curImageUrl.value)))
	}
	// 列表选择
	if (type === "images") {
		// 使用Promise.all等待所有图片处理完成
		const imagePromises = imgs.map(async (img) => {
			const base64 = MenuStore.uint8ArrayToBase64(await MenuStore.readFile(img))
			return { id: crypto.randomUUID(), value: base64 }
		})

		const newImages = await Promise.all(imagePromises)
		// 插入到倒数第二个位置
		curImageList.value.splice(curImageList.value.length - 1, 0, ...newImages)

		// 等待nextTick确保DOM更新后再触发事件
		nextTick(() => emits("update-data", JSON.parse(JSON.stringify(curImageList.value))))
	}
}

/**
 * 删除Item
 * @param {Object|undefined} item
 * @returns {Null}
 */
function onDelItem(type) {
	// 删除图片
	if (type === "image") curImageUrl.value = ""
	// 删除列表数据
	if (typeof type === "number") curImageList.value.splice(type, 1)
	// 通知父组件更新数据
	nextTick(() => emits("update-data", JSON.parse(JSON.stringify(type === "image" ? curImageUrl.value : curImageList.value))))
}

/**
 * 图片拖拽排序钩子函数，用于处理不可拖拽函数的排序操作
 * @param evt 拖拽事件
 * @returns {Boolean}
 */
function onMove(evt) {
	if (evt.draggedContext.element.value === "add-image") return false
	const relatedIndex = evt.relatedContext.index
	const arr = props.itemData.data
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
	ElMessage({ type: "success", message: `ATTRID：${copyValue} 组件数据编码已复制`, plain: true, offset: 85, grouping: true })
}

/**
 * 切换组件模式前确认
 * @returns {Promise}
 */
function switchBefore() {
	return new Promise((resolve, reject) => {
		if (props.itemData.isList) {
			if (props.itemData.data.length <= 2) {
				resolve(true)
				curImageUrl.value = "" // 清空图片
				nextTick(() => emits("update-data", JSON.parse(JSON.stringify(curImageUrl.value))))
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
						curImageUrl.value = "" // 清空图片
						emits("update-data", JSON.parse(JSON.stringify(curImageUrl.value)))
					})
					.catch(() => {
						reject(false)
					})
			}
		} else {
			resolve(true)
			curImageList.value = [{ id: crypto.randomUUID(), value: "add-image" }]
			nextTick(() => emits("update-data", JSON.parse(JSON.stringify(curImageList.value))))
		}
	})
}
</script>

<style lang="less">
.darg-image {
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
			padding: 10px 0 !important;

			.item-single {
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.item-list {
				max-height: 220px;

				.el-scrollbar {
					padding: 0;

					.darg-image-item {
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(95px, 1fr));
						gap: 8px;
						padding: 0 10px;
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
