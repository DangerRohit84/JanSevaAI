import os
import logging
import base64
from app.config import settings

logger = logging.getLogger(__name__)

_client = None
_real_mode = False


def _get_speech_client():
    global _client, _real_mode
    if _client is not None:
        return _client

    credentials_path = settings.GOOGLE_APPLICATION_CREDENTIALS
    project_id = settings.GCP_PROJECT_ID

    if credentials_path and os.path.exists(credentials_path) and project_id:
        try:
            from google.cloud import speech
            _client = speech.SpeechClient.from_service_account_json(credentials_path)
            _real_mode = True
            logger.info("Speech-to-Text: Real mode (Google Cloud Speech)")
            return _client
        except Exception as e:
            logger.warning(f"Speech init failed: {e}, falling back to mock")

    logger.info("Speech-to-Text: Mock mode (no credentials)")
    _client = "mock"
    _real_mode = False
    return None


def transcribe_audio(audio_bytes: bytes, language_code: str = "hi-IN") -> dict:
    client = _get_speech_client()

    if _real_mode and client:
        try:
            from google.cloud import speech

            audio = speech.RecognitionAudio(content=audio_bytes)

            lang = language_code.split("-")[0] if "-" in language_code else language_code
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                sample_rate_hertz=48000,
                language_code=f"{lang}-IN",
                alternative_language_codes=[f"en-IN", f"hi-IN"] if lang != "hi" else [f"en-IN"],
                enable_automatic_punctuation=True,
                model="latest_long",
                use_enhanced=True,
            )

            response = client.recognize(config=config, audio=audio)

            if response.results:
                best = response.results[0].alternatives[0]
                return {
                    "transcript": best.transcript,
                    "confidence": round(best.confidence, 2),
                    "language": language_code,
                }

            return {
                "transcript": "",
                "confidence": 0.0,
                "language": language_code,
                "error": "No speech detected in audio",
            }

        except Exception as e:
            logger.error(f"Speech recognition failed: {e}")
            return {
                "transcript": "",
                "confidence": 0.0,
                "language": language_code,
                "error": str(e),
            }

    return _mock_transcribe(language_code)


def _mock_transcribe(language_code: str) -> dict:
    mock_transcripts = {
        "hi-IN": [
            "मेरे मोहल्ले में पानी की आपूर्ति बंद है। कृपया जल्दी ठीक करें।",
            "सड़क में बहुत बड़े गड्ढे हैं, दुर्घटना हो सकती है।",
            "बिजली कटौती हो रही है, बच्चों की पढ़ाई बाधित हो रही है।",
            "स्कूल में शिक्षक नहीं हैं, बच्चे पढ़ नहीं पा रहे हैं।",
        ],
        "en-IN": [
            "There is no water supply in our area for the last 2 days.",
            "The road near our colony is completely broken with large potholes.",
            "Frequent power cuts are affecting our daily life and children's education.",
            "The local hospital has no doctor available during evening hours.",
        ],
        "bn-IN": ["আমাদ় এলাকায় পানির সরবরাহ বন্ধ।"],
        "ta-IN": ["எங்கள் பகுதியில் மின்சாரம் தடைபட்டுள்ளது."],
        "te-IN": ["మా ప్రాంతంలో నీటి సరఫరా ఆగిపోయింది."],
        "mr-IN": ["आमच्या भागात पाण्याचा पुरवठा बंद आहे."],
        "gu-IN": ["અમારા વિસ્તારમાં પાણીની સપ્લાય બંધ છે."],
        "kn-IN": ["ನಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ನೀರಿನ ಪೂರೈಕೆ ಸ್ಥಗಿತಗೊಂಡಿದೆ."],
        "ml-IN": ["ഞങ്ങളുടെ പ്രദേശത്ത് ജലവിതരണം നിന്നു."],
        "pa-IN": ["ਸਾਡੇ ਇਲਾਕੇ ਵਿੱਚ ਪਾਣੀ ਦੀ ਸਪਲਾਈ ਬੰਦ ਹੈ।"],
        "or-IN": ["ଆମ ଅଞ୍ଚଳରେ ପାଣି ଯୋଗାଣ ବନ୍ଦ ଅଛି।"],
        "as-IN": ["আমাৰ অঞ্চলত পানীৰ যোগান বন্ধ।"],
    }

    lang = language_code if language_code in mock_transcripts else "hi-IN"
    transcript = mock_transcripts[lang][0]

    return {
        "transcript": transcript,
        "confidence": 0.85,
        "language": language_code,
    }
