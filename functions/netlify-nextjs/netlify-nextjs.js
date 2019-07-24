// const Stream = require("stream")
// const queryString = require("querystring")

// const reqResMapper = (event, callback) => {
//   const base64Support = process.env.BINARY_SUPPORT === "yes"
//   const response = {
//     body: Buffer.from(""),
//     isBase64Encoded: base64Support,
//     statusCode: 200,
//     multiValueHeaders: {}
//   }

//   const req = new Stream.Readable()
//   req.url = (event.requestContext.path || event.path || "").replace(new RegExp("^/" + event.requestContext.stage), "")

//   let qs = ""

//   if (event.multiValueQueryStringParameters) {
//     qs += queryString.stringify(event.multiValueQueryStringParameters)
//   }

//   if (event.pathParameters) {
//     const pathParametersQs = queryString.stringify(event.pathParameters)

//     if (qs.length > 0) {
//       qs += `&${pathParametersQs}`
//     } else {
//       qs += pathParametersQs
//     }
//   }

//   const hasQueryString = qs.length > 0

//   if (hasQueryString) {
//     req.url += `?${qs}`
//   }

//   req.method = event.httpMethod
//   req.rawHeaders = []
//   req.headers = {}

//   const headers = event.multiValueHeaders || {}

//   for (const key of Object.keys(headers)) {
//     for (const value of headers[key]) {
//       req.rawHeaders.push(key)
//       req.rawHeaders.push(value)
//     }
//     req.headers[key.toLowerCase()] = headers[key].toString()
//   }

//   req.getHeader = (name) => {
//     return req.headers[name.toLowerCase()]
//   }
//   req.getHeaders = () => {
//     return req.headers
//   }

//   req.connection = {}

//   const res = new Stream()
//   Object.defineProperty(res, "statusCode", {
//     get() {
//       return response.statusCode
//     },
//     set(statusCode) {
//       response.statusCode = statusCode
//     }
//   })
//   res.headers = {}
//   res.writeHead = (status, headers) => {
//     response.statusCode = status
//     if (headers) res.headers = Object.assign(res.headers, headers)
//   }
//   res.write = (chunk) => {
//     response.body = Buffer.concat([response.body, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)])
//   }
//   res.setHeader = (name, value) => {
//     res.headers[name] = value
//   }
//   res.removeHeader = (name) => {
//     delete res.headers[name]
//   }
//   res.getHeader = (name) => {
//     return res.headers[name.toLowerCase()]
//   }
//   res.getHeaders = () => {
//     return res.headers
//   }
//   res.end = (text) => {
//     if (text) res.write(text)
//     response.body = Buffer.from(response.body).toString(base64Support ? "base64" : undefined)
//     response.multiValueHeaders = res.headers
//     res.writeHead(response.statusCode)
//     fixApiGatewayMultipleHeaders()
//     callback(null, response)
//   }
//   if (event.body) {
//     req.push(event.body, event.isBase64Encoded ? "base64" : undefined)
//     req.push(null)
//   }

//   function fixApiGatewayMultipleHeaders() {
//     for (const key of Object.keys(response.multiValueHeaders)) {
//       if (!Array.isArray(response.multiValueHeaders[key])) {
//         response.multiValueHeaders[key] = [response.multiValueHeaders[key]]
//       }
//     }
//   }

//   return { req, res }
// }

// // const compat = require("next-aws-lambda");
// const page = require("./pages/post")

// exports.handler = (event, context, callback) => {
//   event.requestContext = {}
//   const { req, res } = reqResMapper(event, callback)
//   // event.pathにはリライトされたURLが入る(ex. /posts/2)
//   const match = event.path.match(/posts\/(\d+)/)
//   console.log("[render] ", event.path, match)
//   console.log(match)
//   if (!match) {
//     return callback(null, {
//       statusCode: 404,
//       body: ""
//     })
//   }
//   req.query = {
//     id: match[1]
//   }
//   console.log("[header]", event.queryStringParameters, req.query, req.query["id"])
//   page.render(req, res)
// }

const compat = require("next-aws-lambda")
const fs = require("fs")
const path = require("path")

exports.handler = (event, context, callback) => {
  const firstchunk = event.path.split("/")[1]
  const renderpath = "./" + path.join("./pages", firstchunk === "" ? "/index.js" : firstchunk + ".js")
  console.log("[render] ", renderpath)
  // let potato
  // if (fs.existsSync(renderpath)) potato = renderpath
  // else potato = "./pages/_error"
  // callback(null, {
  //   statusCode: 200,
  //   body: JSON.stringify({
  //     renderpath,
  //     event,
  //     potato
  //   })
  // })

  let page
  try {
    if (fs.existsSync(renderpath)) page = require(renderpath)
    else page = require("./pages/_error")
    event.requestContext = {}
    compat(page)(event, context, callback)
  } catch (err) {
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        renderpath,
        event,
        err
      })
    })
  }
}
