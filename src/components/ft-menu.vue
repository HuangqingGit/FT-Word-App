<template>
	<div class="ft-menu">
		<!-- 目录右键菜单-Start -->
		<el-popover ref="ftPopover" :show-arrow="false" :hide-after="0" :offset="0" width="100" transition="none" trigger="hover" placement="right-start" @hide="onMenuShow = false">
			<ul class="ft-menu-ul">
				<li class="ft-menu-li" v-show="isExport" @click="menu_options_event('export')">
					<span class="ft-select-text">导出配置</span>
					<el-icon class="ft-select-icon"><ft-ep-Position /></el-icon>
				</li>
				<li class="ft-menu-li" @click="menu_options_event('rename')">
					<span class="ft-select-text">重命名</span>
					<el-icon class="ft-select-icon"><ft-ep-EditPen /></el-icon>
				</li>
				<li class="ft-menu-li ft-delete" @click="menu_options_event('delete')">
					<span class="ft-select-text">删除</span>
					<el-icon class="ft-select-icon"><ft-ep-Delete /></el-icon>
				</li>
			</ul>
			<template #reference>
				<div id="on-menu" class="on-menu" v-show="onMenuShow"></div>
			</template>
		</el-popover>
		<!-- 目录右键菜单-End -->

		<!-- Header-Menu -->
		<div class="el-aside-header">
			<!--目录header Tooltip 悬浮窗 -->
			<el-tooltip :visible="isTipShow" :virtual-ref="triggerDom" virtual-triggering :enterable="false">
				<template #content>
					<span>{{ tooltipText }}</span>
				</template>
			</el-tooltip>
			<el-icon @mouseleave="removTooltip" @mouseenter="triggerTooltip($event, '创建分类')"><ft-ep-DocumentAdd /></el-icon>
			<el-dropdown placement="bottom-start" trigger="hover">
				<span class="el-dropdown" @click="stopTooltipShow">
					<el-icon @mouseleave="removTooltip" @mouseenter="triggerTooltip($event, '新建项目')"><ft-ep-FolderAdd /></el-icon>
				</span>
				<template #dropdown>
					<el-dropdown-menu class="dro-item">
						<el-dropdown-item>
							<ft-ep-plus />
							<span>新建项目</span>
						</el-dropdown-item>
						<el-dropdown-item @click="importProject">
							<ft-ep-document />
							<span>导入项目</span>
						</el-dropdown-item>
					</el-dropdown-menu>
				</template>
			</el-dropdown>
			<el-icon @mouseleave="removTooltip" @mouseenter="triggerTooltip($event, '刷新目录')" @click="get_project_list"><ft-ep-RefreshRight /></el-icon>
			<el-icon @mouseleave="removTooltip" @mouseenter="triggerTooltip($event, '折叠所有项目')" @click="closeAllMenu"><ft-ep-Files /></el-icon>
		</div>
		<!-- Menu-目录 -->
		<el-scrollbar>
			<el-menu class="el-menu-vertical" ref="ftElMenu" :default-openeds="curOpeneds" :default-active="curActive" @select="menuClick">
				<el-sub-menu @contextmenu="onContext($event, [index])" :index="item.index.toString()" v-for="(item, index) in menuList" :key="index">
					<template #title>
						<span>{{ item.name }}</span>
					</template>
					<el-menu-item @contextmenu="onContext($event, [index, childIndex])" :index="item.index + '-' + childIndex" v-for="(child, childIndex) in item.children" :key="childIndex">{{
						child.name
					}}</el-menu-item>
				</el-sub-menu>
			</el-menu>
		</el-scrollbar>
	</div>
</template>

<script>
import { ElMessageBox, ElMessage, ElLoading } from "element-plus"
export default {
	name: "ft-menu",
	data() {
		return {
			triggerDom: null, // 当前触发 Tooltip 的元素
			hideTooltip: null, // 隐藏 Tooltip 计时器
			showTooltip: null, // 显示 Tooltip 计时器
			tooltipText: null, // Tooltip 显示的文本
			isTipShow: false, // Tooltip 的可见性

			dirPath: "f-tone", // 本地数据缓存路径
			isExport: false, // 是否显示导出选项
			onMenuShow: false, // 是否显示右键菜单栏

			curMenuIndex: [], // 当前选中菜单所有
			curOpeneds: [], // 打开的菜单列表
			curActive: window.sessionStorage.getItem("curActive"), // 当前激活的菜单
			menuList: [], // 菜单目录列表
		}
	},
	mounted() {
		// 启动时获取项目列表
		this.get_project_list()
	},
	methods: {
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
										this.get_project_list()
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

		// 菜单选中事件
		menuClick(e) {
			window.sessionStorage.setItem("curActive", e)
		},

		// 获取项目列表
		get_project_list() {
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
		 * Tooltip 移入触发事件
		 * @param {Object} e 鼠标事件
		 * @param {String} text Tooltip 提示文本
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
		 */
		onContext(e, index) {
			e.preventDefault() // 阻止默认事件
			e.stopPropagation() // 阻止冒泡事件
			// 右键菜单事件处理
			this.curMenuIndex = index
			// 三目运算判断是否显示导出数据选项
			index.length > 1 ? (this.isExport = false) : (this.isExport = true)
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
		 */
		validateName(name) {
			// 定义允许的特殊符号
			const allowedSymbols = "（）()【】-+_"
			// 检查长度
			if (name.length < 2 || name.length > 8) {
				return "名称应控制在2-8位之间"
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
		 * @returns {Null}
		 * @example
		 */
		menu_options_event(re_type) {
			this.$refs.ftPopover?.hide() // 隐藏Popover
			let index = this.curMenuIndex // 当前右键选项的indexs
			let fileName = `${this.dirPath}/${this.menuList[index[0]].fileName}` // 获取当前选择项目的文件名
			let name1 = this.menuList[index[0]].name // 获取选择项目的名称
			if (index.length > 1) {
				let name2 = this.menuList[index[0]].children[index[1]].name // 获取选中分类的名称
				// 分类操作
				switch (re_type) {
					// 删除分类
					case "delete":
						ElMessageBox.confirm("该操作将永久删除该分类，确定继续吗？", {
							title: `${name1} · ${name2}`,
							confirmButtonText: "确认",
							cancelButtonText: "取消",
							showClose: false,
							type: "warning",
						})
							.then(() => {
								this.menuList[index[0]].children.splice(index[1], 1)
								this.writeText(fileName, this.menuList[index[0]])
								ElMessage({ type: "success", message: "成功", plain: true, offset: 85, grouping: true })
							})
							.catch(() => {})

						break
					// 重命名分类
					case "rename":
						ElMessageBox.prompt("请输入新的分类名称", {
							title: `${name1} · ${name2}`,
							confirmButtonText: "确认",
							cancelButtonText: "取消",
							showClose: false,
							inputValue: name2,
							inputValidator: this.validateName,
						})
							.then((value) => {
								if (value !== "cancel") {
									this.menuList[index[0]].children[index[1]].name = value.value
									this.writeText(fileName, this.menuList[index[0]])
								}
							})
							.catch(() => {})
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
								ElMessage({ type: "success", message: "成功", plain: true, offset: 85, grouping: true })
							})
							.catch(() => {})
						break
					// 重命名项目
					case "rename":
						ElMessageBox.prompt("请输入新的项目名称", {
							title: name1,
							confirmButtonText: "确认",
							cancelButtonText: "取消",
							showClose: false,
							inputValue: name1,
							inputValidator: this.validateName,
						})
							.then((value) => {
								if (value !== "cancel") {
									this.menuList[index[0]].name = value.value
									this.writeText(fileName, this.menuList[index[0]])
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

	.el-menu-vertical {
		border-right: 0px;
	}
}
// 下拉列表样式
.el-popper.el-tooltip {
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
</style>
