(() => {
    const width = 720;
    const height = 540;

    const treshold = 1000;

    const video = document.querySelector('#input');
    video.width = width;
    video.height = height;

    const outputCanvas = document.querySelector('#output');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d');

    const filterCanvas = document.querySelector('#filter');
    filterCanvas.width = width;
    filterCanvas.height = height;
    const filterCtx = filterCanvas.getContext('2d');

    navigator.mediaDevices
        .getUserMedia({
            audio: false,
            video: true,
        })
        .then(videoHandleSuccess)
        .catch(videoHandleError);

    function videoHandleSuccess(stream) {
        video.srcObject = stream;
    }

    function videoHandleError(err) {
        console.log('Video handle error: ', err);
    }

    function frame(time) {
        outputCtx.drawImage(video, 0, 0, width, height);

        const imageData = outputCtx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const initValue = treshold - Math.ceil(time) % treshold;

        for (let i = 0; i < height; i++) {
            let counter = initValue;

            for (let j = 0; j < width; j++) {
                const index = (i * width + j) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];

                const avg = (r + g + b) / 3;

                counter += avg;

                if (counter >= treshold) {
                    counter = counter - treshold / 2;
                    data[index] = 240;
                    data[index + 1] = 240;
                    data[index + 2] = 240;
                } else {
                    data[index] = 0;
                    data[index + 1] = 40;
                    data[index + 2] = 75;
                }
            }
        }

        filterCtx.putImageData(imageData, 0, 0);

        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
})();
