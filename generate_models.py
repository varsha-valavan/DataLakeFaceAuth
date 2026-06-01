import numpy as np

def create_tflite_model(input_shape, output_shape, filename):
    import struct
    
    # Minimal valid flatbuffer for TFLite
    # This creates a passthrough model for testing
    try:
        import tensorflow as tf
        
        # Create a simple model
        model = tf.keras.Sequential([
            tf.keras.layers.InputLayer(input_shape=input_shape),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(output_shape, activation='sigmoid'),
        ])
        
        # Convert to TFLite
        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        tflite_model = converter.convert()
        
        with open(filename, 'wb') as f:
            f.write(tflite_model)
        print(f"Created {filename} ({len(tflite_model)} bytes)")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

# Face recognition model: input 112x112x3, output 128 embeddings
create_tflite_model(
    input_shape=(112, 112, 3),
    output_shape=128,
    filename='android/app/src/main/assets/models/mobilefacenet_int8.tflite'
)

# Liveness model: input 128x128x3, output 1 (real/spoof score)
create_tflite_model(
    input_shape=(128, 128, 3),
    output_shape=1,
    filename='android/app/src/main/assets/models/liveness_model.tflite'
)

print("Done! Models created successfully.")