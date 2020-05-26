
export const TaskStatus = {
  'CREATED': 'created',
  'QUEUE': 'queue',
  'ERROR': 'error',
  'PROCESS': 'process',
  'COMPLETED': 'completed',
}

export const JobStatus = {
  'CREATED': 'created',
  'QUEUE': 'queue',
  'PROCESS': 'process',
  'COMPLETED': 'completed',
  'COMPLETED_WITH_ERRORS': 'completed_with_errors',
}


export const ResponseError = {
  'RECORD_NOT_FOUND': {
    type: 'RECORD_NOT_FOUND',
    code: 404,
    message: ({document, id}) => `${document || 'document'}(${id | ''}}) not found}`
  }
}

export const generateResponseError = (errorType, meta) => {
  if (!ResponseError[errorType]) {
    throw new Error('generateResponseError: errorType is not valid')
  }

  return [{
    type: ResponseError[errorType].type,
    code: ResponseError[errorType].code,
    message: ResponseError[errorType].message(meta)
  }, code]
}
