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
			<el-icon @mouseleave="removTooltip" @mouseenter="triggerTooltip($event, '创建分类')" @click="createClass"><ft-ep-DocumentAdd /></el-icon>
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
		<el-scrollbar>
			<el-menu class="el-menu-vertical" ref="ftElMenu" :default-openeds="curOpeneds" :default-active="curActive" @select="curActive = $event">
				<el-sub-menu @contextmenu="onContext($event, [index])" :index="item.index.toString()" v-for="(item, index) in menuList" :key="index">
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
				<el-avatar shape="square" :size="65" @click="addProjectImg" :src="projectImgBase64" v-if="projectImgBase64" />
				<el-icon v-if="!projectImgBase64" @click="addProjectImg"><ft-ep-Plus /></el-icon>
				<span class="text">项目图标</span>
				<span class="text-12px">建议尺寸≤500*500</span>
			</div>
			<div class="right">
				<div class="dialog-content-item">
					<span class="item-name">项目名称</span>
					<el-input v-model="projectName" style="flex: 1" minlength="2" maxlength="8" placeholder="输入2-8个字符" show-word-limit clearable type="text" />
				</div>
				<div class="error-w">
					<transition name="el-zoom-in-top">
						<div class="dialog-prompt error" v-if="isErrorText">
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

<script>
import { ElMessageBox, ElMessage, ElLoading } from "element-plus"
import pinyin from "pinyin"
export default {
	name: "ft-menu",
	data() {
		return {
			isShowDialog: false, // 是否显示弹窗
			isErrorText: false, // 项目名称错误提示
			isClickConfirm: true, // 是否禁止点击确认键
			isEditPrefix: true, // 是否允许编辑项目前缀
			projectImgBase64: null, // 项目头像的Base64
			dialogText: null, // 错误提示
			projectName: null, // 新建项目输入Value
			projectPrefix: null, // 新建项目前缀

			triggerDom: null, // 当前触发 Tooltip 的元素
			hideTooltip: null, // 隐藏 Tooltip 计时器
			showTooltip: null, // 显示 Tooltip 计时器
			tooltipText: null, // Tooltip 显示的文本
			isTipShow: false, // Tooltip 的可见性

			dirPath: "f-tone", // 本地数据缓存路径
			isExport: false, // 是否显示导出选项
			onMenuShow: false, // 是否显示右键菜单栏

			isDisableDel: false, // 是否禁用删除选项
			formerName: null, // 子菜单的曾用名
			parentIndex: null, // 选中的父级菜单索引
			curMenuIndex: [], // 当前选中菜单索引
			curOpeneds: [], // 打开的菜单列表
			curActive: window.sessionStorage.getItem("curActive"), // 当前激活的菜单
			menuList: [], // 菜单目录列表
		}
	},
	watch: {
		// 新建项目输入Value 变化监听事件
		projectName(newVal) {
			let valiValue = this.validateName(newVal)
			if (typeof valiValue === "string") {
				this.isErrorText = true
				this.isClickConfirm = true
				this.dialogText = valiValue
			} else {
				this.isErrorText = false
				this.isClickConfirm = false
				if (!this.isEditPrefix) return // 如果为编辑模式则直接退出，不修改项目前缀
				this.projectPrefix = this.getFirstLetter(newVal)
			}
		},
		// 当前选中菜单变化监听事件
		curActive(newVal) {
			window.sessionStorage.setItem("curActive", newVal)
		},
	},
	mounted() {
		// 启动时获取项目列表
		this.getProjectList()
	},
	methods: {
		// 创建项目分类
		createClass() {
			// 如果sessionStorage中不存在Active值，则默认选择第一项进行添加
			if (window.sessionStorage.getItem("curActive") === null) this.curActive = `${this.menuList[0].index}-0`
			// 获取当前激活目录的索引
			const curActiveMenu = this.curActive.split("-")
			// 获取当前激活的目录对象
			const curMenu = this.menuList.find((item) => item.index == curActiveMenu[0])
			// 设置曾用名
			this.formerName = "新建分类"
			// 插入数据
			curMenu.children.unshift({ name: this.formerName, datas: [], isEdit: true })
			// 设置原来选中的激活对象
			this.curActive = `${curActiveMenu[0]}-${Number(curActiveMenu[1]) + 1}`
			// 10ms后选中Input中的内容
			setTimeout(() => this.$refs[`${curActiveMenu[0]}-0`][0].select(), 10)
		},

		// dialog 关闭事件
		closeDialogEvent() {
			this.projectName = null
			this.projectImgBase64 = null
			this.isEditPrefix = true
		},
		// 添加头像点击事件
		addProjectImg() {
			this.openFileSelect(false, false, [{ name: "Image", extensions: ["png", "jpg", "jpeg", "bmp", "webp", "icon", "ico", "gif"] }]).then((img) => {
				// 取消选择时，直接退出
				if (img === null) return
				this.$readFile(img).then((contents) => {
					this.projectImgBase64 = this.uint8ArrayToBase64(contents)
				})
			})
		},

		// 创建|编辑项目
		createProject() {
			// 创建模式
			if (this.isEditPrefix) {
				const proIndex = Date.now()
				const newObject = {
					name: this.projectName,
					prefix: this.projectPrefix,
					icon: this.projectImgBase64,
					index: proIndex,
					isEdit: false,
					children: [{ name: "默认分类", datas: [] }],
				}
				this.writeText(`${this.dirPath}/${proIndex}.json`, newObject)
				this.isShowDialog = false
				ElMessage({ type: "success", message: "创建成功", plain: true, offset: 85, grouping: true })
				this.getProjectList() // 刷新目录
			}
			// 编辑模式
			else {
				let curData = this.menuList[this.curMenuIndex[0]] // 获取当前选中的数据
				let fileName = curData.fileName // 获取当前文件名
				curData.name = this.projectName // 赋值新的项目名称
				curData.icon = this.projectImgBase64 // 赋值新的头像Base64
				this.writeText(`${this.dirPath}/${fileName}`, curData) // 写入数据
				this.isShowDialog = false // 关闭弹窗
				ElMessage({ type: "success", message: "编辑成功", plain: true, offset: 85, grouping: true })
			}
		},

		// 项目导入
		importProject() {
			// 筛选器配置
			const options = [
				{
					name: "JSON源文件",
					extensions: ["json"],
				},
			]
			// 打开文件选择框
			this.openFileSelect(false, false, options)
				.then((res) => {
					// 选取结果不能为null，为null代表用户取消选择
					if (res !== null) {
						// 读取文件数据流
						this.$readFile(res).then((text) => {
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
										this.writeText(`${this.dirPath}/${proIndex}.json`, content)
										ElMessage({ type: "success", message: "导入成功", plain: true, offset: 85, grouping: true })
										// 刷新列表
										this.getProjectList()
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
		},

		// 折叠所有项目
		closeAllMenu() {
			this.stopTooltipShow()
			this.menuList.forEach((item) => {
				this.$refs.ftElMenu?.close(item.index.toString())
			})
		},

		// Tooltip 移出触发事件
		removTooltip() {
			if (this.isTipShow) {
				this.hideTooltip = setTimeout(() => {
					this.isTipShow = false
				}, 200)
			} else {
				clearInterval(this.showTooltip)
			}
		},

		// 停止 Tooltip 的所有动作
		stopTooltipShow() {
			this.isTipShow = false
			clearInterval(this.hideTooltip)
			clearInterval(this.showTooltip)
		},

		// 获取项目列表
		getProjectList() {
			this.stopTooltipShow()
			this.create_dir(this.dirPath, true).then((res) => {
				if (!res.code) {
					// 清空菜单列表
					this.menuList = []
					// 检查目录是否存在，如果不存在则创建
					this.$readDir(this.dirPath, { baseDir: this.$BaseDirectory.Document })
						.then((files) => {
							// 存储所有文件读取的 Promise
							const fileReadPromises = files
								.filter((file) => file.isFile && file.name.toLowerCase().endsWith(".json"))
								.map((file) => {
									return this.$readFile(`${this.dirPath}/${file.name}`, {
										baseDir: this.$BaseDirectory.Document,
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
									this.menuList = validContents.sort((a, b) => b.index - a.index)
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
		},

		/**
		 * 子菜单双击事件
		 * @param {Object} item 当前操作的菜单对象
		 * @param {Number} index 当前操作的菜单索引
		 * @returns {Null} 无返回值
		 */
		dblclick(item, index) {
			// 激活当前选中菜单
			this.curActive = index
			// 触发编辑状态
			item.isEdit = true
			// 保存曾用名
			this.formerName = item.name
			// 10ms后选中Input中的内容
			setTimeout(() => this.$refs[index][0].select(), 10)
		},

		/**
		 * 子菜单input失去光标事件
		 * @param {String} name 当前输入的名称
		 * @param {Object} item 当前操作的菜单对象
		 * @param {Number} index 当前操作的菜单索引
		 * @returns {Null} 无返回值
		 */
		blurClass(name, item, index) {
			let fileName = `${this.dirPath}/${item.fileName}` // 获取当前选择项目的文件名
			item.children[index].isEdit = false
			const verRes = this.validateName(name)
			// 格式校验不通过
			if (typeof verRes === "string") {
				// 提示错误信息
				ElMessage({ type: "warning", message: `分类名称不符合命名规范：${verRes}`, plain: true, offset: 85, grouping: true })
				// 刷新菜单列表
				item.children[index].name = this.formerName
			}
			// 写入文件
			this.writeText(fileName, item)
		},

		/**
		 * 获取文本首字母
		 * @param {String} str 需要获取首字母的字符串
		 * @returns {String}
		 * ```javascript
		 * let res = getFirstLetter("获取首字母")
		 * console.log(res) // 输出：HQSZM
		 * ```
		 */
		getFirstLetter(str) {
			if (!str) return ""
			const result = pinyin(str, {
				style: pinyin.STYLE_FIRST_LETTER, // 只获取首字母
				heteronym: false, // 不启用多音字模式
			})
			return result.map((arr) => arr[0].charAt(0).toUpperCase()).join("")
		},

		/**
		 * uint8Array转Base64格式
		 * @param {Array} uint8Array 待转换的 uint8Array 数据
		 * @returns {String}
		 * ```javascript
		 * const img = uint8ArrayToBase64(uint8Array)
		 * //输出Base64的图片格式
		 * console.log(img)
		 * ```
		 */
		uint8ArrayToBase64(uint8Array) {
			let binary = ""
			const bytes = new Uint8Array(uint8Array)
			const len = bytes.byteLength
			for (let i = 0; i < len; i++) {
				binary += String.fromCharCode(bytes[i])
			}
			return "data:image/jpeg;base64," + btoa(binary) // 替换为正确的 MIME 类型
		},

		/**
		 * Tooltip 移入触发事件
		 * @param {Object} e 鼠标事件
		 * @param {String} text Tooltip 提示文本
		 * @returns {Null} 无返回值
		 */
		triggerTooltip(e, text) {
			clearInterval(this.showTooltip)
			this.triggerDom = e.currentTarget
			this.tooltipText = text
			if (!this.isTipShow) {
				this.showTooltip = setTimeout(() => {
					this.isTipShow = true
				}, 600)
			} else {
				clearInterval(this.hideTooltip)
			}
		},

		/**
		 * 菜单栏右键处理事件
		 * @param {Object} e 鼠标事件
		 * @param {Array} index 索引下标
		 * @param {Number} itemIndex 父级菜单的index属性
		 * @returns {Null} 无返回值
		 */
		onContext(e, index, itemIndex) {
			e.preventDefault() // 阻止默认事件
			e.stopPropagation() // 阻止冒泡事件
			// 判断当前触发右键属性的菜单是一级目录还是二级目录
			this.isDisableDel = index.length > 1 && this.menuList[index[0]].children.length <= 1 ? true : false
			// 判断是否需要显示导出数据选项
			index.length > 1 ? (this.isExport = false) : (this.isExport = true)
			// 右键菜单父级菜单Index索引
			this.parentIndex = itemIndex
			// 右键菜单索引
			this.curMenuIndex = index
			// 获取dom节点
			const element = document.getElementById("on-menu")
			// 显示依附的dom节点
			this.onMenuShow = true
			element.dispatchEvent(new MouseEvent("mouseenter"))
			element.style.top = `${e.clientY - 5}px`
			element.style.left = `${e.clientX - 5}px`
		},

		/**
		 * 项目/分类改名正则表达式
		 * @param name Input中的文本
		 * @returns {Boolean|String}
		 * ```javascript
		 * const res = validateName(name)
		 * // 输出结果
		 * console.log(res)
		 * ```
		 */
		validateName(name) {
			// 定义允许的特殊符号
			const allowedSymbols = "（）()【】-+_"
			// 传递参数为null返回False
			if (name === null) return false
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
			return true
		},

		/**
		 * 右键菜单选项响应事件
		 * @param {String} re_type 响应事件类型
		 * @returns {Null} 无返回值
		 */
		menuOptionsEvent(re_type) {
			this.$refs.ftPopover?.hide() // 隐藏Popover
			let index = this.curMenuIndex // 当前右键选项的indexs
			let curActiveIndex = this.curActive.split("-") // 分割当前激活的菜单索引
			let projectData = this.menuList[index[0]] // 获取当前选中项目的Data对象
			let fileName = `${this.dirPath}/${projectData.fileName}` // 获取当前选择项目的文件名
			let name1 = projectData.name // 获取选择项目的名称

			if (index.length > 1) {
				let name2 = projectData.children[index[1]].name // 获取选中分类的名称
				// 分类操作
				switch (re_type) {
					// 删除分类
					case "delete":
						if (this.isDisableDel) {
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
									this.writeText(fileName, projectData)
									ElMessage({ type: "success", message: "删除成功", plain: true, offset: 85, grouping: true })
									// 获取当前对象长度
									let delLength = projectData.children.length
									// 当前操作删除的一级菜单索引等于对应当前激活的一级菜单索引时
									if ((projectData.index == curActiveIndex[0] && index[1] == curActiveIndex[1] && index[1] == delLength) || index[1] < curActiveIndex[1]) {
										this.curActive = `${curActiveIndex[0]}-${curActiveIndex[1] - 1}`
									}
								})
								.catch(() => {})
						}
						break
					// 重命名分类
					case "rename":
						this.dblclick(this.menuList[index[0]].children[index[1]], `${this.parentIndex}-${index[1]}`)
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
								this.delFile(fileName)
								this.menuList.splice(index[0], 1)
								ElMessage({ type: "success", message: "删除成功", plain: true, offset: 85, grouping: true })
								// 删除项目后，如果被删除的一级目录是被激活的目录，则清理sessionStorage中缓存的数据
								if (curActiveIndex[0] == projectData.index) window.sessionStorage.removeItem("curActive")
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
									let newObj = JSON.parse(JSON.stringify(this.menuList[index[0]]))
									delete newObj.fileName
									const exp = await this.writeText(`${name1}.json`, newObj, this.$BaseDirectory.Desktop)
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
						this.projectImgBase64 = projectData.icon
						this.projectName = projectData.name
						this.projectPrefix = projectData.prefix
						this.isEditPrefix = false
						this.isShowDialog = true
						// 由于事件监听原因会动态刷新Confirm可点击状态，所以延迟10ms将Confirm按键设为不可点击状态，如用户没有修改项目则减少不必要的文件写入操作
						setTimeout(() => (this.isClickConfirm = true), 10)
						break
				}
			}
		},

		/**
		 * 目录检查是存在/创建目录（支持递归创建）
		 * @param {String} path 检查路径
		 * @param {Boolean} [isCreate=false] 是否创建目录
		 * @param {Object} [baseDir=Document] 根目录
		 * @returns {Promise<Object>} 返回包含code和msg的对象
		 */
		create_dir(path, isCreate = false, baseDir = this.$BaseDirectory.Document) {
			let th = this
			return new Promise(async (resolve, reject) => {
				try {
					// 检查目录是否存在
					const exists = await th.$exists(path, { baseDir: baseDir })
					// 检查的路径/文件存在就返回结果
					if (exists) return resolve({ code: 0, msg: "Directory already exists √" })
					// 如果不用创建则直接返回检查结果
					if (!isCreate) return resolve({ code: 1, msg: "Directory does not exist ×" })
					// 递归创建目录
					const parts = path.split("/").filter(Boolean)
					let currentPath = ""
					for (const part of parts) {
						currentPath = currentPath ? `${currentPath}/${part}` : part
						const exists = await th.$exists(currentPath, { baseDir: baseDir })
						if (!exists) {
							await th.$mkdir(currentPath, { baseDir: baseDir })
						}
					}

					resolve({ code: 0, msg: "Directory created successfully √" })
				} catch (error) {
					reject({
						code: 1,
						msg: "Failed to create directory ×",
						error,
					})
				}
			})
		},

		/**
		 * 写入文件
		 * @param {String} writePath 写入路径
		 * @param {Object} writeData 项目数据
		 * @param {Object} [baseDir=Documet] 项目数据
		 * @returns {Promise<Object>}
		 */
		writeText(writePath, writeData, baseDir = this.$BaseDirectory.Document) {
			return new Promise((resolve, reject) => {
				try {
					// 写入文件 这里的需要转字符串再写入
					const writeRes = this.$writeTextFile(writePath, JSON.stringify(writeData), { baseDir: baseDir, encoding: "utf-8" })
					// 写入成功 返回结果
					if (writeRes) {
						resolve({ code: 0, msg: "Write success √" })
					} else {
						reject({ code: 1, msg: "Write failed ×", error })
					}
				} catch (error) {
					reject({ code: 1, msg: "Write failed ×", error })
				}
			})
		},

		/**
		 * 删除文件
		 * @param {String} delPath 删除路径
		 * @param {Object} [baseDir=Documet] 项目数据
		 * @returns {Promise<Object>}
		 */
		delFile(delPath, baseDir = this.$BaseDirectory.Document) {
			return new Promise((resolve, reject) => {
				try {
					// 写入文件 这里的需要转字符串再写入
					const remRes = this.$remove(delPath, { baseDir: baseDir })
					// 删除成功 返回结果
					if (remRes) resolve({ code: 0, msg: "Delete success √" })
				} catch (error) {
					reject({ code: 1, msg: "Delete failed ×", error })
				}
			})
		},

		/**
		 * 打开文件选择对话框
		 * @param {Boolean} [isMultiple=false] 是否允许多选
		 * @param {Boolean} [isDir=false] 是否选择目录
		 * @param {Options} [options=[]] 文件筛选配置
		 * @returns {Promise<String>}
		 * @example
		 * ```javascript
		 * const filesPath = openFileSelect(false, false, [{
		 *     name: "筛选器名称",
		 *     extensions: ['png','svg','jpg'],
		 * }])
		 *
		 * console.log(filesPath)
		 * ```
		 */
		openFileSelect(isMultiple = false, isDir = false, options = []) {
			return new Promise(async (resolve, reject) => {
				try {
					const files = await this.$OpenFile({
						multiple: isMultiple,
						directory: isDir,
						filters: options,
					})
					resolve(files)
				} catch (error) {
					reject(error)
				}
			})
		},
	},
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

	.el-scrollbar {
		.el-menu {
			.is-active {
				--el-menu-active-color: #409eff;
				background-color: #f0f0f0;
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

				.el-icon {
					width: 65px;
					height: 65px;
					border-radius: 5px;
					background-color: #d9d9d9;
					font-size: 30px;
					color: #ffffff;
				}

				.el-avatar {
					margin: auto;
				}

				.text {
					margin-top: 5px;
				}

				.el-icon:hover {
					font-size: 35px;
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
