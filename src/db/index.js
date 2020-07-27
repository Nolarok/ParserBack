import mongoose from 'mongoose'

export async function dbConnect({host, port, name}) {
  console.log(`DB connect string: mongodb://${host}:${port}. DB name: ${name}`)

  const connection = await mongoose.connect(`mongodb://${host}:${port}`, {
    dbName: name,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // user: 'root',
    // pass: 'qwAZ11',
  }).catch(error => {
    console.error(error)
  })
}

