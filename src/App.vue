<template>
	<el-container style="height: 100%">
		<el-header><ft-title /></el-header>
		<el-container class="main-container">
			<!-- 目录右键菜单-Start -->
			<el-popover ref="ftPopover" :show-arrow="false" :hide-after="0" :offset="0" width="100" transition="none" trigger="hover" placement="right-start" @hide="on_menu_show = false">
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
					<div id="on-menu" class="on-menu" v-show="on_menu_show"></div>
				</template>
			</el-popover>
			<!-- 目录右键菜单-End -->

			<el-aside width="200px">
				<div class="el-aside-header">
					<el-tooltip class="box-item" effect="dark" content="新建分类" placement="bottom" :show-after="500" :hide-after="0" :enterable="false">
						<el-icon><ft-ep-DocumentAdd /></el-icon>
					</el-tooltip>
					<el-tooltip class="box-item" effect="dark" content="新建项目" placement="bottom" :show-after="500" :hide-after="0" :enterable="false">
						<el-icon><ft-ep-FolderAdd /></el-icon>
					</el-tooltip>
					<el-tooltip class="box-item" effect="dark" content="刷新目录" placement="bottom" :show-after="500" :hide-after="0" :enterable="false">
						<el-icon @click="get_project_list"><ft-ep-RefreshRight /></el-icon>
					</el-tooltip>
					<el-tooltip class="box-item" effect="dark" content="折叠所有项目" placement="bottom" :show-after="500" :hide-after="0" :enterable="false">
						<el-icon @click="closeAllMenu"><ft-ep-Files /></el-icon>
					</el-tooltip>
				</div>
				<el-scrollbar>
					<el-menu :default-openeds="openeds" class="el-menu-vertical" ref="ftElMenu">
						<el-sub-menu @contextmenu="onContext($event, [index])" :index="index.toString()" v-for="(item, index) in menu_list" :key="index" @click="menuClick">
							<template #title>
								<span>{{ item.P_name }}</span>
							</template>
							<el-menu-item @contextmenu="onContext($event, [index, childIndex])" :index="index + '-' + childIndex" v-for="(child, childIndex) in item.children" :key="childIndex">{{
								child.name
							}}</el-menu-item>
						</el-sub-menu>
					</el-menu>
				</el-scrollbar>
			</el-aside>
			<el-main>
				<el-button @click="get_project_list">Python</el-button>
			</el-main>
		</el-container>
	</el-container>
</template>

<script>
export default {
	name: "App",
	data() {
		return {
			dirPath: "f-tone", // 本地数据缓存路径
			isExport: false, // 是否显示导出选项
			on_menu_show: false, // 是否显示右键菜单栏
			cur_menu_index: [], // 当前选中菜单所有
			openeds: ["0"], // 打开的菜单列表
			params: {
				template_path: "C:/Users/Github/Desktop/cs.docx",
				data: {
					name: "ft",
					age: 18,
					num: 100,
				},
			},
			menu_list: [],
		}
	},
	mounted() {
		// 启动时获取项目列表
		this.get_project_list()
	},
	methods: {
		menuClick(e) {
			console.log(e)
		},

		// 折叠所有项目
		closeAllMenu() {
			this.menu_list.forEach((_, index) => {
				this.$refs.ftElMenu?.close(index.toString())
			})
		},

		/**
		 * 菜单栏右键处理事件
		 * @param e 鼠标事件
		 * @param index 索引下标
		 */
		onContext(e, index) {
			e.preventDefault() // 阻止默认事件
			e.stopPropagation() // 阻止冒泡事件
			// 右键菜单事件处理
			this.cur_menu_index = index
			// 三目运算判断是否显示导出数据选项
			index.length > 1 ? (this.isExport = false) : (this.isExport = true)
			// 获取dom节点
			const element = document.getElementById("on-menu")
			// 显示依附的dom节点
			this.on_menu_show = true
			element.dispatchEvent(new MouseEvent("mouseenter"))
			element.style.top = `${e.clientY - 5}px`
			element.style.left = `${e.clientX - 5}px`
		},

		// 调用后台Rust服务运行Python
		run_py() {
			this.$invoke("run_python", { params: this.params })
				.then((result) => {
					console.log(JSON.parse(result))
				})
				.catch((error) => {
					console.error(error)
				})
		},

		/**
		 * 右键菜单选项响应事件
		 * @param {String} re_type 响应事件类型
		 * @returns {Null}
		 */
		menu_options_event(re_type) {
			this.$refs.ftPopover?.hide()
			let index = this.cur_menu_index
			let fileName = `${this.dirPath}/${this.menu_list[index[0]].F_name}`
			if (index.length > 1) {
				// 分类操作
				switch (re_type) {
					case "delete":
						this.menu_list[index[0]].children.splice(index[1], 1)
						this.writeText(fileName, this.menu_list[index[0]])
						break
					case "rename":
						break
				}
			} else {
				// 项目操作
				switch (re_type) {
					// 删除
					case "delete":
						this.delFile(fileName)
						this.menu_list.splice(index[0], 1)
						break
					// 重命名
					case "rename":
						break
					// 导出项目
					case "export":
						break
				}
			}
		},

		/**
		 * 获取项目列表
		 */
		get_project_list() {
			// 清空菜单列表
			this.menu_list = []
			// 检查目录是否存在，如果不存在则创建
			this.$readDir(this.dirPath, { baseDir: this.$BaseDirectory.Document })
				.then((files) => {
					if (files.length === 0) {
						console.log("目录为空")
						return
					}

					// 处理文件列表，假设每个文件名是 "项目名称.js"
					files.forEach((file) => {
						this.$readFile(this.dirPath + "/" + file.name, { baseDir: this.$BaseDirectory.Document })
							.then((u8Array) => {
								let content = JSON.parse(new TextDecoder("utf-8").decode(u8Array)) // Uint8Array 转换为json数据
								content.F_name = file.name // 添加文件名到内容中
								this.menu_list.push(content) // 将项目名称和子项添加到菜单列表
							})
							.catch((error) => {
								console.error("读取文件失败:", error)
							})
					})
				})
				.catch((error) => {
					console.error("Error reading project list:", error)
				})
		},

		/**
		 * 目录检查是存在/创建目录
		 * @param {String} path 检查路径
		 * @param {Boolean} [isCreate=false] 是否创建目录
		 * @returns {Promise<Boolean>} true/false
		 */
		create_dir(path, isCreate = false) {
			let th = this
			return new Promise((resolve, reject) => {
				// 检查目录是否存在，如果不存在则创建
				th.$exists(path, { baseDir: th.$BaseDirectory.Document })
					.then((exists) => {
						if (!exists && isCreate) {
							th.$mkdir(path, { baseDir: th.$BaseDirectory.Document })
								.then(() => {
									resolve(true)
								})
								.catch((error) => {
									// 创建目录时出错
									reject(error)
								})
						} else {
							// 返回检查结果
							resolve(exists)
						}
					})
					.catch((error) => {
						// 检查目录时出错
						reject(error)
					})
			})
		},

		/**
		 * 写入文件
		 * @param {String} writePath 写入路径
		 * @param {Object} writeData 项目数据
		 * @returns {Promise<Object>}
		 */
		writeText(writePath, writeData) {
			let th = this
			return new Promise((resolve, reject) => {
				// 写入文件 这里的需要转字符串再写入
				th.$writeTextFile(writePath, JSON.stringify(writeData), { baseDir: th.$BaseDirectory.Document, encoding: "utf-8" })
					.then(() => {
						resolve({ code: 0, msg: "Write success √" })
					})
					.catch((error) => {
						reject({ code: 1, msg: "Write failed ×", error })
					})
			})
		},

		/**
		 * 删除文件
		 * @param {String} delPath 删除路径
		 * @returns {Promise<Object>}
		 */
		delFile(delPath) {
			let th = this
			return new Promise((resolve, reject) => {
				// 写入文件 这里的需要转字符串再写入
				th.$remove(delPath, { baseDir: th.$BaseDirectory.Document })
					.then(() => {
						resolve({ code: 0, msg: "Delete success √" })
					})
					.catch((error) => {
						reject({ code: 1, msg: "Delete failed ×", error })
					})
			})
		},
	},
}
</script>

<style lang="less">
* {
	margin: 0;
	padding: 0;
}

.el-popover.el-popper {
	padding: 0;
	margin: 0;
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
				justify-content: space-between; /* 平均分布 */
				width: 100%;
			}
		}
		.ft-menu-li:active {
			background-color: #d9d9d9;
		}
	}
}

#app {
	height: 100vh;
	background-color: #f2f6fc;
	.el-header {
		padding: 0 0;
		margin: 0 0;
		height: 40px;
	}

	.main-container {
		height: calc(100% - 40px);

		.on-menu {
			position: fixed;
			width: 5px;
			height: 20px;
			z-index: 1;
		}

		.el-aside {
			margin-top: 4px;
			margin-right: 2px;
			background-color: #ffffff;
			border-radius: 5px;
			display: flex;
			flex-direction: column;
			user-select: none;

			.el-aside-header {
				height: 35px;
				display: flex;
				padding: 0 5px;
				align-items: center;
				justify-content: space-around;
				justify-items: center;

				.el-icon {
					padding: 5px;
					border-radius: 3px;
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
		.el-main {
			margin-top: 4px;
			margin-left: 2px;
			background-color: #ffffff;
			border-radius: 5px;
		}
	}
}
</style>
