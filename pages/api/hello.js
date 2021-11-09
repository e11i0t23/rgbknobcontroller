// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function setUpListeners(req, res) {
  navigator.hid.addEventListener('connect', (event) => {
    console.log(`HID Connected: ${event.device.productName}`);
    console.dir(event) 
  });
  navigator.hid.addEventListener('disconnect', (event) => {
    console.log(`HID disconnected: ${event.device.productName}`);
    console.dir(event)
  });
}


//structure for HID change messages
/*
 * 0 prject code
 * 1 Mode Code between 0x01 and 0x06
 * 2 Key: 
 *      clockwise 0x01
 *      anticlockwise 0x02
 *      button 0x03
 * 4 Keycode
 */ 

