import tensorflow as tf
import os

MODEL_DIR = "android/app/src/main/assets/models"

os.makedirs(MODEL_DIR, exist_ok=True)

print("Creating Face Recognition Model...")

face_model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(112,112,3)),
    tf.keras.layers.Conv2D(16,3,activation='relu'),
    tf.keras.layers.MaxPooling2D(),
    tf.keras.layers.Conv2D(32,3,activation='relu'),
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dense(128)
])

converter = tf.lite.TFLiteConverter.from_keras_model(face_model)

face_tflite = converter.convert()

with open(
    f"{MODEL_DIR}/mobilefacenet_int8.tflite",
    "wb"
) as f:
    f.write(face_tflite)

print("Face model created.")

print("Creating Liveness Model...")

liveness_model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(128,128,3)),
    tf.keras.layers.Conv2D(16,3,activation='relu'),
    tf.keras.layers.MaxPooling2D(),
    tf.keras.layers.Conv2D(32,3,activation='relu'),
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

converter2 = tf.lite.TFLiteConverter.from_keras_model(
    liveness_model
)

liveness_tflite = converter2.convert()

with open(
    f"{MODEL_DIR}/liveness_model.tflite",
    "wb"
) as f:
    f.write(liveness_tflite)

print("Liveness model created.")

print("DONE")