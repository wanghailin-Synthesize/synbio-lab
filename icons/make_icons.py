# -*- coding: utf-8 -*-
"""生成应用图标：蓝色渐变圆角底 + 白色锥形瓶 + 液滴气泡"""
import math
from PIL import Image, ImageDraw

def rounded_grad(size, r_ratio=0.22):
    """带圆角遮罩的蓝紫渐变底"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # 渐变：左上 #2B6BF3 -> 右下 #7A5CF6
    c1, c2 = (43, 107, 243), (110, 92, 246)
    grad = Image.new("RGBA", (size, size))
    gd = ImageDraw.Draw(grad)
    for y in range(size):
        for_x = y / (size - 1)
        # 对角渐变：同时考虑 x，简化用 y + 每行绘制
        pass
    # 逐像素太慢，用小图放大法
    small = 64
    g = Image.new("RGB", (small, small))
    gd = g.load()
    for y in range(small):
        for x in range(small):
            t = (x + y) / (2 * small - 2)
            gd[x, y] = tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))
    grad = g.resize((size, size), Image.BICUBIC).convert("RGBA")
    # 圆角遮罩
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    r = int(size * r_ratio)
    md.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    img.paste(grad, (0, 0), mask)
    return img

def draw_flask(img, scale=1.0, cx=0.5, cy=0.54):
    """白色锥形瓶线稿 + 液面 + 气泡，坐标为相对值"""
    S = img.size[0]
    d = ImageDraw.Draw(img)
    W = max(3, int(S * 0.055 * scale))          # 线宽
    c = (255, 255, 255, 255)
    def P(x, y):  # 相对坐标 -> 像素
        return (S * (cx + (x - 0.5) * scale), S * (cy + (y - 0.5) * scale))
    # 瓶口
    mx, my = P(0.5, 0.16), P(0.5, 0.17)
    mouth_l, mouth_r = P(0.40, 0.155), P(0.60, 0.155)
    neck_l_t, neck_r_t = P(0.43, 0.155), P(0.57, 0.155)
    neck_l_b, neck_r_b = P(0.43, 0.42), P(0.57, 0.42)
    body_l, body_r = P(0.22, 0.80), P(0.78, 0.80)
    # 线条
    d.line([mouth_l, mouth_r], fill=c, width=W)
    d.line([neck_l_t, neck_l_b, body_l], fill=c, width=W, joint="curve")
    d.line([neck_r_t, neck_r_b, body_r], fill=c, width=W, joint="curve")
    d.line([body_l, body_r], fill=c, width=W)
    # 液面
    liq_l, liq_r = P(0.335, 0.60), P(0.665, 0.60)
    d.line([liq_l, liq_r], fill=c, width=max(2, W - 2))
    # 气泡
    for bx, by, br in [(0.46, 0.70, 0.022), (0.55, 0.66, 0.016), (0.505, 0.72, 0.012)]:
        p1 = P(bx - br, by - br); p2 = P(bx + br, by + br)
        d.ellipse([p1, p2], outline=c, width=max(2, W - 3))
    return img

def make(size, path, maskable=False):
    if maskable:
        # maskable 需要更小的内容区域（safe zone 80%）
        img = rounded_grad(size, r_ratio=0.0)   # 全出血方形，系统自己裁圆角
        img = draw_flask(img, scale=0.72)
    else:
        img = rounded_grad(size)
        img = draw_flask(img, scale=0.92)
    img.save(path)
    print("saved", path)

base = r"C:\Users\lenovo\.zcode\workspace\default\synbio-lab\icons"
make(512, base + r"\icon-512.png")
make(192, base + r"\icon-192.png")
make(512, base + r"\maskable-512.png", maskable=True)
make(180, base + r"\apple-touch-icon.png")
make(64,  base + r"\favicon.png")
print("done")
