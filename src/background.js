const listener = (details) => {
  if (!details.url.includes("Player")) {
    return;
  }
  if (!/\.js$/.test(details.url)) {
    return;
  }

  const filter = browser.webRequest.filterResponseData(details.requestId);
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();

  const data = [];
  filter.ondata = (event) => {
    data.push(event.data);
  };

  filter.onstop = () => {
    let str = "";
    for (const buffer of data) {
      str += decoder.decode(buffer, { stream: true });
    }
    str += decoder.decode();

    // \1.media.playbackRate ... video要素のplaybackRate
    // this.playbackRate ... ステート
    const targetCodeRegex =
      /\b([a-z])\.media\.playbackRate!==this\.playbackRate&&\(\1\.media\.playbackRate=this\.playbackRate\),/;
    const gRegex = new RegExp(targetCodeRegex.source, "g");
    const matches = str.matchAll(gRegex);
    const matchesArray = Array.from(matches);

    if (matchesArray.length === 2) {
      for (const m of matchesArray) {
        const propStr1 = `${m[1]}.media.playbackRate`;
        const propStr2 = `this.playbackRate`;
        // let code = `${propStr1}!==${propStr2}&&(${propStr2}=${propStr1}),`;

        // this.setPlaybackRate ... 動画プレイヤーの再生速度変更機能で使用されるメソッド
        const code = `${propStr1}!==${propStr2}&&(this.setPlaybackRate(${propStr1})),`;

        str = str.replace(targetCodeRegex, code);
      }
    }

    filter.write(encoder.encode(str));
    filter.close();
  };
};

browser.webRequest.onBeforeRequest.addListener(
  listener,
  { urls: ["*://*.nicovideo.jp/*", "*://*.nimg.jp/*"] },
  ["blocking"],
);
