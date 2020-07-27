import mongoose from 'mongoose'

export async function dbConnect({host, port, name}) {
  const connection = await mongoose.connect(`mongodb://${host}:${port}`, {
    dbName: name,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    user: 'root',
    pass: 'qwAZ11',
  }).catch(error => {
    console.error(error)
  })
}

