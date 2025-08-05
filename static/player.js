async function startStream() {
  const url = document.getElementById("urlInput").value;
  const res = await fetch("/api/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });

  const data = await res.json();
  if (data.stream_url) {
    const video = document.getElementById("videoPlayer");
    video.src = data.stream_url;
    video.play();
  } else {
    alert("エラー: " + data.error);
  }
}
