import puppeteer from 'puppeteer-core';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\shice\\.gemini\\antigravity\\brain\\814cde3a-c187-4959-82f8-dc2713785b5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function logState(page, stepName) {
  const state = await page.evaluate(() => {
    return {
      url: window.location.href,
      hash: window.location.hash,
      currentIndex: sessionStorage.getItem('datahive_current_index'),
      prevHash: sessionStorage.getItem('datahive_prev_hash'),
      isBackNavigation: sessionStorage.getItem('datahive_is_back_navigation'),
      historyStack: JSON.parse(sessionStorage.getItem('datahive_history_stack') || '[]'),
      historyLength: window.history.length,
      historyState: window.history.state
    };
  });
  console.log(`\n=== STATE AFTER: ${stepName} ===`);
  console.log(`URL: ${state.url}`);
  console.log(`Index: ${state.currentIndex}, PrevHash: ${state.prevHash}, IsBack: ${state.isBackNavigation}`);
  console.log(`History State: ${JSON.stringify(state.historyState)}`);
  console.log(`History Stack (${state.historyStack.length} items):`);
  state.historyStack.forEach((item, idx) => {
    console.log(`  [${idx}]: ${JSON.stringify(item)}`);
  });
  console.log('==================================');
  return state;
}

async function runTest() {
  console.log('Starting custom navigation loop test...');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // 1. Load Homepage
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await delay(1000);
    await logState(page, 'Step 1: Load Homepage');

    // 2. Click first card to enter Poll Detail (Home -> Poll A)
    const pollTitle = await page.$('.poll-question');
    if (!pollTitle) throw new Error('No poll title found');
    await pollTitle.click();
    await delay(1000);
    await logState(page, 'Step 2: Enter Poll Detail (Home -> Poll A)');

    // 3. Click commenter name to go to User Profile (Poll A -> User B)
    // First wait for commenter name to be visible
    await page.waitForSelector('.commenter-name');
    const commenterName = await page.$('.commenter-name');
    if (!commenterName) throw new Error('No commenter name found');
    
    const usernameText = await page.evaluate(el => el.textContent, commenterName);
    console.log(`Navigating to profile of user: ${usernameText.trim()}`);
    await commenterName.click();
    await delay(1000);
    await logState(page, `Step 3: Enter User Profile (Poll A -> User B)`);

    // 4. Click "发表的观点" tab on user profile
    // Wait for tabs to render
    const tabs = await page.$$('.profile-card + div button'); // UserProfile tabs
    let commentsTab = null;
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text.includes('发表的观点')) {
        commentsTab = tab;
        break;
      }
    }
    if (commentsTab) {
      await commentsTab.click();
      await delay(500);
      console.log('Switched to Comments tab');
    }

    // Find a comment card to click and go back to Poll A (User B -> Poll A via comment link)
    const commentCard = await page.$('.profile-list-item'); // Precise class for comment cards in User Profile
    if (!commentCard) throw new Error('No comment card found in User Profile');
    await commentCard.click();
    await delay(1000);
    await logState(page, `Step 4: Click comment card to return to Poll A (User B -> Poll A)`);

    // 5. Click left-top back button: "返回个人主页"
    // Wait for back button in Poll Detail
    const backBtnPoll = await page.$('.back-nav-btn');
    if (!backBtnPoll) throw new Error('No back button found in Poll Detail page');
    const backBtnText = await page.evaluate(el => el.textContent, backBtnPoll);
    console.log(`Clicking back button in Poll: "${backBtnText}"`);
    await backBtnPoll.click();
    await delay(1000);
    await logState(page, `Step 5: Click "返回个人主页" button`);

    // 6. Click left-top back button: "返回上级页面" in User Profile
    const backBtnProfile = await page.$('.back-nav-btn');
    if (!backBtnProfile) throw new Error('No back button found in User Profile page');
    const backBtnText2 = await page.evaluate(el => el.textContent, backBtnProfile);
    console.log(`Clicking back button in Profile: "${backBtnText2}"`);
    await backBtnProfile.click();
    await delay(1000);
    await logState(page, `Step 6: Click "返回上级页面" button`);

    // 7. Click left-top back button: "返回话题列表" in Poll Detail
    const backBtnPoll2 = await page.$('.back-nav-btn');
    if (!backBtnPoll2) throw new Error('No back button found in Poll Detail page (again)');
    const backBtnText3 = await page.evaluate(el => el.textContent, backBtnPoll2);
    console.log(`Clicking back button in Poll (again): "${backBtnText3}"`);
    await backBtnPoll2.click();
    await delay(1000);
    const finalState = await logState(page, `Step 7: Click "返回话题列表" button`);

    if (finalState.hash === '' || finalState.hash === '#') {
      console.log('\nSUCCESS: Returned to Homepage!');
    } else {
      console.log('\nFAILURE: Failed to return to Homepage! Current Hash:', finalState.hash);
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

runTest();
