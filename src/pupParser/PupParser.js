"use strict"
import puppeteer from 'puppeteer'
import {RESULT, INPUT_TYPE} from './types'
import PupTask from './PupTask'
import {Queue} from './queue'

export default function Pup() {
  this.pages = []
  this.tasks = {}

  this.init = async (launchOptions, proxy) => {
    this.browser = await puppeteer.launch(launchOptions)
    return this.browser
  }

  this.createPage = async (url, interceptors, auth) => {
    const context = await this.browser.createIncognitoBrowserContext()
    const page = await context.newPage()
    await page.setViewport({height: 1680, width: 1920})
    auth && await page.authenticate(auth)

    interceptors && await page.setRequestInterception(interceptors)
    interceptors && await interceptors(page)

    this.pages.push(page)
    await page.goto(url)

    return page
  }

  this.createTask = (name, options, initial) => {
    this.tasks[name] = new PupTask(this.createPage, options, initial)
    return this.tasks[name]
  }

  this.runSeries = async (taskName, initialArray, options) => {
    return new Promise(async (res, rej) => {
      const result = []
      const queue = new Queue(initialArray, options.numberOfThreads)
      queue.setHandler(async (data) => {
        options.before && options.before(data)
        await runTask(this.tasks[taskName], data)
          .then(result => {
            options.after && options.after(data, result)
          })
          .catch((error) => {
            console.log('!!!!!!!!!!!!!!!!')
            console.error(error)
            rej(error)
          })
        return result
      })

      queue.setFinishCallback((data) => {
        result.push(data)
      })

      await queue.start()

      res(result)
    })
  }

  let numberActiveProcesses = 0

  const runTask = async (task, initials) => {
    numberActiveProcesses++
    const result = await task.run(initials)
    numberActiveProcesses--

    return result
  }

  this.fillForm = async (page, data) => {
    for (let i = 0; i < data.length; i++) {
      await this.fillInput(page, data[i])
      await page.waitFor(50)
    }
  }

  this.fillInput = async (page, {selector, value, options = {delay: 10, type: INPUT_TYPE.SCRIPT}, afterInput}) => {
    if (options.type === INPUT_TYPE.SCRIPT) {
      const injection = `document.querySelector('${selector}').value = "${value}"`
      await page.evaluate(injection)
      afterInput && await afterInput()
      return
    }

    await page.type(selector, value, options)
    afterInput && await afterInput()
  }

  this.clearInput = async (page, selector, type = INPUT_TYPE.SCRIPT) => {
    if (type === INPUT_TYPE.SCRIPT) {
      const injection = `document.querySelector('${selector}').value = ""`
      await page.evaluate(injection)

      return
    }

    if (type === INPUT_TYPE.KEYBOARD) {
      await page.click(selector)
      await page.keyboard.down("Control")
      await page.keyboard.press("KeyA")
      await page.keyboard.up("Control")
      await page.keyboard.press("Backspace")

      return
    }
  }

  this.close = async () => {
    await this.browser.close()
  }

  this.waitForResponse = async (page, string) => {
    return await page.waitForResponse(response => {
      return response.url().startsWith(string)
    })
  }

  this.waitForRequest = async (page, string) => {
    return await page.waitForRequest(response => {
      return response.url().includes(string)
    })
  }
}
