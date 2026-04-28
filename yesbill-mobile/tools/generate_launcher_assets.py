from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "images" / "yesbill_logo_icon_only.png"
OUT_BG = ROOT / "assets" / "images" / "yesbill_logo_launcher.png"
OUT_FG = ROOT / "assets" / "images" / "yesbill_logo_launcher_foreground.png"


def resize_contain(image: Image.Image, max_side: int) -> Image.Image:
    w, h = image.size
    scale = min(max_side / w, max_side / h)
    nw, nh = int(w * scale), int(h * scale)
    return image.resize((nw, nh), Image.Resampling.LANCZOS)


logo = Image.open(SRC).convert("RGBA")

# Legacy launcher icon: white square + centered logo (prevents dark invisible icon)
bg_canvas = Image.new("RGBA", (1024, 1024), (255, 255, 255, 255))
contained_bg = resize_contain(logo, 620)
bx = (1024 - contained_bg.width) // 2
by = (1024 - contained_bg.height) // 2
bg_canvas.paste(contained_bg, (bx, by), contained_bg)
bg_canvas.save(OUT_BG)

# Adaptive foreground: transparent canvas + padded centered logo (prevents squeeze/crop)
fg_canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
contained_fg = resize_contain(logo, 560)
fx = (1024 - contained_fg.width) // 2
fy = (1024 - contained_fg.height) // 2
fg_canvas.paste(contained_fg, (fx, fy), contained_fg)
fg_canvas.save(OUT_FG)

print(f"Generated: {OUT_BG}")
print(f"Generated: {OUT_FG}")
