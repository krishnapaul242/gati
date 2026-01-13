/**
 * Automated GIF creation using Puppeteer
 * Run: node scripts/create-demo-gif.js
 * 
 * Prerequisites:
 * npm install puppeteer puppeteer-screen-recorder
 */

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

async function createDemoGif() {
  console.log('Starting demo recording...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  const recorder = new PuppeteerScreenRecorder(page);
  
  await recorder.start('./demo.mp4');
  
  await page.goto('http://localhost:3000/api/todos');
  await page.waitForTimeout(2000);
  
  await page.evaluate(async () => {
    const res1 = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Learn Gati' })
    });
    console.log('Created:', await res1.json());
    
    await new Promise(r => setTimeout(r, 1000));
    
    const res2 = await fetch('/api/todos');
    console.log('List:', await res2.json());
  });
  
  await page.waitForTimeout(3000);
  
  await recorder.stop();
  await browser.close();
  
  console.log('✅ Demo recorded to demo.mp4');
  console.log('Convert to GIF: ffmpeg -i demo.mp4 -vf "fps=10,scale=800:-1" preview.gif');
}

createDemoGif().catch(console.error);
