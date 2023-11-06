// Yellowstone Example.
//
// Connects to the specified RTSP server url,
// Once connected, opens a file and streams H264 and AAC to the files
//
// Yellowstone is written in TypeScript. This example uses Javascript and
// the typescript compiled files in the ./dist folder


const { RTSPClient, H264Transport, H265Transport, AACTransport } = require("../dist");
const fs = require("fs");
const { exit } = require("process");
const xml2js = require('xml2js');
const parser = new xml2js.Parser({ explicitArray: false, explicitCharkey: false, trim: true });

// User-specified details here.
const url = "rtsp://192.168.1.203/rtsp_tunnel?von=0&vcd=2&line=1"
const filename = "bigbuckbunny";
const username = "service";
const password = "Bosch2023!";

// Step 1: Create an RTSPClient instance
const client = new RTSPClient(username, password);

// Step 2: Connect to a specified URL using the client instance.
//
// "keepAlive" option is set to true by default
// "connection" option is set to "udp" by default. 
client.connect(url, { connection: "tcp" })
  .then(async (detailsArray) => {
    console.log("Connected");

    if (detailsArray.length == 0) {
      console.log("ERROR: There are no compatible RTP payloads to save to disk");
      exit();
    }

    for (let x = 0; x < detailsArray.length; x++) {
      let details = detailsArray[x];
      console.log(`Stream ${x}. Codec is`, details.codec);

      // Step 3: Open the output file
      if (details.codec == "H264") {
        const videoFile = fs.createWriteStream(filename + '.264');
        // Step 4: Create H264Transport passing in the client, file, and details
        // This class subscribes to the client 'data' event, looking for the video payload
        const h264 = new H264Transport(client, videoFile, details);
      }
      if (details.codec == "H265") {
        const videoFile = fs.createWriteStream(filename + '.265');
        // Step 4: Create H265Transport passing in the client, file, and details
        // This class subscribes to the client 'data' event, looking for the video payload
        const h265 = new H265Transport(client, videoFile, details);
      }
      if (details.codec == "AAC") {
        const audioFile = fs.createWriteStream(filename + '.aac');
        // Add AAC Transport
        // This class subscribes to the client 'data' event, looking for the audio payload
        const aac = new AACTransport(client, audioFile, details);
      }
    }

    // Step 5: Start streaming!
    await client.play();
    console.log("Play sent");

  })
  .catch(e => console.log(e));

// The "data" event is fired for every RTP packet.
client.on("data", async (channel, data, packet) => {
  // Create a TextDecoder with the desired encoding (e.g., UTF-8)
  const textDecoder = new TextDecoder('utf-8'); // Use 'utf-8' for UTF-8 encoding

// Convert the byte array to a string
  const text = textDecoder.decode(data);
  try {
    parser.parseString(text, (error, result) => {
      if (error) {
        //console.error(error);
      } 
      else {
        console.log(text)
        if (result['tt:MetadataStream']) {
          const createVisitDto = {
            //result['tt:MetadataStream']
          }
          console.log(result['tt:MetadataStream']);
        }
      }
    });
  }
  catch(err) {
    console.log(err)
  }
  
  //console.log(text)
  //console.log("RTP:", "Channel=" + channel, "TYPE=" + packet.payloadType, "ID=" + packet.id, "TS=" + packet.timestamp, "M=" + packet.marker);
});

// The "controlData" event is fired for every RTCP packet.
client.on("controlData", (channel, rtcpPacket) => {
  //console.log("RTCP:", "Channel=" + channel, "TS=" + rtcpPacket.timestamp, "PT=" + rtcpPacket.packetType);
});

// The "log" event allows y ou to optionally log any output from the library.
// You can hook this into your own logging system super easily.

client.on("log", (data, prefix) => {
  //console.log(prefix + ": " + data);
});

