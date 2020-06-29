import PupParser from './PupParser'
import LamaRobot from '../captcha/LamaRobot'
import {INPUT_TYPE, RESULT} from './types'
import {DocumentType} from '../excel'

const MAX_PAGE_LIFE = 45000
const parser = new PupParser({
  headless: true,
  args: ['--no-sandbox']
})
const lamaRobot = new LamaRobot({Token: '0ba2f20951acb3c57fdeadd91eb358ec3d4a91ba'})

export const FSSPParser = async (parseType, taskList, before, after) => {
  const id = Math.random()
  console.time(id)
  FSSPParser.browser = await parser.init()

  const FIOTask = parser.createTask('parseByFIO', {
    maxNumberOfAttempts: 1,
    errorScript: (data) => {
      if (data.createPage && data.createPage && data.createPage.page) {
        data.createPage.page.close()
      }
    }
  })

  FIOTask.addScript('createPage', createPage)
  FIOTask.addScript('searchPage', searchPage)
  FIOTask.addScript('resolveCaptcha', resolveCaptcha)
  FIOTask.addScript('parseTable', parseTable)

  const IPTask = parser.createTask('parseByIP', {
    maxNumberOfAttempts: 1,
    errorScript: (data) => {
      if (data.createPage && data.createPage && data.createPage.page) {
        data.createPage.page.close()
      }
    }
  })

  IPTask.addScript('createPage', createPage)
  IPTask.addScript('searchPage', searchPageIP)
  IPTask.addScript('resolveCaptcha', resolveCaptcha)
  IPTask.addScript('parseTable', parseTable)

  if (parseType === DocumentType.FIO) {
    await parser.runSeries('parseByFIO', taskList, {
      numberOfThreads: 8,
      after,
      before,
    })
  }

  if (parseType === DocumentType.IP) {
    await parser.runSeries('parseByIP', taskList, {
      numberOfThreads: 8,
      after,
      before,
    })
  }

  await parser.browser.close()
  console.timeEnd(id)
}

async function createPage(data) {
  const page = await parser.createPage('http://fssprus.ru/iss/ip')
  // const timer = setTimeout(() => {
  //   console.error('script timeout')
  //   page.close()
  // }, MAX_PAGE_LIFE)
  return {
    page,
    initial: data.initial,
  }
}

async function searchPage(data) {
  try {
    const initial = data.initial
    const page = data.createPage.page

    const inputData = [
      {selector: '#input01', value: initial['Имя']},
      {selector: '#input02', value: initial['Фамилия']},
      {selector: '#input05', value: initial['Отчество']},
      {selector: '#input06', value: initial['Дата']},
      {
        selector: '#region_id_chosen > div > div > input',
        value: 'Все регионы',
        options: {type: INPUT_TYPE.KEYBOARD},
        afterInput: async () => {
          await page.waitFor(200) // TODO
          await page.keyboard.press('Enter')
        }
      },
    ]
    await parser.fillForm(page, inputData)
    await page.waitFor(200)
    // page.screenshot({path: `./screen/test${+new Date()}.png`})
    await page.click('#btn-sbm')
    await parser.waitForResponse(page, 'https://is.fssp.gov.ru/ajax_search')

    return {page}
  } catch (error) {
    // console.log(error)
    // await page.screenshot({path: `./screen/scripts/searchPage/${+new Date()}.png`})
    throw error
  }
}

async function searchPageIP(data) {
  try {
    const initial = data.initial
    const page = data.createPage.page

    await page.click('#ip_form > div > div.row.e-inputgroup > div:nth-child(3) > label')
    await page.waitFor(200)

    const inputData = [
      {
        selector: '#input04',
        value: initial['Номер_ИП'],
      },
    ]
    await parser.fillForm(page, inputData)
    await page.waitFor(200)
    // page.screenshot({path: `./screen/test${+new Date()}.png`})
    await page.click('#btn-sbm')
    console.log('...........')
    await parser.waitForResponse(page, 'https://is.fssp.gov.ru/ajax_search')

    return {page}
  } catch (error) {
    // console.log(error)
    // await page.screenshot({path: `./screen/scripts/searchPage/${+new Date()}.png`})
    throw error
  }
}

async function resolveCaptcha(data) {
  const {page} = data.searchPage

  try {
    let captchaImage, inputString

    for (let i = 0; i < 3; i++) {
      try {
        await page.waitFor('#capchaVisual', {timeout: 3000})
      } catch {
        continue
      }

      captchaImage = await page.evaluate('document.querySelector("#capchaVisual").getAttribute("src")')
      inputString = await lamaRobot.solveCaptcha(captchaImage)
      console.log('captcha: ', inputString)


      if (inputString && !inputString.error) {

        await parser.fillInput(page, {
          selector: '#captcha-popup-code',
          value: inputString,
          afterInput: async () => {
            await page.focus('#captcha-popup-code')
            await page.keyboard.press('Enter')
          }
        })

        await parser.waitForResponse(page, 'https://is.fssp.gov.ru/ajax_search')

        if (!(await page.$('.b-form__label.b-form__label--error'))) {
          break
        } else {
          console.error('Invalid captcha: ', inputString && !inputString.error)
          // await page.screenshot({path: `./screen/${+new Date()}.png`})
        }
      }
      else {
        console.error('Invalid captcha: ', inputString && !inputString.error)
        // await page.screenshot({path: `./screen/${+new Date()}.png`})
        page.click('#capchaVisual')
        await parser.waitForResponse(page,  'data:image')
      }
    }

    return {page}
  } catch(error) {
    // console.error(error)
    // await page.screenshot({path: `./screen/scripts/resolveCaptcha/${+new Date()}.png`})
    throw error
  }
}

async function parseTable(data) {
  const {page} = data.resolveCaptcha
  try {
    const initial = data.initial

    // проверка наличия данных
    await page.waitFor(250)
    if (await page.$('.b-search-message')) {
      await page.close()
      return [
        [
          `${initial['Фамилия']} ${initial['Имя']}  ${initial['Отчество']} ${initial['Дата']}`,
          'Нет данных', 'Нет данных', 'Нет данных', 'Нет данных', 'Нет данных', 'Нет данных'
        ]
      ]
    }

    const getTableData = async () => {
      await page.waitFor(400)

      try {
        await page.waitFor(100)
        return await page.evaluate(`
        document.querySelectorAll('.ipcomment').forEach(div => div.remove())
        var rows = document.querySelector('table').rows
        rows.map = [].map
        rows.map((row, index) => {
          if (index < 1 || row.classList.contains('region-title')) return null
          const cells = row.cells
          cells.map = [].map
          return cells.map((cell, index) => {
            if (index === 4) return null
            return cell.innerHTML.replace(/<br>/g, '; ') //.replace(/,/g, ';  ')
          }).filter(cell => cell !== null)
        }).filter(row => row !== null)
      `)
      } catch(error) {
        console.error(error)
        return []
        // page.screenshot({path: `./screen/tableErrors/${+new Date}.png`})
      }
    }

    let tableData = [...await getTableData()]

    // сбор данных таблицы по страницам
    while (await page.$('.pagination .active + a')) {
      await page.click('.pagination .active + a')
      await parser.waitForResponse(page, 'https://is.fssp.gov.ru/ajax_search')

      // проверка наличия запроса капчи
      try {
        if (await page.waitFor('#capchaVisual', {timeout: 200})) {
          await resolveCaptcha(data)
        }
      } catch (e) {}

      tableData = [...tableData, ...await getTableData()]
    }

    // clearTimeout(data.createPage.timer)
    await page.close()

    return tableData
  } catch (error) {
    // console.log(error)
    // await page.screenshot({path: `./screen/scripts/searchPage/${+new Date()}.png`})
    throw error
  }

}

async function pageInterceptors(page) {
  page.on('request', async (interceptedRequest) => {
    // console.log(interceptedRequest.url().slice(0, 75))
    const url = interceptedRequest.url()
    if (
      /getUserRegionCode/.test(url)
      || interceptedRequest.resourceType() === 'font'
      || url.startsWith('https://mc.yandex.ru/')
      || url.startsWith('http://stat.sputnik.ru/')
      || (interceptedRequest.resourceType() === 'image' && !url.startsWith('data:'))
    ) {
      interceptedRequest.continue()
    } else {
      interceptedRequest.continue()
    }
  })
}
