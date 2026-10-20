import os
from PIL import Image, ImageDraw, ImageFont

CAPTURE_DIR = os.path.join(os.path.dirname(__file__), 'capture')
os.makedirs(CAPTURE_DIR, exist_ok=True)

# 2x scale for High-DPI retina capture
SCALE = 2
WIDTH = 196 * SCALE
HEIGHT = 48 * SCALE
PAD = 28 * SCALE
RADIUS = 14 * SCALE

# Colors
BG_COLOR = (13, 18, 32, 255) # #0d1220
BORDER_COLOR = (255, 255, 255, 36) # rgba(255,255,255,0.14)
WHITE = (248, 250, 252, 255)
CYAN = (103, 232, 249, 255) # #67e8f9
SLATE = (148, 163, 184, 255) # #94a3b8

# Try to find a good bold font
font_candidates = [
    '/System/Library/Fonts/SFProText-Bold.otf',
    '/System/Library/Fonts/SFProDisplay-Bold.otf',
    '/System/Library/Fonts/HelveticaNeue.ttc',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
]

font_path = None
for p in font_candidates:
    if os.path.exists(p):
        font_path = p
        break

font_lg = ImageFont.truetype(font_path, 15 * SCALE) if font_path else ImageFont.load_default()
font_sm = ImageFont.truetype(font_path, 11 * SCALE) if font_path else ImageFont.load_default()

tiles_spec = [
    {"type": "wordmark"},
    {"type": "descriptor", "text": "OPEN SOURCE DISCOVERY"},
    {"type": "wordmark"},
    {"type": "descriptor", "text": "FIND ISSUES"}
]

for idx, spec in enumerate(tiles_spec):
    total_w = WIDTH + 2 * PAD
    total_h = HEIGHT + 2 * PAD
    img = Image.new('RGBA', (total_w, total_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded dark card
    card_rect = [PAD, PAD, PAD + WIDTH, PAD + HEIGHT]
    draw.rounded_rectangle(card_rect, radius=RADIUS, fill=BG_COLOR, outline=BORDER_COLOR, width=1*SCALE)
    
    # Draw typography
    card_center_x = PAD + WIDTH // 2
    card_center_y = PAD + HEIGHT // 2
    
    if spec["type"] == "wordmark":
        w1 = draw.textlength("ISSUE", font=font_lg)
        w2 = draw.textlength("SCOUT", font=font_lg)
        total_text_w = w1 + w2
        start_x = card_center_x - total_text_w // 2
        y = card_center_y - 9 * SCALE
        
        draw.text((start_x, y), "ISSUE", font=font_lg, fill=WHITE)
        draw.text((start_x + w1, y), "SCOUT", font=font_lg, fill=CYAN)
    else:
        text = spec["text"]
        w = draw.textlength(text, font=font_sm)
        start_x = card_center_x - w // 2
        y = card_center_y - 7 * SCALE
        draw.text((start_x, y), text, font=font_sm, fill=SLATE)
        
    out_path = os.path.join(CAPTURE_DIR, f"layer_brand_tile_{idx}.png")
    img.save(out_path, "PNG")
    print(f"Generated clean brand tile {idx}: {out_path} ({total_w}x{total_h})")

print("All brand tiles generated cleanly.")
