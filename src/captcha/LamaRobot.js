import axios from "axios"
import WebSocket from 'ws'

export default function LamaRobot({Token, RESPONSE_TIMEOUT = 10000}) {
  if (!Token) throw new Error('Token is required')

  this.axios = axios.create({
    baseURL: 'https://alpha.lamarobot.net/api/',
    headers: {
      "Authorization": `Token ${Token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    }
  })

  const wsInit = () => {
    this.ws = new WebSocket('wss://alpha.lamarobot.net/ws/jobs/status/', {
      headers: {
        authorization: `Token ${Token}`
      }
    })

    this.ws.on('open', () => {
      console.log('WebSocket connected...')
      this.ws.send(JSON.stringify({'ts': Date.now()}))
    })

    this.ws.on('close', (reason) => {
      console.log('WebSocket disconnected...', reason)
      wsInit()
    })

    this.ws.on('error', (e) => {
      console.log('error', e)
    })

    this.ws.on('message', (data) => {
      data = JSON.parse(data)
      if (data['ts']) {
        console.log(`Ping: ${Date.now() - data['ts']}ms`)
      }

      switch (data.status) {
        case 'SUCCESS':
          this.resolveJob(data)
          return
        case 'TIMED_OUT':
        case 'ERROR':
          // console.log({error: data.status, id: data.id})
          this.resolveJob({error: data.status, id: data.id})
          return
        default:
          // console.log('===', data)
      }
    })
  }

  wsInit()

  this.fetchBalance = async (balanceOnly = true) => {
    const response = await this.axios.get(`/users/me`)

    if (response.data.balance === undefined) throw new Error('Failed to get balance info')

    return balanceOnly ? response.data.balance : response.data
  }

  this.createJob = async (base64, idOnly = true) => {
    if (!base64 || typeof base64 !== 'string') throw new Error('image is not defined')

    const response = await this.axios.post(`/jobs/`, {'image': base64})

    if (response.data.id === undefined) throw new Error('Failed to get task id')

    return idOnly ? response.data.id : response.data
  }

  this.fetchJobStatus = async (jobId) => {
    if (!jobId) throw new Error('jobId is not defined')

    return await this.axios.get(`/jobs/${jobId}/`)
  }

  this.listen = (id) => {
    return new Promise(resolve => {
      setTimeout(async () => lastTry(id), RESPONSE_TIMEOUT)
      this.tasks[id] = resolve
    })
  }

  const lastTry = async (id) => {
    if (!this.tasks[id]) return

    const result = await this.fetchJobStatus(id)

    if (result.status === 'SUCCESS') {
      this.tasks[id](result)
    } else {
      this.tasks[id]({error: 'INNER_TIMED_OUT', id})
    }
  }

  this.resolveJob = ({id, solution}) => {
    this.tasks[id] && this.tasks[id](solution)
    delete this.tasks[id]
  }

  this.tasks = {}

  this.solveCaptcha = async (base64) => {
    try {
      const id = await this.createJob(base64)

      return await this.listen(id)
    } catch (e) {
      console.log('solveCaptcha', e)
    }
  }

  this.fetchJobList = async () => {
    return (await this.axios.get('/jobs')).data
  }
}
