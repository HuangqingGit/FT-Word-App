<template>
	<div :class="src.value === 'add-image' ? 'image-preview add-image' : 'image-preview darg-handle'" @mouseenter="showActions = true" @mouseleave="showActions = false">
		<el-image
			ref="imageRef"
			v-if="src.value !== 'add-image'"
			:hide-on-click-modal="true"
			:preview-teleported="true"
			:src="imageBase64"
			:initial-index="index"
			:preview-src-list="list"
			:infinite="false"
			show-progress
			fit="cover"
		/>
		<div class="index-label" v-if="src.value !== 'add-image'">{{ index + 1 }}</div>
		<transition v-if="src.value !== 'add-image'" name="el-fade-in-linear">
			<div class="image-actions" v-show="showActions">
				<div class="actions-icon">
					<el-icon @click="imageRef.showPreview()"><ft-ep-ZoomIn /></el-icon>
					<el-icon @click="$emit('delItem')"><ft-ep-Delete /></el-icon>
				</div>
			</div>
		</transition>
		<div class="add-buttom" v-if="src.value === 'add-image'" @click="$emit('addItem')">
			<el-icon><ft-ep-plus /></el-icon>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted } from "vue"

// ==================== Props变量 =====================
const props = defineProps({
	src: Object,
	list: Array,
	index: Number,
})

// ======================= 变量 =======================
const showActions = ref(false) //输入移入状态
const imageBase64 = ref(null) // Base64格式图片
const imageRef = ref(null) // 当前img的ref名称

// ======================= 启动 =======================
onMounted(() => {
	// 如果是添加按钮属性则退出
	if (props.src.value === "add-image") return
	// 获取当前图片的base64
	imageBase64.value = props.src.value
})
</script>

<style lang="less">
.image-preview {
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 6px;
	position: relative;
	min-height: 85px;
	overflow: hidden;

	.index-label {
		position: absolute;
		display: flex;
		left: 0;
		top: 0;
		width: 35px;
		height: 20px;
		background: #409eff;
		color: #fff;
		font-size: 12px;
		text-align: center;
		transform: rotate(315deg) translate(-5px, -12px);
		border-top-left-radius: 4px;
		box-shadow: 0 2px 8px #0001;
		pointer-events: none;
		user-select: none;
		justify-content: center;
		align-items: flex-end;
	}

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

.add-image {
	border: 1px dashed #dcdfe6;
	transition: opacity var(--el-transition-duration);
	opacity: 1;
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
