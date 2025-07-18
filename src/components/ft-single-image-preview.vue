<template>
	<div :class="src === '' ? 'single-image-preview add-image-preview' : 'single-image-preview'" @mouseenter="showActions = true" @mouseleave="showActions = false">
		<el-image ref="imageRef" v-if="src" :hide-on-click-modal="true" :preview-teleported="true" :src="imageUrl" :preview-src-list="[imageUrl]" fit="cover" />
		<transition v-if="src" name="el-fade-in-linear">
			<div class="image-actions" v-show="showActions">
				<div class="actions-icon">
					<el-icon @click="previewImage"><ft-ep-ZoomIn /></el-icon>
					<el-icon @click="$emit('delItem')"><ft-ep-Delete /></el-icon>
				</div>
			</div>
		</transition>
		<div class="add-buttom" v-if="!src" @click="$emit('addItem')">
			<el-icon><ft-ep-plus /></el-icon>
		</div>
	</div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue"

// ==================== Props变量 =====================
const props = defineProps({
	src: null,
	library: Boolean,
})

// ======================= 变量 =======================
const showActions = ref(false) //移入移出状态
const imageRef = ref(null)
const imageUrl = ref("")

// 监听父组件传递的Src属性变化
watch(
	() => props.src,
	(newVal) => (imageUrl.value = typeof newVal === "string" ? newVal : "")
)
// 启动时赋值显示图片
onMounted(() => {
	imageUrl.value = typeof props.src === "string" ? props.src : ""
})

// ======================= 方法 =======================
// 预览图片
function previewImage() {
	imageRef.value && imageRef.value.showPreview()
}
</script>

<style lang="less">
.single-image-preview {
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 6px;
	position: relative;
	width: 100%;
	height: 100%;
	max-height: 220px;
	overflow: hidden;
	margin: 0 10px;

	.el-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 6px;
	}

	.image-actions {
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: 6px;
		background-color: var(--el-overlay-color-lighter);
		transition: opacity var(--el-transition-duration);

		.actions-icon {
			width: 100%;
			height: 100%;
			display: flex;
			justify-content: center;
			align-items: center;

			.el-icon {
				padding: 5px;
				color: #ffffff;
				cursor: pointer;
				&:hover {
					opacity: 0.7;
				}
			}
		}
	}
}

.add-image-preview {
	opacity: 1;
	min-height: 100px;
	border: 1px dashed #dcdfe6;
	transition: opacity var(--el-transition-duration);
	&:hover {
		border: 1px dashed #409eff;
		cursor: pointer;
	}

	.add-buttom {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}
</style>
