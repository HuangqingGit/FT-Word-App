<template>
	<div class="ft-menu">
		<!-- Header-Menu -->
		<div class="el-aside-header">
			<!--目录header Tooltip 悬浮窗 -->
			<el-tooltip :visible="isTipShow" :virtual-ref="triggerDom" virtual-triggering :enterable="false">
				<template #content>
					<span>{{ tooltipText }}</span>
				</template>
			</el-tooltip>
			<el-icon :class="!menuList.length ? 'disabled' : ''" @mouseleave="removTooltip" @mouseenter="triggerTooltip($event, '创建分类')" @click="createClass"><ft-ep-DocumentAdd /></el-icon>
			<el-dropdown placement="bottom-start" trigger="click">
				<span class="el-dropdown" @click="stopTooltipShow">
					<el-icon @mouseleave="removTooltip" @mouseenter="triggerTooltip($event, '新建项目')"><ft-ep-FolderAdd /></el-icon>
				</span>
				<template #dropdown>
					<el-dropdown-menu class="dro-item">
						<el-dropdown-item @click="isShowDialog = true">
							<el-icon><ft-ep-plus /></el-icon>
							<span>新建项目</span>
						</el-dropdown-item>
						<el-dropdown-item @click="importProject">
							<el-icon><ft-ep-document /></el-icon>
							<span>导入项目</span>
						</el-dropdown-item>
					</el-dropdown-menu>
				</template>
			</el-dropdown>
			<el-icon @mouseleave="removTooltip" @mouseenter="triggerTooltip($event, '刷新目录')" @click="getProjectList"><ft-ep-RefreshRight /></el-icon>
			<el-icon @mouseleave="removTooltip" @mouseenter="triggerTooltip($event, '折叠所有项目')" @click="closeAllMenu"><ft-ep-Files /></el-icon>
		</div>

		<!-- Menu-目录 -->
		<el-scrollbar
			@dragenter.stop.prevent="menuDragEvent($event, 'enter')"
			@dragover.stop.prevent="menuDragEvent($event, 'over')"
			@dragleave.stop.prevent="menuDragEvent($event, 'leave')"
			@drop.stop.prevent="menuDragEvent($event, 'drop')"
			class="ft-menu-scrollbar"
		>
			<!-- 文件拖拽元素 -->
			<div class="drag-element" v-if="menuDargStart">
				<div class="is-dragover">
					<el-icon><ft-ep-Document /></el-icon>
					<span>松开鼠标开始导入</span>
				</div>
			</div>

			<!-- 空列表占位元素 -->
			<el-empty class="menu-empty-element" description="新建或导入一个项目" v-if="!menuList.length && !menuDargStart" />

			<!-- 目录 -->
			<el-menu class="el-menu-vertical" ref="ftElMenu" v-if="menuList.length" :default-active="curActive" @select="curActive = $event">
				<el-sub-menu :key="index" :index="item.index.toString()" v-for="(item, index) in menuList" @contextmenu="onContext($event, [index])" @click="setFatherID(item.index.toString())">
					<template #title>
						<el-avatar :src="item.icon" :size="32" @error="true">
							<img src="https://img.kuckji.cn/i/2025/06/17/6850dc498d658.png" />
						</el-avatar>
						<span>{{ item.name }}</span>
					</template>
					<el-menu-item
						v-for="(child, childIndex) in item.children"
						@dblclick="dblclick(child, `${item.index}-${childIndex}`)"
						@contextmenu="onContext($event, [index, childIndex], item.index)"
						:index="item.index + '-' + childIndex"
						:key="childIndex"
					>
						<span v-if="!child.isEdit">{{ child.name }}</span>
						<el-input
							v-if="child.isEdit"
							v-model="child.name"
							:ref="`${item.index}-${childIndex}`"
							@keyup.enter="$refs[`${item.index}-${childIndex}`][0].blur()"
							@blur="blurClass(child.name, item, childIndex)"
						/>
					</el-menu-item>
				</el-sub-menu>
			</el-menu>
		</el-scrollbar>

		<!-- 目录右键菜单-Start -->
		<el-popover ref="ftPopover" :show-arrow="false" :hide-after="0" :offset="0" width="100" transition="none" trigger="hover" placement="right-start" @hide="onMenuShow = false">
			<ul class="ft-menu-ul">
				<li class="ft-menu-li" v-show="isExport" @click="menuOptionsEvent('export')">
					<span class="ft-select-text">导出配置</span>
					<el-icon class="ft-select-icon"><ft-ep-Position /></el-icon>
				</li>
				<li class="ft-menu-li" v-show="isExport" @click="menuOptionsEvent('edit')">
					<span class="ft-select-text">编辑项目</span>
					<el-icon class="ft-select-icon"><ft-ep-Edit /></el-icon>
				</li>
				<li class="ft-menu-li" v-show="!isExport" @click="menuOptionsEvent('rename')">
					<span class="ft-select-text">重命名</span>
					<el-icon class="ft-select-icon"><ft-ep-EditPen /></el-icon>
				</li>
				<li class="ft-menu-li ft-delete" :class="isDisableDel ? 'disabled' : ''" @click="menuOptionsEvent('delete')">
					<span class="ft-select-text">删除</span>
					<el-icon class="ft-select-icon"><ft-ep-Delete /></el-icon>
				</li>
			</ul>
			<template #reference>
				<div id="on-menu" class="on-menu" v-show="onMenuShow"></div>
			</template>
		</el-popover>

		<!-- 新建项目弹窗 -->
		<el-dialog v-model="isShowDialog" header-class="dialog-header" width="500" align-center :show-close="false" @closed="closeDialogEvent">
			<template #header>
				<div v-if="isEditPrefix">
					<el-icon><ft-ep-plus /></el-icon>
					<span>新建项目</span>
				</div>
				<div v-if="!isEditPrefix">
					<el-icon><ft-ep-edit /></el-icon>
					<span>编辑项目</span>
				</div>
			</template>

			<div class="left">
				<div :class="projectImgBase64 ? 'add-Proimg' : 'add-Proimg add-image '" @mouseenter="showActions = true" @mouseleave="showActions = false">
					<el-image
						ref="imageRef"
						v-if="projectImgBase64"
						:hide-on-click-modal="true"
						:preview-src-list="[projectImgBase64]"
						:preview-teleported="true"
						:src="projectImgBase64"
						fit="cover"
					/>
					<transition name="el-fade-in-linear" v-if="projectImgBase64">
						<div class="image-actions" v-show="showActions">
							<div class="actions-icon">
								<el-icon @click="imageRef.showPreview()"><ft-ep-ZoomIn /></el-icon>
								<el-icon @click="projectImgBase64 = null"><ft-ep-Delete /></el-icon>
							</div>
						</div>
					</transition>
					<div class="add-buttom" v-if="!projectImgBase64" @click="addProjectImg">
						<el-icon><ft-ep-plus /></el-icon>
					</div>
				</div>
				<span class="text">项目图标</span>
				<span class="text-12px">建议尺寸≤200*200</span>
			</div>
			<div class="right">
				<div class="dialog-content-item">
					<span class="item-name">项目名称</span>
					<el-input v-model="projectName" style="flex: 1" minlength="2" maxlength="8" placeholder="输入2-8个字符" show-word-limit clearable type="text" />
				</div>
				<div class="error-w">
					<transition name="el-zoom-in-top">
						<div class="dialog-prompt error" v-if="dialogText">
							<el-icon><ft-ep-CircleCloseFilled /></el-icon>
							<el-text class="mx-1" size="small">{{ dialogText }}</el-text>
						</div>
					</transition>
				</div>
				<div class="dialog-content-item">
					<span class="item-name">模板字段</span>
					<el-input v-model="projectPrefix" :disabled="!isEditPrefix" style="flex: 1" placeholder="添加模板字段前缀" />
					<el-tooltip class="box-item" effect="dark" content="用于程序在处理文档时区分项目模板" placement="right">
						<el-icon><ft-ep-QuestionFilled /></el-icon>
					</el-tooltip>
				</div>
				<div class="dialog-prompt info" v-if="isEditPrefix">
					<el-icon><ft-ep-InfoFilled /></el-icon>
					<el-text class="mx-1" size="small">创建成功后字段前缀名不可修改</el-text>
				</div>
			</div>

			<template #footer>
				<div class="dialog-footer">
					<el-button @click="isShowDialog = false">取消</el-button>
					<el-button type="primary" @click="createProject" :disabled="isClickConfirm">确认</el-button>
				</div>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from "vue"
import { useMenuStore } from "../stores/index"

// 模板获取当前实例
const { proxy } = getCurrentInstance()

// ===================== 变量 =====================
const MenuStore = useMenuStore() // Vue Pinia
MenuStore.proxy = proxy

const isShowDialog = ref(false) // 是否显示弹窗
const isClickConfirm = ref(true) // 是否禁止点击确认键
const isEditPrefix = ref(true) // 是否允许编辑项目前缀
const projectImgBase64 = ref(null) // 项目头像的Base64
const imageRef = ref(null) // 当前img的ref名称
const dialogText = ref(null) // 错误提示
const projectName = ref(null) // 新建项目输入Value
const projectPrefix = ref(null) // 新建项目前缀
const showActions = ref(false)

const triggerDom = ref(null) // 当前触发 Tooltip 的元素
const hideTooltip = ref(null) // 隐藏 Tooltip 计时器
const showTooltip = ref(null) // 显示 Tooltip 计时器
const tooltipText = ref(null) // Tooltip 显示的文本
const isTipShow = ref(false) // Tooltip 的可见性

const dirPath = "f-tone" // 本地数据缓存路径
const isExport = ref(false) // 是否显示导出选项
const onMenuShow = ref(false) // 是否显示右键菜单栏

const isDisableDel = ref(false) // 是否禁用删除选项
const formerName = ref(null) // 子菜单的曾用名
const parentIndex = ref(null) // 选中的父级菜单索引
const curMenuIndex = ref([]) // 当前选中菜单索引
const curActive = ref(window.sessionStorage.getItem("FT-CUR-ACTIVE")) // 当前激活的菜单
const menuList = ref([]) // 菜单目录列表

const menuDargStart = ref(false) // 目录文件拖拽状态

// ===================== Vue监听 =====================
watch(projectName, (newVal) => editAuxFun(newVal))
watch(projectImgBase64, () => editAuxFun(projectName.value))
watch(curActive, (newVal) => {
	window.sessionStorage.setItem("FT-CUR-ACTIVE", newVal)
	menuAuxiliary()
})

// ================== Pinia 状态监听 ==================
MenuStore.$subscribe((list) => {
	// 监听变化的是否为目录属性
	if (list.events.key === "menu_lists") {
		menuList.value = list.events.newValue // 给目录赋值
		if (!curActive.value) return // 当前激活菜单ID不存在时
		menuAuxiliary() // 激活关联事件
	}
})

// ===================== 生命周期 =====================
onMounted(() => getProjectList())

// ===================== 方法 =====================
/**
 *  菜单文件拖拽事件处理函数
 * @param e 文件拖拽事件
 * @param type 拖拽触发事件
 */
function menuDragEvent(e, type) {
	if (!e.currentTarget.classList.contains("ft-menu-scrollbar")) return
	// 只在真正进入/离开容器时处理
	if (type === "enter" || type === "leave") {
		if (type === "enter" && e.currentTarget.contains(e.relatedTarget)) return
		if (type === "leave" && e.currentTarget.contains(e.relatedTarget)) return
	}
	e.preventDefault() // 阻止默认事件
	e.stopPropagation() // 阻止冒泡事件

	if (type === "over") return // 拖拽动作（无操作直接返回）
	if (type === "enter") menuDargStart.value = true // 拖拽进入时显示拖拽元素
	if (type === "leave") menuDargStart.value = false // 拖拽离开时隐藏拖拽元素
	if (type === "drop") {
		menuDargStart.value = false // 拖拽结束时隐藏拖拽元素
		const dt = e.dataTransfer // 获取拖拽数据
		const newFiles = dt.files // 获取拖拽的文件列表

		// 如果没有文件，直接返回
		if (!newFiles.length) return

		// 创建Promise数组，用于处理异步读取
		const readPromises = Array.from(newFiles).map((file) => {
			return new Promise((resolve) => {
				// 只处理JSON文件
				if (file.type === "application/json") {
					const reader = new FileReader()

					reader.onload = (fe) => {
						try {
							const proIndex = Date.now()
							const textContent = JSON.parse(fe.target.result)

							// 检查数据格式
							const requiredKeys = ["name", "prefix", "icon", "children"]
							const hasAllKeys = requiredKeys.every((key) => key in textContent)

							if (hasAllKeys) {
								textContent.index = proIndex // 为文件添加唯一ID
								resolve({
									filePath: `${dirPath}/${proIndex}.json`,
									fileData: textContent,
								})
							} else {
								console.warn(`文件 ${file.name} 缺少必要字段`, requiredKeys)
								showNotification("警告", `文件【${file.name}】缺少必要字段！`, "warning")
								resolve(null)
							}
						} catch (error) {
							console.error(`解析文件 ${file.name} 失败:`, error)
							showNotification("错误", `解析文件【${file.name}】失败！`, "error")
							resolve(null)
						}
					}
					reader.onerror = () => {
						showNotification("错误", `读取文件【${file.name}】失败`, "error")
						resolve(null)
					}
					reader.readAsText(file)
				} else {
					showNotification("提示", `【${file.name}】不是JSON文件，已自动忽略！`, "primary")
					resolve(null)
				}
			})
		})

		// 等待所有文件读取完成
		Promise.all(readPromises).then((results) => {
			// 过滤掉null结果（无效文件）
			const validFiles = results.filter(Boolean)
			if (!validFiles.length) return // 如果没有有效文件，直接返回

			// 加载一段动画后执行
			const el_load = ElLoading.service({ text: "正在校验文件" })

			// 刷新目录
			setTimeout(() => {
				// 延迟遍历
				validFiles.forEach(async (file) => {
					const ret = await MenuStore.writeText(file.filePath, file.fileData)
					if (ret.code == 0) showNotification("成功", `【${file.fileData.name}】导入成功！`, "success")
				})
				el_load.close() // 关闭动画
				getProjectList() // 刷新列表
			}, 1000)
		})
	}
}

// 设置一级目录ID
function setFatherID(id) {
	window.sessionStorage.setItem("FT-FATHER", id)
}

// 目录菜单激活关联事件辅助函数
function menuAuxiliary() {
	const ar = curActive.value.split("-") // 分割菜单ID
	const it = menuList.value.filter((item) => item.index == ar[0]) // 查找一级菜单目录
	if (!it.length) return // 符合匹配条件的菜单目录为空时
	MenuStore.setActivaLevel({ name: it[0].name, index: it[0].index, prefix: it[0].prefix, fileName: it[0].fileName, icon: it[0].icon }) // 向Store写入一级目录信息
	MenuStore.setActivaMenu(it[0].children[ar[1]]) // 显示当前选中菜单的数据
}

// 编辑项目辅助函数
function editAuxFun(name) {
	let valiValue = validateName(name)
	// 校验成功是为false，错误时为true
	if (valiValue) {
		isClickConfirm.value = true // 可提交
		dialogText.value = valiValue === true ? false : valiValue // 错误提示
	} else {
		dialogText.value = false // 错误提示隐藏
		isClickConfirm.value = false // 不可提交
		if (!isEditPrefix.value) return // 如果为编辑模式则直接退出，不修改项目前缀
		projectPrefix.value = MenuStore.getFirstLetter(name) // 获取文本首字母
	}
}

// 创建项目分类
function createClass() {
	// 如果目录为空则不允许创建分类，直接退出
	if (!menuList.value.length) return
	// 获取 sessionStorage 的数据
	let fatherId = window.sessionStorage.getItem("FT-FATHER")
	// 如果读取结果为空/null，且目录数据不为空时
	if (fatherId === null && menuList.value.length > 0) {
		setFatherID(menuList.value[0].index) // 写入第一项的ID
		fatherId = `${menuList.value[0].index}` // 从新赋值第一项ID
	}
	// 展开被添加项的菜单
	proxy.$refs.ftElMenu?.open(fatherId)
	// 设置曾用名
	formerName.value = ""
	// 获取最近选中的菜单对象
	const curMenu = menuList.value.find((item) => item.index == fatherId)
	// 向对象中插入数据
	curMenu.children.unshift({ name: formerName.value, datas: [], isEdit: true })
	// 已有激活菜单时
	if (curActive.value) {
		const curAMI = curActive.value.split("-") // 获取当前激活目录的索引
		if (fatherId === curAMI[0]) curActive.value = `${curAMI[0]}-${Number(curAMI[1]) + 1}` // 选中的一级菜单ID和最小触发的一及菜单相同才执行
	} else {
		// session为空时默认选中第一项
		curActive.value = `${fatherId}-1`
	}
	// 等待 DOM 更新后选中Input
	nextTick(() => proxy.$refs[`${fatherId}-0`][0].select())
}

// dialog 关闭事件
function closeDialogEvent() {
	projectName.value = null
	projectImgBase64.value = null
	isEditPrefix.value = true
}

// 添加头像点击事件
function addProjectImg() {
	MenuStore.openFileSelect(false, false, [{ name: "Image", extensions: ["png", "jpg", "jpeg", "bmp", "webp", "icon", "ico", "gif"] }]).then((img) => {
		// 取消选择时，直接退出
		if (img === null) return
		MenuStore.readFile(img).then((contents) => {
			projectImgBase64.value = MenuStore.uint8ArrayToBase64(contents)
		})
	})
}

// 创建|编辑项目
function createProject() {
	// 创建模式
	if (isEditPrefix.value) {
		const proIndex = Date.now()
		const newObject = {
			name: projectName.value,
			prefix: projectPrefix.value,
			icon: projectImgBase64.value,
			index: proIndex,
			isEdit: false,
			children: [{ name: "默认分类", datas: [] }],
		}
		MenuStore.writeText(`${dirPath}/${proIndex}.json`, newObject)
		isShowDialog.value = false
		ElMessage({ type: "success", message: "创建成功", plain: true, offset: 85, grouping: true })
		getProjectList() // 刷新目录
	}
	// 编辑模式
	else {
		let curData = menuList.value[curMenuIndex.value[0]] // 获取当前选中的数据
		let fileName = curData.fileName // 获取当前文件名
		curData.name = projectName.value // 赋值新的项目名称
		curData.icon = projectImgBase64.value // 赋值新的头像Base64
		MenuStore.writeText(`${dirPath}/${fileName}`, curData) // 写入数据
		isShowDialog.value = false // 关闭弹窗
		ElMessage({ type: "success", message: "编辑成功", plain: true, offset: 85, grouping: true })
	}
}

// 项目导入
function importProject() {
	// 筛选器配置
	const options = [
		{
			name: "JSON源文件",
			extensions: ["json"],
		},
	]
	// 打开文件选择框
	MenuStore.openFileSelect(false, false, options)
		.then((res) => {
			// 选取结果不能为null，为null代表用户取消选择
			if (res !== null) {
				// 读取文件数据流
				proxy.$readFile(res).then((text) => {
					let proIndex = Date.now()
					// Uint8Array 转换为json数据
					let content = JSON.parse(new TextDecoder("utf-8").decode(text))
					// 检查数据格式
					let ver = new Set(Object.keys(content))
					let arr = ["name", "prefix", "icon", "children"]
					// 加载一段动画后执行
					const el_load = ElLoading.service({
						text: "正在校验文件",
						closed: async () => {
							if (arr.every((item) => ver.has(item))) {
								// 为文件添加唯一ID
								content.index = proIndex
								// 数据写入本地
								MenuStore.writeText(`${dirPath}/${proIndex}.json`, content)
								ElMessage({ type: "success", message: "导入成功", plain: true, offset: 85, grouping: true })
								// 刷新列表
								getProjectList()
							} else {
								ElMessageBox.confirm("文件校验未通过：不被接受的数据格式", "Error", {
									type: "error",
									confirmButtonText: "确认",
									autofocus: false,
									showClose: false,
									showCancelButton: false,
									closeOnPressEscape: false,
								})
							}
						},
					})
					// 导入配置延时函数
					setTimeout(() => el_load.close(), 1500)
				})
			}
		})
		.catch((error) => {
			console.log(error)
		})
}

// 折叠所有项目
function closeAllMenu() {
	stopTooltipShow()
	menuList.value.forEach((item) => {
		proxy.$refs.ftElMenu?.close(item.index.toString())
	})
}

// Tooltip 移出触发事件
function removTooltip() {
	if (isTipShow.value) {
		hideTooltip.value = setTimeout(() => {
			isTipShow.value = false
		}, 200)
	} else {
		clearInterval(showTooltip.value)
	}
}

// 停止 Tooltip 的所有动作
function stopTooltipShow() {
	isTipShow.value = false
	clearInterval(hideTooltip.value)
	clearInterval(showTooltip.value)
}

// 获取项目列表
function getProjectList() {
	stopTooltipShow()
	MenuStore.create_dir(dirPath, true).then((res) => {
		if (!res.code) {
			// 清空菜单列表
			menuList.value = []
			// 检查目录是否存在，如果不存在则创建
			proxy
				.$readDir(dirPath, { baseDir: proxy.$BaseDirectory.Document })
				.then((files) => {
					// 存储所有文件读取的 Promise
					const fileReadPromises = files
						.filter((file) => file.isFile && file.name.toLowerCase().endsWith(".json"))
						.map((file) => {
							return proxy
								.$readFile(`${dirPath}/${file.name}`, {
									baseDir: proxy.$BaseDirectory.Document,
								})
								.then((u8Array) => {
									const content = JSON.parse(new TextDecoder("utf-8").decode(u8Array))
									// 检查数据格式
									let ver = new Set(Object.keys(content))
									let arr = ["name", "prefix", "icon", "children"]
									if (arr.every((item) => ver.has(item))) {
										content.fileName = file.name // 添加文件名
										return content
									}
									return null
								})
								.catch((error) => {
									console.error("读取文件失败:", error)
									return null // 读取失败时返回 null
								})
						})

					// 等待所有文件读取完成
					Promise.all(fileReadPromises)
						.then((contents) => {
							// 过滤掉读取失败的文件（null 值）
							const validContents = contents.filter((content) => content !== null)
							// 按 index 升序排序
							MenuStore.setMenu(validContents.sort((a, b) => b.index - a.index))
						})
						.catch((error) => {
							console.error("处理文件时出错:", error)
						})
				})
				.catch((error) => {
					console.error("读取项目列表失败:", error)
				})
		}
	})
}

/**
 * 显示通知
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 * @param {'primary'|'success'|'warning'|'error'|'info'} [type='info'] - 通知类型
 */
function showNotification(title, message, type = "info") {
	// 将通知加入队列
	MenuStore.notificationQueue.push({ title, message, type })
	// 尝试处理队列
	MenuStore.processNotificationQueue()
}

/**
 * 子菜单双击事件
 * @param {Object} item 当前操作的菜单对象
 * @param {Number} index 当前操作的菜单索引
 * @returns {Null} 无返回值
 */
function dblclick(item, index) {
	// 激活当前选中菜单
	curActive.value = index
	// 触发编辑状态
	item.isEdit = true
	// 保存曾用名
	formerName.value = item.name
	// 等待 DOM 更新后选中Input中的内容
	nextTick(() => proxy.$refs[index][0].select())
}

/**
 * 子菜单input失去光标事件
 * @param {String} name 当前输入的名称
 * @param {Object} item 当前操作的菜单对象
 * @param {Number} index 当前操作的菜单索引
 * @returns {Null} 无返回值
 */
function blurClass(name, item, index) {
	// 获取当前激活目录的索引
	const curActiveMenu = curActive.value.split("-")
	const fatherId = window.sessionStorage.getItem("FT-FATHER")
	// 判断输入的分类名称是否为空字符串（无输入时）,输入名称和曾用名都为空
	if (item.children[index].name === "" && formerName.value === "") {
		// 如果创建的项在激活菜单中，就删除不符合条件的项，重新选中激活菜单
		if (fatherId === curActiveMenu[0]) curActive.value = `${curActiveMenu[0]}-${Number(curActiveMenu[1]) - 1}`
		return item.children.shift() // 删除第一项数据
	}

	// 获取当前选择项目的文件名
	let fileName = `${dirPath}/${item.fileName}`
	item.children[index].isEdit = false
	const verRes = validateName(name)
	// 格式校验不通过
	if (typeof verRes === "string") {
		// 提示错误信息
		ElMessage({ type: "warning", message: `分类名称不符合命名规范：${verRes}`, plain: true, offset: 85, grouping: true })
		// 判断是否创建分类时的名称不符合规范（有输入时）
		if (formerName.value === "") {
			// 如果创建的项在激活菜单中，就删除不符合条件的项，重新选中激活菜单
			if (fatherId === curActiveMenu[0]) curActive.value = `${curActiveMenu[0]}-${Number(curActiveMenu[1]) - 1}`
			return item.children.shift() // 删除第一项数据
		}
		// 刷新菜单列表
		item.children[index].name = formerName.value
	}
	// 写入文件
	MenuStore.writeText(fileName, item)
}

/**
 * Tooltip 移入触发事件
 * @param {Object} e 鼠标事件
 * @param {String} text Tooltip 提示文本
 * @returns {Null} 无返回值
 */
function triggerTooltip(e, text) {
	clearInterval(showTooltip.value)
	triggerDom.value = e.currentTarget
	tooltipText.value = text
	if (!isTipShow.value) {
		showTooltip.value = setTimeout(() => {
			isTipShow.value = true
		}, 600)
	} else {
		clearInterval(hideTooltip.value)
	}
}

/**
 * 菜单栏右键处理事件
 * @param {Object} e 鼠标事件
 * @param {Array} index 索引下标
 * @param {Number} itemIndex 父级菜单的index属性
 * @returns {Null} 无返回值
 */
function onContext(e, index, itemIndex) {
	e.preventDefault() // 阻止默认事件
	e.stopPropagation() // 阻止冒泡事件
	// 判断当前触发右键属性的菜单是一级目录还是二级目录
	isDisableDel.value = index.length > 1 && menuList.value[index[0]].children.length <= 1 ? true : false
	// 判断是否需要显示导出数据选项
	isExport.value = index.length > 1 ? false : true
	// 右键菜单父级菜单Index索引
	parentIndex.value = itemIndex
	// 右键菜单索引
	curMenuIndex.value = index
	// 获取dom节点
	const element = document.getElementById("on-menu")
	// 显示依附的dom节点
	onMenuShow.value = true
	element.dispatchEvent(new MouseEvent("mouseenter"))
	element.style.top = `${e.clientY - 5}px`
	element.style.left = `${e.clientX - 5}px`
}

/**
 * 项目/分类改名正则表达式
 * @param name Input中的文本
 * @returns {Boolean|String}
 * ```javascript
 * const res = validateName(name)
 * console.log(res) // 输出结果OK：false；NO：true
 * ```
 */
function validateName(name) {
	// 定义允许的特殊符号
	const allowedSymbols = "（）()【】-+_"
	// 传递参数为null返回True
	if (name === null) return true
	// 检查长度
	if (name.length < 2 || name.length > 8) {
		return "名称应控制字数在2-8位之间"
	}
	// 检查是否有不允许的字符
	const regex = /^[\u4e00-\u9fa5a-zA-Z0-9（）()【】\-+_]+$/
	if (!regex.test(name)) {
		// 找出不允许的字符
		const invalidChars = []
		for (const char of name) {
			if (!/^[\u4e00-\u9fa5a-zA-Z0-9]$/.test(char) && !allowedSymbols.includes(char)) {
				if (!invalidChars.includes(char)) {
					invalidChars.push(char)
				}
			}
		}
		return `允许的特殊符号：${allowedSymbols}`
	}
	// 如果都符合
	return false
}

/**
 * 右键菜单选项响应事件
 * @param {String} re_type 响应事件类型
 * @returns {Null} 无返回值
 */
function menuOptionsEvent(re_type) {
	proxy.$refs.ftPopover?.hide() // 隐藏Popover
	let index = curMenuIndex.value // 当前右键选项的indexs
	let curActiveIndex = curActive.value?.split("-") // 分割当前激活的菜单索引
	let projectData = menuList.value[index[0]] // 获取当前选中项目的Data对象
	let fileName = `${dirPath}/${projectData.fileName}` // 获取当前选择项目的文件名
	let name1 = projectData.name // 获取选择项目的名称

	if (index.length > 1) {
		let name2 = projectData.children[index[1]].name // 获取选中分类的名称
		// 分类操作
		switch (re_type) {
			// 删除分类
			case "delete":
				if (isDisableDel.value) {
					ElMessage({ type: "warning", message: "项目分类最少保留一项", plain: true, offset: 85, grouping: true })
				} else {
					ElMessageBox.confirm("该操作将永久删除该分类，确定继续吗？", {
						title: `${name1} · ${name2}`,
						confirmButtonText: "确认",
						cancelButtonText: "取消",
						showClose: false,
						type: "warning",
					})
						.then(() => {
							projectData.children.splice(index[1], 1)
							MenuStore.writeText(fileName, projectData)
							ElMessage({ type: "success", message: "删除成功", plain: true, offset: 85, grouping: true })
							// 获取当前对象长度
							let delLength = projectData.children.length
							// 当前操作删除的一级菜单索引等于对应当前激活的一级菜单索引时
							if ((projectData.index == curActiveIndex?.[0] && index[1] == curActiveIndex?.[1] && index[1] == delLength) || index[1] < curActiveIndex?.[1]) {
								curActive.value = `${curActiveIndex?.[0]}-${curActiveIndex?.[1] - 1}`
							}
							// 显示当前激活的菜单数据
							menuAuxiliary()
						})
						.catch(() => {})
				}
				break
			// 重命名分类
			case "rename":
				dblclick(menuList.value[index[0]].children[index[1]], `${parentIndex.value}-${index[1]}`)
				break
		}
	} else {
		// 项目操作
		switch (re_type) {
			// 删除项目
			case "delete":
				ElMessageBox.confirm("该操作将永久删除该项目，确定继续吗？", {
					title: name1,
					confirmButtonText: "确认",
					cancelButtonText: "取消",
					showClose: false,
					type: "warning",
				})
					.then(() => {
						MenuStore.delFile(fileName)
						menuList.value.splice(index[0], 1)
						ElMessage({ type: "success", message: "删除成功", plain: true, offset: 85, grouping: true })
						// 删除项目后，如果被删除的一级目录是被激活的目录，则清理sessionStorage中缓存的数据
						if (curActiveIndex?.[0] == projectData.index) {
							window.sessionStorage.removeItem("FT-CUR-ACTIVE")
							window.sessionStorage.removeItem("FT-FATHER")
							MenuStore.setActivaLevel({})
							MenuStore.setActivaMenu({})
							getProjectList() // 从新刷新列表
						}
					})
					.catch(() => {})
				break
			// 导出项目
			case "export":
				// 创建加载动画
				const el_load = ElLoading.service({
					text: "正在导出",
					closed: async () => {
						try {
							let newObj = JSON.parse(JSON.stringify(menuList.value[index[0]]))
							delete newObj.fileName
							const exp = await MenuStore.writeText(`${name1}.json`, newObj, proxy.$BaseDirectory.Desktop)
							if (!exp.code) {
								ElMessage({ type: "success", message: "已导出到桌面", plain: true, offset: 85, grouping: true })
							}
						} catch (error) {
							console.log(error)
						}
					},
				})
				// 导出配置延时函数
				setTimeout(() => el_load.close(), 1500)
				break
			// 编辑项目
			case "edit":
				projectImgBase64.value = projectData.icon
				projectName.value = projectData.name
				projectPrefix.value = projectData.prefix
				isEditPrefix.value = false
				isShowDialog.value = true
				// 由于事件监听原因会动态刷新Confirm可点击状态，所以等待Dom加载完成后将确认按钮设为不可点击状态
				nextTick(() => (isClickConfirm.value = true))
				break
		}
	}
}
</script>

<style lang="less">
.on-menu {
	position: fixed;
	width: 5px;
	height: 20px;
	z-index: 1;
}
.ft-menu {
	height: 100%;
	overflow: hidden;
	display: flex;
	flex-direction: column;

	.el-aside-header {
		height: 35px;
		display: flex;
		padding: 0 5px;
		align-items: center;
		justify-content: space-around;
		justify-items: center;

		.el-dropdown {
			outline: unset;
			font-size: 1em;
		}

		.el-icon {
			padding: 5px 10px;
			border-radius: 3px;
			color: #000000;
		}

		.el-icon:hover {
			background-color: #f0f0f0;
		}

		.el-icon:active {
			background-color: #d9d9d9;
		}
	}

	.ft-menu-scrollbar {
		.menu-empty-element,
		.drag-element {
			position: absolute;
			width: 100%;
			height: 100%;
			z-index: 1000;

			&::after {
				content: "";
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				z-index: 1000;
			}

			& > * {
				pointer-events: none;
			}
		}

		.drag-element {
			.is-dragover {
				margin: 3px;
				display: flex;
				align-items: center;
				flex-direction: column;
				justify-content: center;
				height: calc(100vh - 85px);
				border-radius: 5px;
				border: 1px dashed #409eff;
				background-color: #ecf5ff;
				color: #606266;
				font-size: 14px;
				.el-icon {
					font-size: 5rem;
					color: #a8abb2;
				}
			}
		}

		.el-menu {
			.is-active {
				--el-menu-active-color: #409eff;
				background-color: #f6f8fa;
			}

			.el-sub-menu__title {
				.el-avatar {
					margin-right: 8px;
				}
			}

			.el-menu--inline {
				.el-menu-item {
					justify-content: center;
				}
			}
		}
	}

	.el-menu-vertical {
		border-right: 0px;
	}

	.el-dialog {
		.dialog-header {
			color: #303133;
			display: flex;
			align-items: center;

			.el-icon {
				margin-right: 8px;
			}
		}

		.el-dialog__body {
			display: flex;

			.left {
				width: 120px;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;

				.add-Proimg {
					width: 70px;
					height: 70px;
					display: flex;
					border: 1px dashed transparent;
					align-items: center;
					justify-content: center;
					border-radius: 6px;
					position: relative;
					overflow: hidden;

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

				.text {
					margin-top: 5px;
				}
			}

			.right {
				flex: 1;

				.dialog-content-item {
					display: flex;
					align-items: center;
					height: 32px;

					.item-name {
						margin-right: 15px;
					}

					.el-icon {
						margin-left: 10px;
						color: #d9d9d9;
					}

					.el-icon:hover {
						color: #909090;
					}
				}

				.error-w {
					height: 20px;
				}

				.dialog-prompt {
					display: flex;
					align-items: flex-end;

					.el-icon {
						margin-right: 5px;
					}
				}

				.error {
					color: #f56c6c;
					.el-text {
						color: #f56c6c;
					}
				}

				.info {
					color: #e6a23c;
					.el-text {
						color: #e6a23c;
					}
				}
			}
		}
	}
}
// 下拉列表样式
.el-popper.el-tooltip {
	user-select: none;

	.dro-item {
		li {
			width: 80px;
			justify-content: space-between;
		}
	}
}

// 目录右键菜单
.el-popper.el-popover {
	padding: 0 !important;
	margin: 0 !important;
	.ft-menu-ul {
		.ft-delete {
			color: #f40;
		}

		.ft-menu-li {
			user-select: none;
			height: 35px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 12px;
		}

		.ft-menu-li:hover {
			background-color: #f0f0f0;
			cursor: pointer;

			.ft-select-text {
				display: flex;
				justify-content: space-between;
				width: 100%;
			}
		}

		.ft-menu-li:active {
			background-color: #d9d9d9;
		}
	}
}

// 公共样式
.text-12px {
	font-size: 12px;
}
// 禁止点击样式
.disabled {
	opacity: 0.7; /* 可选：让元素看起来变灰 */
	cursor: not-allowed; /* 可选：显示禁止光标 */
}
</style>
