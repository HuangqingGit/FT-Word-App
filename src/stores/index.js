import { defineStore } from 'pinia'

export const useMenuStore = defineStore('Menu', {
    state: () => ({
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
        activaToPrefix() {
            const activa = this.menu_lists.filter((list) => list.index == this.activaLevel.index)
            if (!activa.length) return console.log("数组长度为0") // 数据为空时退出
            const arr = []
            activa[0].children.forEach((el) => {
                el.datas.forEach((i) => {
                    const id = this.uuidToAttrID(i.id)
                    const r = []
                    if (i.isList) i.data.forEach((b) => r.push(b.value))
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
        }
    }
})