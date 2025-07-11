import { defineStore } from 'pinia'
import pinyin from "pinyin"

export const useMenuStore = defineStore('Menu', {
    state: () => ({
        proxy: null,
        menu_lists: [],
        activaMenu: [],
        activaLevel: {},
        activaToData: []
    }),
    actions: {
        setMenu(value) { this.menu_lists = value },
        setActivaMenu(value) { this.activaMenu = value },
        setActivaLevel(value) { this.activaLevel = value },
        setactivaToData(value) { this.activaToData = value },
        uuidToAttrID(uuid) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(uuid)) return "Invalid AttrID format!"
            return uuid.split('-').map(part => part.slice(0, 2)).join('');
        },

        // 把当前选中项目的数据转换成py接收格式的数据
        activaToPrefix() {
            const activa = this.menu_lists.filter((list) => list.index == this.activaLevel.index)
            if (!activa.length) return console.log("数组长度为0") // 数据为空时退出
            const arr = []
            activa[0].children.forEach((el) => {
                el.datas.forEach((i) => {
                    const id = this.uuidToAttrID(i.id)
                    const r = []
                    if (i.isList) i.data.forEach((b) => {
                        if (b.value !== "add-image") r.push(b.value)
                    })
                    arr.push({
                        id: id,
                        type: i.type,
                        data: i.isList ? r : i.data,
                    })
                })
            })
            this.setactivaToData(arr)
        },

        /**
         * 读取图片为base64格式
         * @param {String} path 图片文件的绝对路径 
         * @returns {Promise<Object>} 返回一个 MIME 类型的图片
         */
        readImage(path) {
            return new Promise(async (resolve, reject) => {
                try {
                    const uint8 = await this.readFile(path)
                    resolve(await this.uint8ArrayToBase64(uint8))
                } catch (error) {
                    reject({ code: 1, msg: "Read Image ×", error })
                }
            })
        },

        /**
         * uint8Array转Base64格式
         * @param {Array} uint8Array 待转换的 uint8Array 数据
         * @returns {String}
         * ```javascript
         * const img = uint8ArrayToBase64(uint8Array)
         * console.log(img) //输出Base64的图片格式
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
         * 目录检查是存在/创建目录（支持递归创建）
         * @param {String} path 检查路径
         * @param {Boolean} [isCreate=false] 是否创建目录
         * @param {Object} [baseDir=Document] 根目录
         * @returns {Promise<Object>} 返回包含code和msg的对象
         */
        create_dir(path, isCreate = false, baseDir = this.proxy.$BaseDirectory.Document) {
            return new Promise(async (resolve, reject) => {
                try {
                    // 检查目录是否存在
                    const exists = await this.proxy.$exists(path, { baseDir: baseDir })
                    // 检查的路径/文件存在就返回结果
                    if (exists) return resolve({ code: 0, msg: "Directory already exists √" })
                    // 如果不用创建则直接返回检查结果
                    if (!isCreate) return resolve({ code: 1, msg: "Directory does not exist ×" })
                    // 递归创建目录
                    const parts = path.split("/").filter(Boolean)
                    let currentPath = ""
                    for (const part of parts) {
                        currentPath = currentPath ? `${currentPath}/${part}` : part
                        const exists = await this.proxy.$exists(currentPath, { baseDir: baseDir })
                        if (!exists) {
                            await this.proxy.$mkdir(currentPath, { baseDir: baseDir })
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
         * 读取文件为Uint8Array
         * @param {String} path 被读取的绝对文件路径
         * @returns {Promise<Object>}
         */
        readFile(path) {
            return new Promise((resolve, reject) => {
                try {
                    this.proxy.$readFile(path).then((contents) => resolve(contents))
                } catch (error) {
                    reject({ code: 1, msg: "Read failed ×", error })
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
        writeText(writePath, writeData, baseDir = this.proxy.$BaseDirectory.Document) {
            return new Promise((resolve, reject) => {
                try {
                    // 写入文件 这里的需要转字符串再写入
                    const writeRes = this.proxy.$writeTextFile(writePath, JSON.stringify(writeData), { baseDir: baseDir, encoding: "utf-8" })
                    // 写入成功 返回结果
                    if (writeRes) {
                        resolve({ code: 0, msg: "Write success √" })
                    } else {
                        reject({ code: 1, msg: "Write failed ×" })
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
        delFile(delPath, baseDir = this.proxy.$BaseDirectory.Document) {
            return new Promise((resolve, reject) => {
                try {
                    // 写入文件 这里的需要转字符串再写入
                    const remRes = this.proxy.$remove(delPath, { baseDir: baseDir })
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
                    const files = await this.proxy.$OpenFile({
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
        }
    }
})