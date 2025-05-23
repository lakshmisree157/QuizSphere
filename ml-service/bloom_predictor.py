import os
import json
import joblib
from sentence_transformers import SentenceTransformer
import numpy as np

class BloomPredictor:
    def __init__(self, model_path=None):
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), "models", "rf_model.pkl")
        self.rf_model = joblib.load(model_path)
        self.embedder = SentenceTransformer('all-mpnet-base-v2')

    def predict_bloom_levels(self, paragraphs):
        """
        Predict Bloom's taxonomy levels for a list of paragraphs.
        Args:
            paragraphs (list of str): Paragraph texts.
        Returns:
            list of int: Predicted Bloom levels for each paragraph.
        """
        if not paragraphs:
            return []

        embeddings = self.embedder.encode(paragraphs)
        predictions = self.rf_model.predict(embeddings)
        return predictions.tolist()

# Singleton instance for reuse
bloom_predictor = BloomPredictor()

def predict_bloom_level_for_paragraph(paragraph):
    return bloom_predictor.predict_bloom_levels([paragraph])[0]

if __name__ == "__main__":
    # Simple test
    test_paragraphs = [
        "Define the concept of artificial intelligence.",
        "Explain how machine learning algorithms work.",
        "Design a system that can classify images."
    ]
    predictions = bloom_predictor.predict_bloom_levels(test_paragraphs)
    for para, pred in zip(test_paragraphs, predictions):
        print(f"Paragraph: {para}\nPredicted Bloom Level: {pred}\n")
