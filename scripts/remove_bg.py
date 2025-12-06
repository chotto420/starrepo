
from PIL import Image
import numpy as np

def remove_background(input_path, output_path, tolerance=30):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    
    datas = img.getdata()
    
    # Get the background color from the top-left pixel
    bg_color = datas[0]
    
    newData = []
    
    for item in datas:
        # Calculate distance from background color
        dist = sum([abs(c1 - c2) for c1, c2 in zip(item[:3], bg_color[:3])])
        
        if dist < tolerance:
            # Make transparent
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    input_file = r"c:\Users\chott\OneDrive - 株式会社Jarminal\GitHub\starrepo\starrepo\src\app\icon.png"
    output_file = r"c:\Users\chott\OneDrive - 株式会社Jarminal\GitHub\starrepo\starrepo\src\app\icon_transparent.png"
    remove_background(input_file, output_file)
