import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css'
import * as HIDCodes from '../HIDCodes.json';
import * as RGBModes from '../RGBModes.json';

let device;

// Led Colour asigned by default to each individual layer
let layer_colours = ["rgb(254,45,4)", "rgb(254,239,0)", "rgb(0,255,33)", "rgb(1,126,253)", "rgb(255,0,226)", "rgb(247,247,247)"]


export default function Home() {


  const [clockwise, setClockwise] = useState(4);
  const [antiClockwise, setAntiClockwise] = useState(5);
  const [button, setButton] = useState(9);
  const [rgbmode, setrgbmode] = useState(1);
  const [encMode, setEncMode] = useState(4);
  const [supportedBrowser, setSupportedBrowser] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);



  // Check that browser supports webHID and add some basic event listeners
  useEffect(() => {
    if (navigator.hid) {
      setSupportedBrowser(true)
      navigator.hid.addEventListener('connect', (event) => {
        console.log(`HID Connected: ${event.device.productName}`);
        console.dir(event)
      });
      navigator.hid.addEventListener('disconnect', (event) => {
        console.log(`HID disconnected: ${event.device.productName}`);
        console.dir(event)
        setDeviceConnected(false)
      });
    }
  }, []);

  // Handle attempts to connect to a device
  async function onPress() {
    // Reuqest a RGBDevice on the custom HID page
    device = await navigator.hid.requestDevice({ filters: [{ vendorId: 0x4550, productId: 0x0232, usagePage: 0xFF60, usage: 0x61 }] })
    console.log(`HID: ${device}`);
    device.forEach(d => console.log(d.collections.usage))
    // See if we have found a valid device
    if (device[0]) {
      // Open a connection to the device
      if (!device[0].opened) {
        await device[0].open()
        setDeviceConnected(true)
      }

      // Add the event listener for interpreting reports from the device
      device[0].addEventListener("inputreport", event => {
        const { data, device, reportId } = event;
        let array = []
        for (let i = 0; i < 4; i++) array.push((data.getInt16(2 * i)))
        // If the type code is 0x4551 we update the ui according to the keymap assigned for that layer
        if (array[0] == 17745) {
          setClockwise(array[1]);
          setAntiClockwise(array[2])
          setButton(array[3])
        }
        // If the type code is 0x4552 we set our current layer, this for example occurs if a user adjusts layer on there device
        if (array[0] == 17746) {
          handleEncMode(array[1])
        }
        //If the type code is 0x4553 we update stored rgb mode
        if (array[0] == 17747) {
          setrgbmode(array[1])
        }
      });
      // when the device is first opened we need to find out basic information on its current state
      // get current encoder layer
      let encdata = new Uint16Array([0x4552, 0x00, 0x00, 0x00]);
      await device[0].sendReport(0x00, encdata)
      // get current lighting
      let rgbdata = new Uint16Array([0x4553, 0xFFFF, 0x00, 0x00]);
      await device[0].sendReport(0x00, rgbdata)

    }
  }

  //structure for HID change messages
  /*
  * Update a keybinding
  * 0 type code 0x4550
  * 1 Encoder Mode Code between 0x01 and 0x06
  * 2 Key: 
  *      clockwise 0x01
  *      anticlockwise 0x02
  *      button 0x03
  * 4 Keycode
  */
  async function updateKeymap(key, e) {
    let data = new Uint16Array([0x4550, encMode, key, e.target.value]);
    await device[0].sendReport(0x00, data)

  }

  /*
  * Update the grb settings on the device
  * 0 type code 0x4553
  * 1 RGB Mode
  */
  async function updateRGB(e) {
    let data = new Uint16Array([0x4553, e.target.value]);
    await device[0].sendReport(0x00, data)

  }

  /*
  * Load an encoder mode from the device 
  * 0 type code 0x4551
  * 1 Encoder Mode
  */
  async function handleEncMode(encMode) {
    setEncMode(encMode);
    let data = new Uint16Array([0x4551, encMode]);
    await device[0].sendReport(0x00, data)
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>RGBKnob Control</title>
        <meta name="description" content="Control for RGB Knob" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className={styles.header}>
        <h1>RGBKnob Control</h1>
      </header>

      {supportedBrowser &&
        <main className={styles.main}>
          {/* If No device Connected we show our connect button which allows a user to request to connect to the device */}
          {deviceConnected == false &&
            <button className={styles.button} onClick={onPress}>
              Connect to device
            </button>
          }
          {/* Once a device is connected we showcase the modificaation menu */}
          {deviceConnected &&
            <div className={styles.main}>
              <div className={styles.wrapper} style={{ transform: "rotate(30deg)" }}>
                <div className={styles.sector} style={{ transform: "rotate(60deg)  skew(30deg)", background: layer_colours[0], opacity: (((encMode == 0) ? 100 : 50) + "%") }} onClick={() => handleEncMode(0)}></div>
                <div className={styles.sector} style={{ transform: "rotate(120deg) skew(30deg)", background: layer_colours[1], opacity: (((encMode == 1) ? 100 : 50) + "%") }} onClick={() => handleEncMode(1)}></div>
                <div className={styles.sector} style={{ transform: "rotate(180deg) skew(30deg)", background: layer_colours[2], opacity: (((encMode == 2) ? 100 : 50) + "%") }} onClick={() => handleEncMode(2)}></div>
                <div className={styles.sector} style={{ transform: "rotate(240deg) skew(30deg)", background: layer_colours[3], opacity: (((encMode == 3) ? 100 : 50) + "%") }} onClick={() => handleEncMode(3)}></div>
                <div className={styles.sector} style={{ transform: "rotate(300deg) skew(30deg)", background: layer_colours[4], opacity: (((encMode == 4) ? 100 : 50) + "%") }} onClick={() => handleEncMode(4)}></div>
                <div className={styles.sector} style={{ transform: "rotate(360deg) skew(30deg)", background: layer_colours[5], opacity: (((encMode == 5) ? 100 : 50) + "%") }} onClick={() => handleEncMode(5)}></div>
                <div className={styles.center} style={{ transform: "rotate(330deg)" }}>
                  <div className={styles.centerImg}>
                    <Image
                      alt="SF Logo"
                      src="/SmoothFaces_icon.png"
                      objectPosition="center"
                      layout="fill"
                      quality={100} />
                  </div>
                </div>
              </div>
              <span className="dot"></span>
              <form className={styles.formContainer}>
                <div className={styles.form}>
                  <label>Anti-Clockwise:  </label>
                  <select value={antiClockwise} style={{ float: "right", backgroundColor: layer_colours[encMode] }} onChange={(e) => { setAntiClockwise(e.target.value); updateKeymap(0x01, e) }}>
                    {Object.entries(HIDCodes).map(([key, value]) => <option key={value} value={value}>{key}</option>)}
                  </select>
                </div>
                <div className={styles.form}>
                  <label>Button:</label>
                  <select value={button} style={{ float: "right", backgroundColor: layer_colours[encMode] }} onChange={(e) => { setButton(e.target.value); updateKeymap(0x02, e) }}>
                    {Object.entries(HIDCodes).map(([key, value]) => <option key={value} value={value}>{key}</option>)}
                  </select>
                </div>
                <div className={styles.form}>
                  <label>Clockwise:</label>
                  <select value={clockwise} style={{ float: "right", backgroundColor: layer_colours[encMode] }} onChange={(e) => { setClockwise(e.target.value); updateKeymap(0x00, e) }}>
                    {Object.entries(HIDCodes).map(([key, value]) => <option key={value} value={value}>{key}</option>)}
                  </select>
                </div>
                <div className={styles.form}>
                  <label>RGB Mode:</label>
                  <select value={rgbmode} style={{ float: "right", backgroundColor: "rgb(199,199,199)" }} onChange={(e) => { setrgbmode(e.target.value); updateRGB(e) }}>
                    {Object.entries(RGBModes).map(([key, value]) => <option key={value} value={value}>{key}</option>)}
                  </select>
                </div>
              </form>
            </div>
          }
        </main>
      }
      {/* If the browser does not support webHID we inform the user to this fact */}
      {supportedBrowser == false &&
        <main className={styles.main}>
          <p style={{ color: "red" }}>Unsupported Web-Browser, please use one that is compatible with WebHID</p>
          <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API#browser_compatibility"
            style={{ textDecoration: "underline", color: "red" }}>
            List of compatible Browsers
          </a>
        </main>
      }

      <footer className={styles.footer}>
        <a
          href="https://epkb.design"
          target="_blank"
          rel="noopener noreferrer"
        >
          Configurator designed By Elliot Powell
        </a>
      </footer>
    </div>
  )
}
