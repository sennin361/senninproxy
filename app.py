from flask import Flask, render_template, request, jsonify
import yt_dlp

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/stream', methods=['POST'])
def get_stream_url():
    data = request.json
    video_url = data.get('url')
    if not video_url:
        return jsonify({'error': 'URLが必要です'}), 400

    ydl_opts = {
        'format': 'best[ext=mp4]/best',
        'quiet': True,
        'noplaylist': True,
        'skip_download': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(video_url, download=False)
            return jsonify({'stream_url': info['url']})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
