function createAudioMeter(audioContext, averaging, bufferSize) {
    let processor = audioContext.createScriptProcessor(bufferSize*2, 1, 1);
    processor.averaging = averaging || 0.95;
    processor.volume = 0;
    processor.onaudioprocess = function (event) {
        let buf = event.inputBuffer.getChannelData(0);

        let sum = buf.reduce((a, v) => a + v * v, 0)
        let rms = Math.sqrt(sum / buf.length);
        processor.volume = processor.averaging * processor.volume + (1 - processor.averaging) * rms;
    };

    // this will have no effect, since we don't copy the input to the output,
    // but works around a current Chrome bug.
    processor.connect(audioContext.destination);

    processor.shutdown = function () {
        processor.disconnect();
        processor.onaudioprocess = null;
    };

    return processor;
}

function createFreqMeter(audioContext, averaging, bufferSize) {
    // analyser extracts frequency, waveform, etc.
    let analyser = audioContext.createAnalyser();
    analyser.volume = 0;
    analyser.smoothingTimeConstant = 0.2;
    analyser.fftSize = bufferSize;

    var processor = audioContext.createScriptProcessor(bufferSize*2, 1, 1);
    processor.averaging = averaging || 0.95;
    processor.spectrum = new Uint8Array(analyser.frequencyBinCount);
    processor.onaudioprocess = function () {
        analyser.getByteFrequencyData(this.spectrum);
        
        let sum = this.spectrum.reduce((a, v) => a + v * v, 0)
        let rms = Math.sqrt(sum / this.spectrum.length) / 100;

        analyser.volume = processor.averaging * analyser.volume + (1 - processor.averaging) * rms;
    };

    analyser.connect(processor);
    processor.connect(audioContext.destination);

    analyser.shutdown = function () {
        analyser.disconnect();
        processor.disconnect();
        processor.onaudioprocess = null;
    };

    return analyser;
}


function Microphone(smooth) {
    const self = this;

    this.source = undefined;
    this.node = undefined;
    
    // this is just a browser check to see
    // if it supports AudioContext and getUserMedia
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    
    this.getLevel = function () {
        if (this.node === undefined)
            return 0;
        return this.node.volume;
    };

    this.init = async function () {
        try {
            const audioContext = new AudioContext();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.source = audioContext.createMediaStreamSource(stream);
            // this.node = createAudioMeter(audioContext, smooth, 1024);
            this.node = createFreqMeter(audioContext, smooth, 1024);

            this.source.connect(this.node);

            this.stream = stream;
        }
        catch (e) {
            console.error(e);
            alert('Web Audio API is not supported in this browser');
        }
    }

    this.stop = function () {
        if (this.stream !== undefined) {
            this.node.shutdown();
            this.stream.getTracks()[0].stop();
            this.stream = undefined;
        }
    }

    return this;
};
