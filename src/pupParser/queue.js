export function Queue (input, length) {
  let _callback = () => {}
  let _handler = () => {}
  let _resolve
  let _reject

  let counter = 0
  let end = new Promise((resolve, reject) => {
    _resolve = resolve
    _reject = reject
  })

  this.start = async () => {
    this.queue = []

    for (let i = 0; i < (input.length < length ? input.length : length); i++) {
      this.add(input[i])
      await delay(2500)
    }

    await end
  }

  this.add = (data) => {
    if (this.queue.length < length) {
      console.time(counter)
      const timerId = counter
      const promise = _handler(data)
        .then((data) => {
          _callback(data)
        })
        .catch(error => {
          if (error.message === 'Server overload') {
            this.queue = []
            _reject(error)
          }
        })
        .finally(() => {
          this.remove(promise)
          console.timeEnd(timerId)

          counter++

          if ((this.queue.length < length) && (counter < input.length)) {
            this.add(input[counter])
          }
        })

      this.queue.push(promise)

      return
    }

    console.log('The queue is full')
  }

  this.remove = (task) => {
    this.queue = this.queue.filter(item => item !== task)
    // console.log({'this.queue.length': this.queue.length, 'input.length': input.length,  counter: counter + 1})
    if (this.queue.length === 0 && counter + 1 >= input.length) {
      _resolve()
    }
  }

  this.clear = () => {
    this.queue = []
    counter = 0
  }

  this.setFinishCallback = (callback) => {
    _callback = callback
  }

  this.setHandler = (handler) => {
    _handler = handler
  }
}


export function delay(time = 500) {
  return new Promise(resolve => {
    setTimeout(() => { resolve() }, time)
  })
}
