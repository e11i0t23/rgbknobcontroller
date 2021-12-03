import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css'
import setUpListeners from './api/hello';
import * as HIDCodes from '../HIDCodes.json';
import * as RGBModes from '../RGBModes.json';

let device;
let webHID;


export default function Home() {
  
  
  const [clockwise, setClockwise] = useState(4);
  const [antiClockwise, setAntiClockwise] = useState(5);
  const [button, setButton] = useState(9);
  const [rgbmode, setrgbmode] = useState(1);
  const [encMode, setEncMode] = useState(4);
  const [supportedBrowser, setSupportedBrowser] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);




  useEffect(() => {
    webHID = navigator.hid
    console.log(webHID);
    console.log(navigator.hid)
    if (navigator.hid){
      setSupportedBrowser(true)
      setUpListeners()
      async function getDevices () {
    
        let devices = await navigator.hid.getDevices();
        devices.forEach(device => {
          console.log(`HID: ${device.productName}`);
        });
      }
      getDevices()
      navigator.hid.addEventListener('disconnect', device => {
        setDeviceConnected(false)
      });
    }
  }, []);

  async function onPress(){
    console.log("pressed")
    device = await navigator.hid.requestDevice({filters: [{ vendorId:  0x4550, productId: 0x0232, usagePage: 0xFF60, usage:0x61}]})
    console.log(`HID: ${device}`);
    device.forEach( d => console.log(d.collections.usage))
    setDeviceConnected(true)
    if (!device[0].opened){
      await device[0].open()
    }
    console.log(device[0])
    device[0].addEventListener("inputreport", event => {
      const { data, device, reportId } = event;
      console.log(data)
      let array = []
      for (let i = 0; i < 4; i++) array.push((data.getInt16(2*i)))
      if (array[0] == 17745){
        setClockwise(array[1]);
        setAntiClockwise(array[2])
        setButton(array[3])
      }
      if (array[0] == 17746){
        handleEncMode(array[1])
      }
      if (array[0] == 17747){
        setrgbmode(array[1])
      }


      console.log(array)

    });
    // get current encoder layer
    let encdata = new Uint16Array([0x4552, 0x00, 0x00, 0x00]);
    await device[0].sendReport(0x00, encdata)
    // get current lighting
    let rgbdata = new Uint16Array([0x4553, 0x00, 0x00, 0x00]);
    await device[0].sendReport(0x00, rgbdata)
    
  }
  async function sendReport(){
    console.log("t")
    if (!device[0].opened){
      await device[0].open()
    }
    let data = new Uint8Array([10,1,12,3,4,5,6,17])
    console.log(data)
    await device[0].sendReport(0x00, data)
  }

  //structure for HID change messages
  /*
  * 0 prject code 0x45
  * 1 Encoder Mode Code between 0x01 and 0x06
  * 2 Key: 
  *      clockwise 0x01
  *      anticlockwise 0x02
  *      button 0x03
  * 4 Keycode
  */ 
  async function updateKeymap(key, e){
    console.log(e.target.value);
    let data = new Uint16Array([0x4550, encMode, key, e.target.value]);
    await device[0].sendReport(0x00, data)

  }

  async function updateRGB(e){
    console.log(e.target.value);
    let data = new Uint16Array([0x4553, e.target.value]);
    await device[0].sendReport(0x00, data)

  }

  async function handleEncMode(encMode){
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
        
      { supportedBrowser && 
      <main className={styles.main}>
          { deviceConnected == false &&
            <button className={styles.button} onClick={onPress}>
            Connect to device
          </button>
          }
          { deviceConnected &&
          <div className={styles.main}>
            <div className={styles.wrapper} style={{transform: "rotate(30deg)"}}>
            <div className={styles.sector}  style={{transform: "rotate(60deg)  skew(30deg)", background:"rgb(254,45,4)",    opacity:(((encMode==0) ? 100 : 50 )+"%")}} onClick={() => handleEncMode(0)}></div>
            <div className={styles.sector}  style={{transform: "rotate(120deg) skew(30deg)", background:"rgb(254,239,0)",   opacity:(((encMode==1) ? 100 : 50 )+"%")}} onClick={() => handleEncMode(1)}></div>
            <div className={styles.sector}  style={{transform: "rotate(180deg) skew(30deg)", background:"rgb(0,255,33)",    opacity:(((encMode==2) ? 100 : 50 )+"%")}} onClick={() => handleEncMode(2)}></div>
            <div className={styles.sector}  style={{transform: "rotate(240deg) skew(30deg)", background:"rgb(1,126,253)",   opacity:(((encMode==3) ? 100 : 50 )+"%")}} onClick={() => handleEncMode(3)}></div>
            <div className={styles.sector}  style={{transform: "rotate(300deg) skew(30deg)", background:"rgb(255,0,226)",   opacity:(((encMode==4) ? 100 : 50 )+"%")}} onClick={() => handleEncMode(4)}></div>
            <div className={styles.sector}  style={{transform: "rotate(360deg) skew(30deg)", background:"rgb(247,247,247)", opacity:(((encMode==5) ? 100 : 50 )+"%")}} onClick={() => handleEncMode(5)}></div>
            <div className={styles.center}  style={{transform: "rotate(330deg)"}}>
              <div className={styles.centerImg}>
                <Image 
                alt="SF Logo"
                src="/SmoothFaces_icon.png"
                objectPosition= "center"
                layout="fill"
                quality={100}/>
              </div>
            </div>
            </div>
                    <span className="dot"></span>
                    <form className={styles.formContainer}>
                      <div className={styles.form}>
                      <label>Anti-Clockwise:  </label>
                      <select value={antiClockwise} style={{float: "right"}} onChange={(e) => {console.log(e.target.value); setAntiClockwise(e.target.value); updateKeymap(0x01, e)}}>
                        {Object.entries(HIDCodes).map(([key, value]) => <option key={value} value={value}>{key}</option>)}
                      </select>
                      </div>
                      <div className={styles.form}>
                      <label>Button:</label>
                      <select value={button} style={{float: "right"}} onChange={(e) => {setButton(e.target.value); updateKeymap(0x02, e)}}>
                        {Object.entries(HIDCodes).map(([key, value]) => <option key={value} value={value}>{key}</option>)}
                      </select>
                      </div>
                      <div className={styles.form}>
                      <label>Clockwise:</label>
                      <select value={clockwise} style={{float: "right"}} onChange={(e) => {setClockwise(e.target.value); updateKeymap(0x00, e)}}>
                        {Object.entries(HIDCodes).map(([key, value]) => <option key={value} value={value}>{key}</option>)}
                      </select>
                      </div>
                      <div className={styles.form}>
                      <label>RGB Mode:</label>
                      <select value={rgbmode} style={{float: "right"}} onChange={(e) => {setrgbmode(e.target.value); updateRGB(e)}}>
                        {Object.entries(RGBModes).map(([key, value]) => <option key={value} value={value}>{key}</option>)}
                      </select>
                      </div>
                    </form>
                    </div>
          }
        </main>
        }
        { supportedBrowser==false &&
        <main className={styles.main}>
          <p>Unsupported Web-Browser, please use one that is compatible with WebHID</p>
          <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API#browser_compatibility"
            style={{textDecoration:"underline"}}>
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
          Configurator designed By Elliot Powell, EPKB.DESIGN {' '}
        </a>
      </footer>
    </div>
  )
}
