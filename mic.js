function Microphone (_fft) {
    var FFT_SIZE = _fft || 1024;
    this.spectrum = [];
    this.volume = this.vol = 0;
    this.smoothVolume = 0;
    this.peak_volume = 0;
    var self = this;
    var audioContext = new AudioContext();
    var SAMPLE_RATE = audioContext.sampleRate;

    // this is just a browser check to see
    // if it supports AudioContext and getUserMedia
    window.AudioContext = window.AudioContext ||  window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    
    this.getLevel = (smooth) => {
        //console.log(this.smoothVolume, this.volume/100)
        smooth = (1-smooth);
        this.smoothVolume = smooth*this.smoothVolume + (1-smooth)*this.volume/100;
        return this.smoothVolume;
    };
    
    
    // now just wait until the microphone is fired up
    this.init = function() {
        try {
            startMic(new AudioContext());
        }
        catch (e) {
            console.error(e);
            alert('Web Audio API is not supported in this browser');
        }
    }
    
    function startMic(context) {
        navigator.getUserMedia({audio: true}, processSound, () => console.log(arguments));
        
        function processSound (stream) {
            // analyser extracts frequency, waveform, etc.
            var analyser = context.createAnalyser();
            analyser.smoothingTimeConstant = 0.2;
            analyser.fftSize = FFT_SIZE;
            var node = context.createScriptProcessor(FFT_SIZE*2, 1, 1);
            
            node.onaudioprocess = function () {
                self.spectrum = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(self.spectrum);

                self.vol = getRMS(self.spectrum);
                // get peak - a hack when our volumes are low
                //if (self.vol > self.peak_volume) self.peak_volume = self.vol;
                self.volume = self.vol;
            };
            var input = context.createMediaStreamSource(stream);
            input.connect(analyser);
            analyser.connect(node);
            node.connect(context.destination);
        }
        
        function getRMS(spectrum) {
            var rms = 0;
            for (var i = 0; i < spectrum.length; i++) {
                rms += spectrum[i] * spectrum[i];
            }
            rms /= spectrum.length;
            rms = Math.sqrt(rms);
            return rms;
        }
    }
 
    return this;
};
