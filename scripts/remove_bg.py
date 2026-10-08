"""
Precision background removal and edge de-fringing for product imagery.
Preserves internal white elements (e.g. logos, highlights) while removing
external solid background with sub-pixel anti-aliasing.
"""

from collections import deque
import numpy as np
from PIL import Image, ImageFilter


def remove_white_background(image_path: str, output_path: str) -> None:
    # 1. Load image
    img = Image.open(image_path).convert('RGB')
    orig_np = np.array(img, dtype=np.float64)
    H, W, _ = orig_np.shape

    # Distance from pure white in RGB space
    diff = 255.0 - orig_np
    dist = np.max(diff, axis=2)

    # 2. Flood fill external background from 4 boundaries
    # Threshold for definite background: dist < 2.0 (i.e. RGB >= 253 in all channels)
    bg_seed = (dist < 2.0)
    is_ext_bg = np.zeros((H, W), dtype=bool)
    q = deque()

    for x in range(W):
        if bg_seed[0, x]:
            q.append((0, x))
            is_ext_bg[0, x] = True
        if bg_seed[H - 1, x]:
            q.append((H - 1, x))
            is_ext_bg[H - 1, x] = True

    for y in range(H):
        if bg_seed[y, 0] and not is_ext_bg[y, 0]:
            q.append((y, 0))
            is_ext_bg[y, 0] = True
        if bg_seed[y, W - 1] and not is_ext_bg[y, W - 1]:
            q.append((y, W - 1))
            is_ext_bg[y, W - 1] = True

    while q:
        y, x = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and not is_ext_bg[ny, nx] and dist[ny, nx] < 2.0:
                is_ext_bg[ny, nx] = True
                q.append((ny, nx))

    # 3. Create initial binary mask (1 for foreground, 0 for external background)
    fg_mask = (~is_ext_bg).astype(np.float64)

    # Convert to PIL Image for gentle anti-aliasing smoothing at the boundary
    mask_img = Image.fromarray((fg_mask * 255).astype(np.uint8), mode='L')

    # Apply slight gaussian blur on mask for smooth subpixel transitions (radius 0.6)
    # followed by slight contraction to completely suppress white fringe
    blurred_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=0.7))
    alpha = np.array(blurred_mask, dtype=np.float64) / 255.0

    # Ensure pure background remains strictly 0
    # and deep foreground remains strictly 1.0
    alpha[is_ext_bg & (alpha < 0.05)] = 0.0

    # 4. De-fringing (Color recovery for transition pixels)
    # The original pixel C is: C = alpha * C_fg + (1 - alpha) * 255
    # Therefore: C_fg = (C - (1 - alpha) * 255) / alpha
    # When alpha is close to 0, clamp to avoid noise.
    recovered_rgb = orig_np.copy()
    transition_mask = (alpha > 0.01) & (alpha < 0.99) & (~is_ext_bg)

    t_alpha = alpha[transition_mask, np.newaxis]
    t_orig = orig_np[transition_mask]

    # De-multiply against white background
    unmixed = (t_orig - (1.0 - t_alpha) * 255.0) / np.maximum(t_alpha, 0.05)
    unmixed = np.clip(unmixed, 0.0, 255.0)

    recovered_rgb[transition_mask] = unmixed

    # For pure background pixels, set RGB to 0 for clean compression
    recovered_rgb[alpha == 0] = 0.0

    # 5. Assemble RGBA image
    final_rgba = np.zeros((H, W, 4), dtype=np.uint8)
    final_rgba[:, :, :3] = np.clip(recovered_rgb, 0, 255).astype(np.uint8)
    final_rgba[:, :, 3] = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)

    out_img = Image.fromarray(final_rgba, mode='RGBA')
    out_img.save(output_path, format='PNG', optimize=True)
    print(f'Successfully saved transparent PNG to {output_path}')


if __name__ == '__main__':
    remove_white_background('images/bosgame_vti_490.png', 'images/bosgame_vti_490_transparent.png')
