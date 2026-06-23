import puppeteer from 'puppeteer-core';
import { promises as fs } from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\shice\\.gemini\\antigravity\脑\\814cde3a-c187-4959-82f8-dc2713785b5b'; // Wait! Let's make sure the path uses English characters for 'brain'!
// Ah! In my last script I wrote: C:\Users\shice\.gemini\antigravity\brain\814cde3a-c187-4959-82f8-dc2713785b5b. Let's make sure it is exactly that.
const SCREENSHOT_DIR_ENG = 'C:\\Users\\shice\\.gemini\\antigravity\\brain\\814cde3a-c187-4959-82f8-dc2713785b5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('Starting DataHive automation test...');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // 1. Load Homepage
    console.log('Step 1: Loading homepage...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR_ENG, 'test_1_homepage.png') });
    console.log('Homepage screenshot saved.');

    // 1.5. Log in (Auto-registration)
    console.log('Step 1.5: Logging in / Registering...');
    const headerRightButtons = await page.$$('.header-right button');
    let loginBtn = null;
    for (const btn of headerRightButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('登录 / 注册')) {
        loginBtn = btn;
        break;
      }
    }

    if (loginBtn) {
      await loginBtn.click();
      await delay(800); // wait for login modal to fade in
      
      const usernameInput = await page.$('#login-username');
      const passwordInput = await page.$('#login-password');
      const submitLoginBtn = await page.$('.modal-content button[type="submit"]');
      
      if (usernameInput && passwordInput && submitLoginBtn) {
        await usernameInput.type('测试人员小张');
        await passwordInput.type('123456');
        await delay(500);
        await submitLoginBtn.click();
        console.log('Login submitted.');
        await delay(1000); // wait for modal fade-out
      } else {
        console.error('Could not find login inputs inside modal!');
      }
    } else {
      console.error('Could not find 登录 / 注册 button!');
    }

    // 2. Click option to vote on feed (should NOT navigate)
    console.log('Step 2: Voting on the feed page...');
    // We target the first button in the first poll-card (Tencent Video)
    const voteButton = await page.$('.poll-card button');
    if (voteButton) {
      await voteButton.click();
      console.log('Voted for the first option on feed.');
      await delay(1000); // wait for sliding bar animation
      
      const currentUrl = page.url();
      console.log('Current URL after voting:', currentUrl);
      if (currentUrl.includes('#poll-')) {
        console.error('FAIL: Voting on feed page triggered page redirect!');
      } else {
        console.log('SUCCESS: Voted on feed without redirect.');
      }
      
      await page.screenshot({ path: path.join(SCREENSHOT_DIR_ENG, 'test_2_voted_on_feed.png') });
    } else {
      console.error('Could not find vote button!');
    }

    // 3. Click the card to enter details view (should scroll to comments)
    console.log('Step 3: Entering detailed view of the voted poll...');
    const pollTitle = await page.$('.poll-question');
    if (pollTitle) {
      await pollTitle.click();
      await delay(1500); // wait for transition and smooth scroll
      
      console.log('Entered detail page. URL is:', page.url());
      const scrollY = await page.evaluate(() => window.scrollY);
      console.log('Scroll position after entering detail page:', scrollY);
      
      if (scrollY > 50) {
        console.log('SUCCESS: Auto-scrolled to comments section (position > 50px).');
      } else {
        console.warn('WARNING: Page did not auto-scroll down to comments section!');
      }
      
      await page.screenshot({ path: path.join(SCREENSHOT_DIR_ENG, 'test_3_detail_page_voted.png') });
    }

    // 4. Submit a Comment
    console.log('Step 4: Submitting a new comment...');
    const nameInput = await page.$('.comment-input-box input');
    const textarea = await page.$('.comment-input-box textarea');
    const submitBtn = await page.$('.comment-input-box button[type="submit"]');

    if (textarea && submitBtn) {
      if (nameInput) {
        await nameInput.type('测试人员小张');
      }
      await textarea.type('这是一个自动化的评论测试，我选择腾讯视频是因为独播网剧比较好看！');
      await delay(500);
      await submitBtn.click();
      console.log('Comment submitted.');
      await delay(1000); // wait for DOM update
      
      await page.screenshot({ path: path.join(SCREENSHOT_DIR_ENG, 'test_4_comment_submitted.png') });
    } else {
      console.error('Could not find comment inputs!');
    }

    // 4.5. Go to User Profile by clicking nickname/avatar
    console.log('Step 4.5: Navigating to user profile page...');
    const commenterNameElement = await page.evaluateHandle(() => {
      const names = Array.from(document.querySelectorAll('.commenter-name'));
      return names.find(el => el.textContent.includes('测试人员小张'));
    });
    
    if (commenterNameElement) {
      const el = commenterNameElement.asElement();
      if (el) {
        await el.click();
        await delay(1000); // wait for navigation & transition
        console.log('Clicked commenter name. Current URL is:', page.url());
        if (page.url().includes('#user-')) {
          console.log('SUCCESS: Navigated to user profile page.');
        } else {
          console.error('FAIL: URL does not include #user-');
        }
        await page.screenshot({ path: path.join(SCREENSHOT_DIR_ENG, 'test_8_user_profile.png') });
        
        // Go back from user profile to detailed view
        console.log('Step 4.6: Returning back to detailed view from user profile...');
        const backBtn = await page.$('.back-nav-btn');
        if (backBtn) {
          await backBtn.click();
          await delay(1000); // wait for return transition
          console.log('Returned to page. Current URL is:', page.url());
        } else {
          console.error('Could not find back button on profile page!');
        }
      } else {
        console.error('commenterNameElement is not an element handle!');
      }
    } else {
      console.error('Could not find commenter name element containing "测试人员小张"!');
    }

    // 5. Change vote (Revote)
    console.log('Step 5: Testing Revoting / Change Choice...');
    const buttons = await page.$$('button');
    let revoteBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('修改选择')) {
        revoteBtn = btn;
        break;
      }
    }

    if (revoteBtn) {
      await revoteBtn.click();
      console.log('Clicked modify choice button.');
      await delay(1000); // wait for reset animation
      
      await page.screenshot({ path: path.join(SCREENSHOT_DIR_ENG, 'test_5_choice_cleared.png') });
      
      // Vote for another option (e.g. Bilibili - Option 4)
      const options = await page.$$('.option-btn');
      if (options.length >= 4) {
        await options[3].click(); // Click B站
        console.log('Re-voted for option 4 (Bilibili).');
        await delay(1500); // wait for scroll down and animations
        await page.screenshot({ path: path.join(SCREENSHOT_DIR_ENG, 'test_5_revoted_bilibili.png') });
      }
    } else {
      console.error('Could not find modifying vote button!');
    }

    // 6. Go back to feed and check scroll memory
    console.log('Step 6: Navigating back to feed...');
    const backBtn = await page.$('.back-nav-btn');
    if (backBtn) {
      await backBtn.click();
      await delay(1000); // wait for transition and restore scroll
      
      const scrollY = await page.evaluate(() => window.scrollY);
      console.log('Scroll position after returning to feed:', scrollY);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR_ENG, 'test_6_back_to_feed.png') });
    } else {
      console.error('Could not find back button!');
    }

    // 7. Create a New Poll
    console.log('Step 7: Opening create poll dialog...');
    const headerButtons = await page.$$('.header-right button');
    let createBtn = null;
    for (const btn of headerButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('发起话题')) {
        createBtn = btn;
        break;
      }
    }
    if (createBtn) {
      await createBtn.click();
      await delay(800); // wait for modal fade-in
      await page.screenshot({ path: path.join(SCREENSHOT_DIR_ENG, 'test_7_create_modal.png') });
      
      console.log('Filling create poll form...');
      const inputs = await page.$$('.modal-content input');
      const textareas = await page.$$('.modal-content textarea');
      const submitBtn = await page.$('.modal-content button[type="submit"]');
      
      if (inputs.length >= 4 && textareas.length >= 1 && submitBtn) {
        // Input 0: title
        await inputs[0].type('大家认为AI写代码好用吗？');
        // Textarea 0: desc
        await textareas[0].type('测试自动化创建的话题');
        // Input 1: tags
        await inputs[1].type('AI, 科技, 开发');
        // Input 2: Option 1
        await inputs[2].type('超级好用，提高10倍生产力');
        // Input 3: Option 2
        await inputs[3].type('还行，只能写写简单代码');
        
        await delay(500);
        await submitBtn.click();
        console.log('Submitted new poll form.');
        await delay(2000); // wait for creation and navigation
        
        console.log('New poll page URL:', page.url());
        await page.screenshot({ path: path.join(SCREENSHOT_DIR_ENG, 'test_7_poll_created.png') });
      } else {
        console.error('Could not find form inputs inside modal!');
      }
    } else {
      console.error('Could not find create poll button!');
    }

    console.log('All automated tests completed successfully!');

  } catch (error) {
    console.error('An error occurred during testing:', error);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

runTest();
