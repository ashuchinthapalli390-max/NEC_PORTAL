import sys
import zipfile
import xml.etree.ElementTree as ET

def extract_text(file_path):
    try:
        with zipfile.ZipFile(file_path) as z:
            with z.open('word/document.xml') as f:
                root = ET.parse(f).getroot()
                text = ' '.join(root.itertext())
                return text
    except Exception as e:
        return ''

if __name__ == '__main__':
    if len(sys.argv) > 1:
        print(extract_text(sys.argv[1]))
