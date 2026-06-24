import os
import tempfile
import trafilatura
import fitz 
from docx import Document
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
import re
import io

class Extractor:
    def __init__(self, model_size="base"):
        self.model_size = model_size
        self._whisper_model = None

    def _get_whisper_model(self):
        if self._whisper_model is None:
            print(f"Loading Whisper model ({self.model_size})...")
            import whisper 
            self._whisper_model = whisper.load_model(self.model_size)
        return self._whisper_model

    def extract_website(self, url: str):
        print(f"Processing website: {url}")
        try:
            downloaded = trafilatura.fetch_url(url)
            if not downloaded:
                print(f"Error: Cannot fetch content from {url}")
                return []
            
            text = trafilatura.extract(downloaded)
            if not text:
                print(f"Warning: No text extracted from {url}")
                return []
            
            print(f"Website extraction successful ({len(text)} characters)")
            return [{
                "text": text,
                "metadata": {"source_type": "web", "locator": {}}
            }]
        except Exception as e:
            print(f"Website processing error for {url}: {str(e)}")
            return []

    def extract_text_file(self, file_content: bytes, file_extension: str):
        print(f"Processing file (Type: {file_extension})")
        final_result = []
        
        try:
            if file_extension == ".pdf":
                with fitz.open(stream=file_content, filetype="pdf") as doc:
                    for i, page in enumerate(doc, start=1):
                        text = page.get_text()
                        if text.strip():
                            final_result.append({
                                "text": text,
                                "metadata": {"source_type": "pdf", "locator": {"page_number": i}}
                            })
            elif file_extension == ".docx":
                doc = Document(io.BytesIO(file_content))
                for i, para in enumerate(doc.paragraphs):
                    text = para.text.strip()
                    if text:
                        final_result.append({
                            "text": text,
                            "metadata": {"source_type": "docx", "locator": {"block_index": i}}
                        })
            
            print(f"File extraction successful: {len(final_result)} segments")
        except Exception as e:
            print(f"File processing error: {str(e)}")
            
        return final_result
    
    def extract_audio_content(self, file_content: bytes):
        print(f"Processing audio content...")
        try:
            model = self._get_whisper_model()
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
                tmp.write(file_content)
                tmp_path = tmp.name
            
            transcript = model.transcribe(tmp_path)
            os.remove(tmp_path) 

            final_result = []
            for segment in transcript["segments"]:
                text = segment["text"].strip()
                if text:
                    final_result.append({
                        "text": text,
                        "metadata": {
                            "source_type": "audio",
                            "locator": {"start_seconds": segment["start"], "end_seconds": segment["end"]}
                        }
                    })
            return final_result
        except Exception as e:
            print(f"Audio processing error: {str(e)}")
            return []
        
    def extract_txt_content(self, file_content: bytes):
        print(f"Processing text file...")
        final_result = []
        try:
            text_data = file_content.decode("utf-8")
            for line in text_data.splitlines():
                text = line.strip()
                if text:
                    final_result.append({
                        "text": text,
                        "metadata": {"source_type": "txt", "locator": {}}
                    })
            return final_result
        except Exception as e:
            print(f"Text processing error: {str(e)}")
            return []

    def extract_youtube(self, url: str):
        print(f"Processing YouTube: {url}")
        video_id = None
        id_match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
        if id_match:
            video_id = id_match.group(1)

        if video_id:
            try:
                print(f"Trying to fetch transcript for {video_id}...")
                transcript_list = YouTubeTranscriptApi().fetch(video_id, languages=['vi', 'en'])
                
                final_result = []
                for snippet in transcript_list:
                    final_result.append({
                        "text": snippet.text,
                        "metadata": {
                            "source_type": "youtube",
                            "locator": {"start_seconds": snippet.start, "end_seconds": snippet.start + snippet.duration}
                        }
                    })
                print(f"Transcript fetched successfully")
                return final_result
            except Exception as e:
                print(f"Transcript API failed: {str(e)}. Downloading audio...")

        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{'key': 'FFmpegExtractAudio','preferredcodec': 'mp3','preferredquality': '192'}],
            'quiet': True, 'no_warnings': True, 'nocheckcertificate': True, 'ignoreerrors': True,
        }

        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                ydl_opts['outtmpl'] = os.path.join(temp_dir, '%(id)s.%(ext)s')
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    if not info:
                        print(f"Cannot download video from {url}")
                        return []
                    filename = ydl.prepare_filename(info)
                    audio_file = filename.rsplit(".", 1)[0] + ".mp3"
                    
                    with open(audio_file, "rb") as f:
                        audio_bytes = f.read()
                    
                    results = self.extract_audio_content(audio_bytes)
                    
                    for item in results: 
                        item['metadata']['source_type'] = "youtube"
                    return results
        except Exception as e:
            print(f"YouTube audio download/processing error for {url}: {str(e)}")
            return []