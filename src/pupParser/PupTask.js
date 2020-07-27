import {RESULT} from "./types"

export default function PupTask(createPage, options, initial) {
  this.scripts = []

  const getScript = (name) => {
    this.scripts.find(script => script.name === name)
  }

  this.addScript = (name, script) => {
    if (getScript(name)) {
      throw new Error(`Script ${name} is already exist`)
    }

    this.scripts.push({name, script})
  }

  this._execute = async () => {
    let data = {...data, ...initial}
    let name = ''

    try {
      for (let i = 0; i < this.scripts.length; i++) {
        name = this.scripts[i].name
        data = {...data, [this.scripts[i].name]: await this.scripts[i].script(data)}
      }
    } catch (error) {

      if (error.message === 'Server overload') {
        throw error
      }

      console.error(`Script ${name} was failed: ${error.message}`)

      return {
        result: RESULT.FAIL,
        data,
        error,
      }
    }

    return {
      result: RESULT.SUCCESS,
      data,
    }
  }

  this.run = async (initial) => {
    let numberOfAttempts = 0
    if (this.scripts[0] && this.scripts[0].name === 'initial') {
      this.scripts.shift()
    }

    this.scripts.unshift({
      name: 'initial',
      script: async () => initial
    })

    let result = {}

    while (result.result !== RESULT.SUCCESS && numberOfAttempts < (options.maxNumberOfAttempts || 1)) {
      numberOfAttempts++

      try {
        result = await this._execute()
      } catch (error) {

        if (error.message === 'Server overload') {
          throw error
        }
      }

      if (result.result === RESULT.FAIL) {
        try {
          options.errorScript && options.errorScript(result.data)
        } catch(error) {
          console.error('errorScript error:', error)
        }
      }
    }

    return result
  }
}
