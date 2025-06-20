import json
import os
from docxtpl import DocxTemplate, InlineImage
from pathlib import Path
from docx.shared import Mm

def is_image_file(path):
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'}
    return Path(path).suffix.lower() in image_extensions

def process_value(doc, value):
    if isinstance(value, str) and os.path.exists(value) and is_image_file(value):
        return InlineImage(doc, value, width=Mm(50))
    return value

def process_template(json_data, template_path, output_dir):
    try:
        doc = DocxTemplate(template_path)
        
        processed_data = {}
        for key, value in json_data.items():
            if isinstance(value, dict):
                processed_data[key] = {k: process_value(doc, v) for k, v in value.items()}
            elif isinstance(value, list):
                processed_data[key] = [process_value(doc, v) for v in value]
            else:
                processed_data[key] = process_value(doc, value)
        
        doc.render(processed_data)
        output_path = output_dir / Path(template_path).name
        doc.save(output_path)
        print(f"成功生成: {output_path}")
    except Exception as e:
        print(f"处理文件 {template_path} 时出错: {str(e)}")

def process_templates(json_data, template_path):
    template_path = Path(template_path)
    output_dir = template_path.parent / "out"
    output_dir.mkdir(exist_ok=True)
    
    if template_path.is_dir():
        for file in template_path.glob("*.docx"):
            process_template(json_data, file, output_dir)
    elif template_path.is_file() and template_path.suffix.lower() == ".docx":
        process_template(json_data, template_path, output_dir)
    else:
        raise ValueError("路径必须是 .docx 文件或包含 .docx 文件的文件夹")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 3:
        print("用法: python script.py <json_data> <template_path>")
        print("示例: python script.py '{\"image\":\"C:/path/to/image.jpg\"}' 'C:\\templates\\doc.docx'")
        sys.exit(1)
    
    try:
        json_data = json.loads(sys.argv[1])
        process_templates(json_data, sys.argv[2])
        print(f"所有模板处理完成！输出文件保存在 {Path(sys.argv[2]).parent / 'out'} 目录中")
    except json.JSONDecodeError:
        print("错误: JSON 数据格式无效")
    except Exception as e:
        print(f"发生错误: {str(e)}")