const listener = (details) => {
  if (!details.url.includes("PlayerVolumeBar")) {
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
    // \2.playbackRate ... ステート
    // video要素のtimeupdateイベントとplayイベントのイベントリスナーには以下の正規表現にマッチするコードが含まれる
    const targetCodeRegex =
      /\b([a-z])\.media\.playbackRate!==([a-z])\.playbackRate&&\(\1\.media\.playbackRate=\2\.playbackRate\),/;
    const gRegex = new RegExp(targetCodeRegex.source, "g");
    const matches = str.matchAll(gRegex);
    const matchesArray = Array.from(matches);

    if (matchesArray.length === 2) {
      for (const m of matchesArray) {
        // 元のコードを、ステート側をvideo要素のplaybackRateで上書きするコードに改変する
        const ObjStr1 = `${m[1]}.media.playbackRate`;
        const ObjStr2 = `${m[2]}.playbackRate`;
        let code = `${ObjStr1}!==${ObjStr2}&&(${ObjStr2}=${ObjStr1}),`;
        // str = str.replaceAll(gRegex, code);
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
  ["blocking"]
);
