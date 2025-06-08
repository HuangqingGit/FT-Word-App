import sys
import json

if __name__ == "__main__":
    json_data = json.loads(sys.argv[1])  # 解析第一个参数（JSON 字符串）
    template_path = sys.argv[2]  # 获取第二个参数（模板路径）

    print(json.dumps(json_data))


# 确保脚本正常退出
sys.exit(0)
