import os
from PIL import Image, ImageDraw, ImageFont

def generate():
    # Final image dimensions: 4 panels of 256x256 = 1024x256
    width, height = 1024, 256
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    font_path = "C:\\Windows\\Fonts\\seguiemj.ttf"
    # Font size 110 fits well within a 128x256 half-cell
    font = ImageFont.truetype(font_path, 110)
    
    # Emojis for the 4 butterfly panels
    emoji_sets = [
        ("😂", "😂"),  # Panel 0: Tears of Joy
        ("🤣", "🤣"),  # Panel 1: Rolling Laughing
        ("😆", "😆"),  # Panel 2: Squinting Laughing
        ("🤪", "🤪")   # Panel 3: Zany face
    ]
    
    # Theme colors for the butterfly bodies
    body_colors = [
        (220, 143, 255, 255),  # Purple
        (255, 111, 121, 255),  # Pink
        (255, 211, 154, 255),  # Yellow-orange
        (107, 240, 255, 255)   # Light Blue
    ]
    
    for i in range(4):
        offset_x = i * 256
        left_emoji, right_emoji = emoji_sets[i]
        body_color = body_colors[i]
        
        # Center of the cell is offset_x + 128
        center_x = offset_x + 128
        
        # Draw Left Wing (adjusting text anchor to center-right or center)
        # Using "mm" (middle, middle) anchor for exact positioning
        draw.text((center_x - 65, 128), left_emoji, font=font, anchor="mm", embedded_color=True)
        
        # Draw Right Wing
        draw.text((center_x + 65, 128), right_emoji, font=font, anchor="mm", embedded_color=True)
        
        # Draw Body (a vertical capsule)
        # Bounding box for the body: center_x-6, 50 to center_x+6, 206
        draw.rounded_rectangle(
            [center_x - 7, 50, center_x + 7, 206],
            radius=7,
            fill=body_color
        )
        
        # Draw Head (a small circle)
        draw.ellipse(
            [center_x - 12, 36, center_x + 12, 60],
            fill=body_color
        )
        
        # Draw Antennae (two small lines)
        draw.line([center_x - 4, 40, center_x - 15, 20], fill=body_color, width=3)
        draw.line([center_x + 4, 40, center_x + 15, 20], fill=body_color, width=3)
        
        # Draw Antenna tips (small dots)
        draw.ellipse([center_x - 17, 18, center_x - 13, 22], fill=body_color)
        draw.ellipse([center_x + 13, 18, center_x + 17, 22], fill=body_color)
        
    output_path = "public/butterflies.png"
    img.save(output_path)
    print("Custom emoji butterflies texture generated and saved to:", output_path)

if __name__ == "__main__":
    generate()
