import { NgZone, Component, OnInit, ViewChild } from '@angular/core';
import recognizeMicrophone from 'watson-speech/speech-to-text/recognize-microphone';
import recognizeFile from 'watson-speech/speech-to-text/recognize-file';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
 
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('audioFile') audioFile: any;
  stream: any = null;
  error = '';
  token = null;
  formattedMessage = [];
  final: String;

  constructor(private httpClient: HttpClient, private ngZone: NgZone) {
  }

  async ngOnInit() {
    const token: any = await this.httpClient.get('/api/v1/credentials').toPromise().then(
      result => { return result; }
    )
    this.token = token.accessToken;
  }

  handleStartRecording() {
    this.formattedMessage = [];
    this.final = '';
    if (this.audioFile?.nativeElement?.files.length) {
      let file = this.audioFile.nativeElement.files[0];
      this.handleStream(recognizeFile(this.getOptions({
        file,
        play: true,
        realtime: true
      }, environment.serviceUrl, 'en-US_BroadbandModel', this.token, this.token)));
    }
  }

  handleStopRecording() {
    this.stream && this.stream.stop();
    this.formattedMessage = [];
    this.final = '';
  }

  handleStartMicrophone() {
    this.formattedMessage = [];
    this.final = '';
      this.handleStream(recognizeMicrophone(this.getOptions({
      }, environment.serviceUrl, 'en-US_BroadbandModel', this.token, this.token)));
  }

  handleStopMicrophone() {
    this.stream && this.stream.stop();
  }

  handleStream(stream) {
    console.log(stream);
    if (this.stream) {
      this.stream.stop();
      this.stream.removeAllListeners();
      this.stream.recognizeStream.removeAllListeners();
    }
    this.stream = stream;
    // this.captureSettings();
    this.ngZone.runOutsideAngular(() => {
      this.stream.on('data', (data) => {
        this.ngZone.run(() => {
          this.formattedMessage = this.formattedMessage.concat(data);
          this.final = this.getFinalAndLatestInterimResult();
        });
      })
      .on('end', this.handleTranscriptEnd)
      .on('error', this.handleError);
    });
  }

  handleTranscriptEnd() {
    alert('end');
  }
  
  handleInput(input) {
    this.formattedMessage=input;
  }

  handleError(error, extra) {
    this.error = error;
  }

  getFinalResults() {
    return this.formattedMessage.filter(r => r.results
      && r.results.length && r.results[0].final);
  }

  getCurrentInterimResult() {
    const r = this.formattedMessage[this.formattedMessage.length - 1];

    // When resultsBySpeaker is enabled, each msg.results array may contain multiple results.
    // However, all results in a given message will be either final or interim, so just checking
    // the first one still works here.
    if (!r || !r.results || !r.results.length || r.results[0].final) {
      return null;
    }
    return r;
  }

  getFinalAndLatestInterimResult() {
    const final = this.getFinalResults();
    const interim = this.getCurrentInterimResult();
    if (interim) {
      final.push(interim);
    }
    const results = final?.map(msg => msg.results.map((result) => (
      result.alternatives[0].transcript
    ))).reduce((a, b) => a.concat(b), []); // the reduce() call flattens the array
    return results;
  }

  getOptions(extra: Object, serviceUrl: string, model: string, token = null, access_token = null) {
    return {
      accessToken: access_token,
      smart_formatting: true,
      format: true, // adds capitals, periods, and a few other things (client-side)
      model: model,
      objectMode: true,
      interim_results: true,
      // note: in normal usage, you'd probably set this a bit higher
      word_alternatives_threshold: 0.01,
      timestamps: true,
      url: serviceUrl,
      ...extra
    }
  }
}
