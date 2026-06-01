# DataLake FaceAuth — Hackathon 7.0

Offline facial recognition and liveness detection system for React Native.
Built for zero-network field authentication in the DataLake 3.0 ecosystem.

## Problem Statement
Field personnel in remote locations need secure authentication without internet.
This app works fully offline, stores logs locally, and syncs to AWS when network restores.

## Features
- Fully offline face recognition (MobileFaceNet INT8)
- Liveness detection (blink, smile, head turn challenges)
- Anti-spoof protection (prevents photo/screen attacks)
- Encrypted local SQLite database
- Auto sync to AWS DynamoDB when network restores
- Auto purge of synced records after 7 days
- GPS tagging of attendance records

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | React Native 0.73 |
| Language | TypeScript |
| Face Recognition | MobileFaceNet INT8 (TFLite) |
| Liveness Model | MobileNetV3-small (TFLite) |
| Local Database | SQLite |
| Cloud Sync | AWS DynamoDB |
| Camera | react-native-vision-camera |
| Navigation | React Navigation 6 |

## Model Sizes
| Model | Size |
|---|---|
| MobileFaceNet INT8 | ~5 MB |
| Liveness MobileNetV3-small | ~3 MB |
| Total app addition | ~8 MB |

## Performance Targets
| Metric | Target |
|---|---|
| Face recognition inference | < 500ms |
| Full auth pipeline | < 1000ms |
| Liveness detection | < 300ms |

## Hardware Requirements
- Android 8.0+ (API 26+)
- Minimum 3GB RAM
- Front camera required

## Project Structure