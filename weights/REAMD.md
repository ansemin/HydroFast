# YOLOv8 Segmentation Model – Training Process (`best.pt`)

This document outlines the end-to-end process used to train the `YOLOv8-n` segmentation model (`best.pt`) for wound image segmentation in a mobile-based wound healing application.

## 1. Dataset Preparation

* **Source**: A publicly available dataset with labeled medical images was used.
* **Annotation Format**:

  * Binary mask annotations were converted into YOLOv8-compatible `.txt` files containing polygon contour coordinates.
* **Data Split**:

  * Dataset was split using a standard 80/20 ratio for training and evaluation.

## 2. Model Selection

* **Model Architecture**: `YOLOv8-n` (nano variant)

  * Chosen for its lightweight size, optimized for mobile inference
  * Default configuration:

    * `depth_multiple: 0.33`
    * `width_multiple: 0.25`

## 3. Training Configuration

* **Framework**: PyTorch v2.0.0 + CUDA 11.7
* **YOLO Library**: Ultralytics YOLOv8 v8.1.26
* **Command Template**:

  ```bash
  yolo task=segment mode=train model=yolov8n-seg.pt data=custom.yaml epochs=100 imgsz=640
  ```
* **Training Policy**:

  * Early stopping applied based on validation set stagnation
  * All training was performed on GPU (NVIDIA RTX 4060)

## 4. Data Augmentation (Assumed Defaults)

* `mosaic=1.0` → Combines four images for spatial diversity
* `mixup=0.0` → Disabled to retain boundary clarity in medical segmentation
* `hsv_h=0.015`, `hsv_s=0.7`, `hsv_v=0.4` → Color-based augmentations for lighting generalization
* `fliplr=0.5`, `flipud=0.0` → Horizontal flipping only, preserving anatomical realism
* `scale=0.5`, `translate=0.1`, `shear=0.0`, `perspective=0.0` → Mild geometric transformations
* `crop_fraction=1.0` → Full-image training to maintain spatial context

## 5. Loss Configuration (Inferred)

* **Loss Functions**:

  * Objectness: Binary Cross-Entropy (BCE)
  * Box Regression: Complete IoU (CIoU)
  * Segmentation: BCE loss per pixel

* **Loss Weights (Approximate Defaults)**:

  * `box=0.05`, `cls=0.5`, `dfl=1.5`, `seg=1.0`

These settings favor segmentation fidelity while maintaining sufficient localization performance.

## 6. Output Artifact

* Final model weights saved as `best.pt`

  * Represents the checkpoint with highest Dice/IoU performance on the test set

## 7. Post-Training Conversion

To deploy on Android mobile devices, the model was converted via the following steps:

1. **Source Code Modification**:

   * Adjusted YOLOv8's `C2F`, `Detect`, and `Segment` modules

2. **Model Format Conversion**:

   * PyTorch `.pt` ➔ ONNX
   * ONNX ➔ NCNN `.bin` and `.param`

3. **Deployment Framework**: [NCNN](https://github.com/Tencent/ncnn) for Android inference

---

This process balances model compactness, segmentation quality, and mobile deployability for point-of-care wound analysis.
