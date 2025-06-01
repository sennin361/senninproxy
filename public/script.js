document.getElementById('loadBtn').addEventListener('click', async () => {
  const url = document.getElementById('urlInput').value.trim();
  if (!url.startsWith('http')) {
    alert('httpまたはhttpsから始まるURLを入力してください');
    return;
  }

  const viewer = document.getElementById('viewer');
  viewer.innerHTML = '読み込み中...';

  try {
    const response = await fetch(`/proxy?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }
    const html = await response.text();
    viewer.innerHTML = html;
  } catch (e) {
    viewer.innerHTML = '表示に失敗しました：' + e.message;
  }
});
